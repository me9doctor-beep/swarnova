# Phase 13 — Cross-System Workflow Integration & Platform Audit

**Date:** 17 September 2026
**Branch:** `arena/01a0aeb0-swarnova`
**Scope:** the seams between the systems Phases 0–12 built — storefront, AI Studio,
virtual try-on, bag/checkout, customer account, Admin console, Super Admin
governance, Employee branch console, the canonical mock store and the data
provider boundary. Audit first; changes only where an integration link was
demonstrably broken, stale or unsafe.
**Explicitly out of scope:** new modules, new screens beyond the one required by
§9/§15, real APIs, real AI/CV inference, real payments, cloud storage, a new
auth provider, any redesign, and any TypeScript.

Verification at the end of the phase: **107 tests, 0 failures** (85 carried in
from Phases 8–12, all still green; 22 new Phase-13 seam tests) and a clean
`vite build` of the single-file bundle.

---

## 1 · Verdict by audit area

| # | Area | Verdict |
|---|------|---------|
| 1 | Router / module wiring | **1 defect found → fixed.** All four experiences now mount real components; proved by rendering the real `routeTree` (68 concrete paths). |
| 2 | Canonical data ownership | **2 defects found → fixed.** The fitting room and the saved try-on shelf were the only bag entry points that did not re-resolve the catalogue; two order lines carried stale snapshots. |
| 3 | Customer ↔ staff identity | **Clean.** Two separate auth domains, no cross-read, no credential ever emitted, owner-partitioned client state with a one-way guest adoption. Now asserted, not just designed. |
| 4 | RBAC & branch scope | **Clean, one capability added.** No account's reach widened. Super Admins (and head-office Admins) can now *name* a branch; a branch-scoped account that tries is refused. |
| 5 | Order ↔ inventory state sync | **2 gaps found → fixed.** Order status changes moved no stock, and the seeded `reserved` column disagreed with the order book. One rule now holds both ways, in the store and in the fixtures. |
| 6 | Cart / pricing | **Clean.** One pricing path (`pricingService.calculateTotals`); no surface computes money of its own. |
| 7 | Media & asset boundary | **Clean**, with one contract gap documented (§8.1). The S3 migration boundary is still one provider method deep. |
| 8 | Navigation & link integrity | **2 classes of defect found → fixed.** 26 content links pointed at routes the platform has never had, and every internal content link was a hard `<a>` navigation. |
| 9 | UX continuity & shared primitives | **2 hand-rolled overlays found → replaced.** Both customer modals now use the platform's single `Dialog`. |
| 10 | Backend readiness | **Contract-shaped and honest.** Read-only reads, actor-forwarding mutations, audit on every write. Genuine gaps are listed in §8 rather than claimed away. |

---

## 2 · Defects found and fixed

### 2.1 The checkout routes mounted components that were never imported
`src/app/router.jsx` referenced `CheckoutPage` and `OrderConfirmationPage` in the
route table without importing them. Every other import in that file is used;
these two bindings did not exist, so the JSX resolved to an undefined element
type. `vite build` does not catch it (esbuild emits a bare global reference), and
the Phase-12 wiring test only reads the router's *source text*, so both checks
were green over a broken checkout.

*Fixed:* both imports added. *Guarded:* `phase13-integration.test.mjs` walks the
**real** exported `routeTree` and fails if any route's element is not a function,
plus explicit assertions that the two imports exist. Removing either import now
turns the suite red (verified by experiment).

### 2.2 The bag could be filled with a snapshot instead of the product
`CartContext.add(product)` stores whatever it is handed. The catalogue surfaces
hand it the canonical record; the two id-only journeys did not:

* `VirtualTryOnPage` added the fitting room's own `jewellery` summary — a
  presentation object that carries a price only because the product happened to
  have one when the room resolved it.
* `SavedTryOnsPage` added a *saved* snapshot of that summary: a bag line built
  from what the catalogue said at try-on time, and — for an AI concept — a
  purchasable-looking line for a piece that is not a product at all.

*Fixed:* `src/hooks/useAddProductToBag.js` (one hook, used by both surfaces)
re-resolves the id through `catalogService.getProduct` → provider → canonical
store, adds that record, and reports `added: false` with reason
`"missing-id" | "unavailable"` when the catalogue answers `null` — which is what
a retired, unpublished or never-existent piece does for the entire rest of the
storefront. The fitting room and the saved shelf now show `room.bagUnavailableMessage`
(`role="alert"`) instead of a false success, and the saved shelf's action set is
gated on `sourceType === "product"` rather than on a stale id check.
`AiStudioPage` is deliberately untouched: its drafts are concepts, never
canonical product ids, and they were never offered "add to bag".

### 2.3 Two order lines disagreed with the catalogue they came from
`src/mock/data/orders/index.js` snapshots product fields on each order line
(correct historical semantics — `getOrder` is a pure snapshot read). Two lines had
drifted from the canonical product of the same id:

* `ORD-2026-9302` → `JWL-003 Aabharan Drop Earrings · SWN-ERG-022 · ₹84,900` (with `subtotal`/`total` reconciled to match).
* `ORD-2026-9214` → `JWL-004 Lumina Tennis Bracelet · SWN-BRC-008 · ₹1,12,500` (reconciled likewise).

*Fixed in data, not in code:* the provider's read is right; the fixture was
stale. *Guarded:* the new test asserts every line's `name`/`sku`/`price`/`href`
equals the canonical product's, that `subtotal` is the sum of the lines, that
`total === subtotal + shipping`, and that `taxAmount` is exactly the extraction
`pricingService` performs (`round(total − total / (1 + GST_RATE))` — asserted
against `GST_RATE`, so no second pricing rule was introduced). All 12 orders
carried `subtotal`/`shipping`/`total` but no tax field at all; `taxAmount` is now
present on every one.

### 2.4 Order lifecycle moved no stock, and the seed's `reserved` was fiction
`placeCheckoutOrder` already moves pieces from `available` to `reserved` and
writes a ledger row. `updateAdminOrderStatus` — the one lifecycle function,
shared by the Admin console and the Employee console through
`updateEmployeeOrderStatus` — changed a string and appended an audit entry, and
left the pieces reserved forever. A cancelled order's jewellery never came back
to the vitrine. Meanwhile `src/mock/data/inventory/index.js` carried
`reserved` values that matched no order: reservations on rows whose orders had
shipped or been cancelled, and no reservation for several genuinely open orders.

*Fixed on both sides, in one change:*

* **Provider rule** (`applyOrderStockEffect`, called only from
  `updateAdminOrderStatus`): `Shipped` retires the allocation — `reserved` drops,
  `available` is untouched, because the sale was already booked at allocation, so
  no ledger row is invented. `Cancelled` retires it *and* returns the pieces to
  `available`, writing one `receipt` movement
  ("Returned to free stock — order … cancelled."). Release is
  `min(row.reserved, line.quantity)`, so a piece that was never reserved on that
  row can neither go negative nor be conjured into existence. `DESIGN-…` concept
  lines resolve to no stock row and are ignored. The audit entry now states the
  stock consequence in the same line as the status change, and
  `features/admin/operations.js` confirmation copy says so too (one copy,
  consumed by both consoles).
* **Seed alignment** — the 9 rows needed for `reserved` to equal exactly the open
  order book, with `available` moved only where a cancellation or a hand
  allocation explains it: `STK-001-BR-001` 6/1→6/0, `STK-001-BR-002` 2/0→0/2,
  `STK-002-BR-001` 8/2→8/0, `STK-002-BR-002` 5/1→5/0, `STK-004-BR-001` 4/0→3/1,
  `STK-005-BR-003` 3/1→3/0, `STK-006-BR-001` 7/0→6/1, `STK-007-BR-001` 5/1→6/0,
  `STK-007-BR-002` 2/0→1/1. Every row the existing tests pin
  (`STK-005-BR-001`'s low-stock state, `STK-003-BR-001`'s +3 adjustment,
  `STK-001-BR-001`'s available) is untouched, and the invariant is now stated in
  the fixture header and asserted for all 23 rows.

*Consolidated while there:* the stock ledger had three writers building the same
object and two id shapes (`MV-${Date.now()}` could collide inside one
millisecond; the seeded ids are `MV-2026-01nn`). One internal `appendMovement`
now serves checkout, adjustments and cancellations, so the log the branch reads
and the log the storefront implies cannot disagree on shape.

### 2.5 Twenty-six content links pointed at routes that do not exist
`site/index.js` wrote page-scoped anchors (`#collections`, `#stores`, …). Outside
the homepage those resolve against whatever page the visitor is standing on — i.e.
almost always nowhere. The journal cards pointed at `/journal/<slug>`, the
boutique cards at `/stores/<city>`, and the homepage's own CTAs at
`/our-story`, `/journal`, `/stores`, `/gold-rates`, `/bespoke`, `/track-order` —
none of which is a route in this app.

*Fixed as data, against the routes that do exist* (creating `/stores`, `/journal`,
`/our-story`, `/gold-rates` or the legal pages would be new modules, which this
phase forbids):

| Fixture | Was | Now |
|---|---|---|
| `site` navigation + footer columns | `#top` `#collections` `#our-story` `#journal` `#stores` `#gold-rate` | `/#top` … (same anchors, homepage-qualified) |
| `site.customerService` · Track Order | `/track-order` | `/account/orders` (auth-guarded, so guests bounce to sign-in) |
| `site.experience` · Custom & Bespoke | `/bespoke` | `/ai-studio` (the bespoke composition surface) |
| `site.experience` · Book a Private Viewing | `/stores` | `/#stores` |
| `homepage` · Brand promise ×2, AI triptych | `/our-story`, `/our-story#ai` | `/#our-story` |
| `homepage` · Gold rate board | `/gold-rates` | `/#gold-rate` |
| `homepage` · Stores, Journal | `/stores`, `/journal` | `/#stores`, `/#journal` |
| `campaigns` · secondary CTA | `/stores` | `/#stores` |
| `branches` ×3 | `/stores/<city>` | `/#stores` (`id` kept as the future route key) |
| `journal` ×3 | `/journal/<slug>` | `/#journal` (`slug` kept as the future route key) |

*Guarded:* the new test reads the real route patterns out of `routeTree` and
validates every `href` written into `src/mock/data/**`, with one named allowlist
of the eight support/legal paths that are written copy for unwritten pages
(`/contact /faq /shipping /returns /warranty /care-guide /privacy /terms` —
reported in §8.4, and left in place because deleting valid mock content is not a
link fix). A new unrouted link fails the suite; the homepage-section ids come from
the canonical homepage document itself, so a renamed section cannot silently
strand a link.

### 2.6 Every internal content link reloaded the document
`Button` and `IconButton` already routed internal paths through react-router; the
surfaces that render canonical content did not: `TextLink`, `Card.Media`, the
product/branch/journal/collection card titles, the header's desktop and mobile
navigation, and the footer's three link columns plus its legal row. A click on
"Collections" or a product title was a hard navigation — fatal in the shipped
artefact, which is one `index.html` with no server to answer `/collections`, and a
full document reload (session rehydration, scroll reset) everywhere else.

*Fixed with one rule in one place:* `src/utils/links.js` (`isInternalPath`,
`isExternalUrl`, `externalLinkProps`) plus `src/components/ui/ContentLink.jsx`,
the unstyled anchor that applies it. `Button`, `IconButton`, `TextLink`,
`Card.Media` and the card/header/footer surfaces all consume it, so the rule is
not restated anywhere; `tel:`/`mailto:`/absolute URLs and bare `#section` anchors
stay native on purpose. The consoles' own navigation already used `Link` and is
unchanged.

*One consequence handled:* `/#collections` from another page now lands on the
homepage with that hash, and `HomePage` honours it — one effect that scrolls an
existing section into view instantly (no smooth behaviour, no new animation, the
sections already reserve `scroll-mt-28` for exactly this) and quietly does nothing
for an unknown hash, following the precedent `ProductsPage` set for `/products#search`.

### 2.7 Two customer overlays were hand-rolled
`SavedDesignsPage` and `SavedTryOnsPage` each built their own fixed-inset modal:
own backdrop, own close button, own `role="dialog"`, no Escape handling, no focus
management, no scroll lock.

*Fixed:* both now render the single `src/components/ui/Dialog.jsx` the consoles use
(same primitive, so the same Escape/backdrop/focus/scroll behaviour, and
`aria-labelledby` wired through the panel's own title). The editorial content is
unchanged — the uppercase kind-line moved into the Dialog header, the piece name
stays a serif `h3` in the body. No new abstraction: two files got shorter.

---

## 3 · The one thing added, and why it was required

`§9` names the branch drill-down a hard requirement ("global view → select branch
→ drill in → return") and `§15` requires Super Admin global visibility *with*
branch drill-down. The provider already scoped branch lists for exactly that
audience, so this was the missing read path, not a new subsystem:

* **Provider:** `employeeOverview`, `employeeBranchOperations` and `employeeReports`
  accept an optional `{ branchId }` query, resolved through the existing
  `resolveScopeBranch` via one new internal `viewBranchId` helper. A global account
  may name any branch; a branch-scoped account naming another is refused by the
  same code that has always refused it; naming nothing behaves exactly as before.
  `mockProvider` and `employeeOperationsService` forward the query unchanged — no
  scope is decided in the service layer, and no second branch API was created.
* **Hooks:** `useEmployeeOverview` / `useEmployeeBranchOperations` /
  `useEmployeeReports` take the same optional query, keyed like every other list
  hook. Existing callers pass nothing and get what they always got.
* **Page:** `src/pages/super-admin/organization/BranchDrillDownPage.jsx` at
  `/super-admin/branches/:branchId` — the boutique's day (sales today, open
  orders, floor stock, restock pressure), its order book by state with what waits
  at the counter, stock needing attention and top movers, its team and its
  activity trail. Read-only by design: enabling a branch, moving stock and
  governing the catalogue stay with the pages that already own them. An id that is
  not in the canonical branch list renders a stated "Branch not found" with the
  way back, rather than an error thrown from the provider.
* **Return path:** `BranchesPage` rows open it (name + Inspect), the page carries
  "All Branches", and the crumb appears in the console breadcrumb.
  Enterprise density, existing tokens, no new visual language.

No new dashboard system, no duplicate employee view, no parallel store.

---

## 4 · What was verified and found already correct

These were audited for defects and passed, which is the point of an integration
audit; each is now also asserted or evidenced.

* **One canonical book, everywhere.** Products, categories, collections, branches,
  customers, orders, inventory and media exist once, in the governance store; the
  storefront, the Admin console, the Super Admin queues and the branch consoles
  read the same records. `createGovernanceStore()` seeds 12 products (8 published,
  1 each draft/submitted/approved/rejected), 12 orders, 6 customers, 23 stock rows
  over 3 boutiques, 12 media items. `order-audit`-style cross-checks run in CI now:
  the order book agrees with the catalogue line by line.
* **Deep links are canonical.** Every product's `href` is `/product/<its own id>`;
  the order book, the wishlist, the saved shelves and the try-on room all carry
  that id, and the tests re-derive the path instead of trusting the fixture.
* **Pricing has one source.** `calculateTotals` is the only place money is summed;
  the cart, checkout summary, the confirmation screen, the order snapshot and the
  reports all take it. No `+ shipping`, no `* 1.03` anywhere else in `src/`.
* **Wishlist and saved shelves store ids, not copies** — resolved against
  `useProducts()` at render, which is what let the try-on fix be a two-line change.
* **Customer ↔ staff identity stay separate.** The customer session is the
  authenticated id alone (`localStorage("swarnova.customer.session")`,
  re-resolved against the store on every read); the staff session is capability
  state held by `AuthProvider`, read by `RoleBoundary`/`RequireCapability` and by
  no customer surface. Neither domain reads the other;
  `RequireCustomer` and `RoleBoundary`/`RequireCapability` never mix. Serializers
  run through `withoutCredential`, and unknown id and wrong password answer with
  the identical envelope. Registration writes into the one customer book and is
  immediately visible to the Admin console — asserted.
* **Client state is owner-partitioned.** Bag, wishlist, saved designs and saved
  try-ons are keyed per owner with a single one-way guest adoption, and a member's
  collection is never handed back on sign-out — asserted against the real
  `resolveOwnerValue` rule.
* **Every mutation is audited provider-side**, with actor label, branch where the
  action belongs to one, and the written reason where the business requires one;
  the log is capped and ordered, and the Super Admin's Audit Logs page reads the
  same array.
* **Media is used, not shadowed.** `deriveMediaUsage` counts real references, a
  used asset cannot be deleted, uploads are capped at 5 MB, and the mock asset
  catalogue stays behind `src/mock/assets` — the S3 boundary is still exactly one
  provider method deep, as Phases 7–8 designed it.
* **Stock state is derived, not stored** (`out > low > ok` from `available` vs
  `reorderLevel`), so a restock or a cancellation re-classifies a row with no
  second write anywhere.
* **Layering holds across the whole tree.** No file under `pages`, `components`,
  `hooks`, `layouts`, `state` or `features` imports `mock/data` or `mock/assets` —
  enforced by a filesystem walk, not by convention.
* **The stack is unchanged.** No `.ts`/`.tsx`/`tsconfig.json`, no new dependency of
  any kind (React 19.2.6, react-router 7.18.4, Vite 7, Tailwind 4, clsx /
  tailwind-merge / lucide-react / prop-types, as before).

---

## 5 · Regression posture against Phases 0–12

* 85 tests carried in: **all still pass, unmodified.** Not one assertion was
  weakened, skipped or rewritten to accommodate this phase.
* The Phase-12 checkout tests pin exact stock deltas on `STK-001-BR-001`; the
  Phase-10 employee tests pin `STK-005-BR-001`'s low-stock state, the
  cross-branch refusal on `STK-001-BR-002` and relative adjustments on
  `STK-001/002-BR-001`; the console regression test pins `STK-003-BR-001`
  (+3 → movement) and the exact breadcrumb set. Every one of those rows was
  chosen to survive the seed alignment, and the alignment was derived *from* the
  order book rather than from what would make the tests pass.
* Homepage structure, section registry, CMS block contract and every visual token
  are untouched: the only homepage change is the hash-arrival effect in `HomePage`,
  which no section, order or copy depends on.
* `vite build` clean: `dist/index.html 4,910.27 kB │ gzip 3,173.68 kB`.
* Static render sweep of all 68 concrete paths (guest, Super Admin, Admin,
  Employee) with the real data router: no throw, and every console path renders
  its shell.

---

## 6 · Commands

```bash
cd frontend
npm test           # 107 tests · 107 pass · 0 fail
npx vite build     # single-file bundle, clean
```

---

## 7 · Deliberately not done

No new modules, screens or states beyond the §9/§15 drill-down. No `/stores`,
`/journal`, `/our-story`, `/gold-rates`, `/contact` or legal pages (that would be
building features this phase forbids, so their content links resolve to the
in-app Not Found screen with the copy that names them). No second cart, no second
catalogue, no second error system, no fetch/axios, no real payment or AI calls, no
backend invented behind the provider, no animation library and no motion added —
the one scroll in this phase is a destination, not an effect. Existing mock assets
were retargeted, never deleted; the owner-scoped client-state contract, the
`emit()` deep-clone boundary and the `governanceStore.js` export surface are
unchanged apart from the additive `query` parameters above.

---

## 8 · Backend contract gaps (documented, not papered over)

These are honest limits of what the frontend can assert today. None is fixed here,
because fixing them means a server.

1. **Media usage is matched by `src` equality, not by id.**
   `deriveMediaUsage` scans product media for the same `src` string; two records
   pointing at one file are indistinguishable. A real service needs a media id on
   every reference (and a usage endpoint that reads the join table), or
   "delete refused while used" can be wrong in both directions.
2. **Reservations are recomputed, not accounted.** There is no per-order-line
   allocation record: `available`/`reserved` are mutated directly, so a
   cancellation can only release `min(reserved, quantity)` on the row rather than
   exactly what the order took, and two boutiques' claims on one piece cannot be
   reconciled after the fact. A backend needs an allocation table keyed by
   `(orderId, orderLineId, stockRowId)` — this phase deliberately did not invent
   one in the mock, because the UI needs no such table and it would have become a
   parallel model.
3. **`taxAmount` is stored but displayed nowhere.** The checkout summary and the
   order surfaces present GST as "Included in the price", which is the current
   business copy; once an invoice is required, the field is already on the record
   and reconciles with `pricingService`.
4. **Eight content slots have no page.** The footer's support and legal links are
   written copy for unwritten pages; the journal and boutique fixtures keep their
   `slug`/`id` as the stable identity a future `/journal/:slug` or `/stores/:id`
   would resolve, which is why their `href` was retargeted rather than their
   content removed.
5. **The Super Admin has no order-detail screen.** The drill-down shows an
   order's state and value, not a fulfilment page; the Admin and Employee consoles
   own that record. Adding a Super Admin order page would duplicate a surface that
   already exists — deliberately not done.
6. **The audit actor is a display label string.** Mutations forward
   `{ id, role, label }` and the store writes `label` (or the branch-scoped
   `scope.label`) into the trail. A backend must take an identity and resolve it
   server-side; the transport is already shaped for that, the string is not.
7. **Idempotency is process-local.** `checkoutKeys` lives in the store, so a
   replayed order is safe within one session and not across a restart. A real
   service persists the key against the order.
8. **Movement ids are mock-shaped.** `MV-2026-01nn` from a store counter is fine
   for one in-memory book and is now consistent across all three writers; a
   backend owns sequence generation.
9. **The staff session does not survive a reload.** `AuthProvider` holds the
   session in React state by Phase-0 design ("no storage, no tokens, no
   network"), and no later phase was authorised to invent a persistence scheme —
   hydrating a fake token into `localStorage` would be a new auth system, not an
   integration fix. A refresh in any console therefore returns to
   `/staff/login`, while the customer's own session and collections persist. The
   seam is ready: `initialSession` at the composition root, or `signIn(session)`
   after a real session-bootstrap endpoint.
10. **Media is inlined in the shipped bundle.** `vite-plugin-singlefile` produces a
   ~4.9 MB `index.html` with every asset base64-inlined; the mock asset module is
   the seam a real CDN URL replaces without touching a component.
