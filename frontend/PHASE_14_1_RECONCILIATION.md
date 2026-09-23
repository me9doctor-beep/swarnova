# Phase 14.1 — P1 resolution and BRD/PRD reconciliation

This document records how the repository now stands against `frontend/SWARNOVA_BRD_PRD_v2.0.md`. It does not replace, rewrite, or silently reinterpret that BRD/PRD. There is no second BRD or PRD in the repository. Phase 14.0’s audit (`PHASE_14_AUDIT.md`) remains the inspection that named these gaps; this file is the resolution record.

Phase 14.1 is not a feature-expansion phase. Candidate capabilities in BRD §5 were not implemented.

## Classification

| Class | Meaning |
|---|---|
| Implemented | Present in this frontend, on the canonical mock contract. |
| Production / backend dependency | The frontend seam exists, or the behaviour is intentionally not faked. A real provider, persistence layer, or external system is still required. |
| P1 resolved | A contradiction named in BRD §34, closed in this phase by a recorded decision. |
| Not in this phase | A real gap that §34 did not put in the 14.1 resolve list. Left as-is. |
| Future feature | Named by the BRD as candidate, future, or requiring a later decision. Not built. |

## Requirement matrix

Phase 14.1 only. Status words are the audit vocabulary. The BRD/PRD was not edited.

| Requirement | Current Implementation | Status | Action |
|---|---|---|---|
| P1.1 One shared order-status vocabulary | `features/orders/orderLifecycle.js` is the store and every audience's reading. Placed → Confirmed → Processing → Shipped → Out for Delivery → Delivered. Ready is recognized, not a second dispatch write. | IMPLEMENTED | None |
| P1.1 A new order begins as Placed | `placeCheckoutOrder` writes `status: "Placed"`. Confirmation copy says placed, not confirmed. | IMPLEMENTED | None |
| P1.1 Customer list and detail display Placed | Account list, detail, and confirmation render `orderStatusMeta` / `customerReceiptTitle` from that contract. | IMPLEMENTED | None |
| P1.1 Admin, Employee, and Super Admin see the same status | Admin and Super Admin read `listAdminOrders` / `getAdminOrder`. The fulfilling employee reads `listEmployeeOrders`. All display `orderStatusMeta`. | IMPLEMENTED | None |
| P1.1 Cancel before dispatch; not after | `ORDER_FLOW` allows Cancelled from Placed, Confirmed, Processing, and an existing Ready record. Shipped cannot be cancelled. Cancellation marks payment for return; it does not write Refunded. | IMPLEMENTED | None |
| P1.1 Returned, Refunded, Failed, On Hold stay recognized | Meta labels those values. They are not drawn as Placed and are not operational actions. | IMPLEMENTED | None. No return, refund, failure, or hold workflow. |
| P1.1 Live carrier events, pickup, refund settlement | Not built. Out for Delivery does not call a courier. | BACKEND-DEPENDENT | Do not invent a carrier or refund processor. |
| P1.2 Super Admin can oversee global orders, customers, and inventory | `/super-admin/orders`, `/customers`, and `/inventory` mount the Admin pages through `OperationalRoute`. The calls are the unscoped canonical book. | IMPLEMENTED | None |
| P1.2 Super Admin can select a branch, drill in, and return to global | `?branch=` filters the shared book. `/super-admin/branches/:branchId` is the boutique lens. Omitting the branch returns the organization. A client branch parameter does not widen an employee. | IMPLEMENTED | None |
| P1.2 No duplicate operational store | One `createGovernanceStore`. Super Admin does not have a second order, customer, or inventory module. | IMPLEMENTED | None |
| P1.2 Employee branch scope and Admin head-office book remain | Employee queries that name another branch are refused. Head-office Admin still uses the shared book. | IMPLEMENTED | None |
| P1.2 Server is the authorization authority | The mock store re-checks scope. The UI is not a server. | BACKEND-DEPENDENT | A server must enforce the same scope. |
| P1.3 Governance switches enforce AI Studio and Virtual Try-On | Settings → provider `assertStorefrontFeature` → `getStorefrontFeatures` → shell reading and `RequireStorefrontFeature`. Unknown is not open. | IMPLEMENTED | None |
| P1.3 Direct URL cannot bypass a disabled feature | `/ai-studio` and `/virtual-try-on` are wrapped by the route guard. A closed reading shows the existing unavailable notice. | IMPLEMENTED | None |
| P1.3 Contextual CTAs use the same state | Navigation, footer, homepage, product Try-On, account doors, and generated-design handoff call `isFeatureOpen` / `filterFeatureLinks`. | IMPLEMENTED | None |
| P1.3 Saved designs and saved try-ons survive a disable | Settings updates do not touch the owner-scoped client partitions. Re-enabling is the next read of the same switch. | IMPLEMENTED | None |
| P1.3 Production model and computer vision | Fixture renderer and fixture fitting room only. | BACKEND-DEPENDENT | Do not fake a model or CV. |
| P1.4 Reconcile this product definition with the BRD/PRD | This matrix, against `SWARNOVA_BRD_PRD_v2.0.md`. That document was not rewritten. | IMPLEMENTED | None |
| P1.5 Contact, FAQ, shipping, returns, warranty, care, privacy, terms | House pages in `customerService.js`, mounted on the existing footer hrefs. Not a CMS and not counsel-reviewed instruments. | IMPLEMENTED | None |
| P1.5 Track Order | `/account/orders`, behind the existing customer sign-in. | IMPLEMENTED | None |
| P1.5 Our Story, Journal, Stores | Homepage sections. Not removed. | IMPLEMENTED | None |
| P1.5 Custom intake, private-viewing booking, ticket form, return portal, courier page | Custom still opens AI Studio. Viewing and fitting links open `/#stores`. No intake was added. | FUTURE | Do not implement in 14.1. |
| §5 candidates: Compare, Ring Sizer, Visual Search, AI Concierge, Style DNA, Vault, Appointments, Reserve & Visit, Clienteling, Reviews, Notify Me, Product Intelligence | Not present. | FUTURE | Do not implement. |
| Storefront-offline maintenance page | The setting records that a notice is not enforced. Browse and shop stay open. | FUTURE | Do not implement a maintenance page. |
| CMS editing of hero copy and media | Governance can show, hide, and reorder sections. It cannot rewrite section content. | BACKEND-DEPENDENT | Not this phase. |
| Live browser, screen-reader, payment, and courier checks | Not run. | NOT VERIFIED | Do not claim them. |

## Decisions taken

### P1.1 Order lifecycle — resolved

One vocabulary, `frontend/src/features/orders/orderLifecycle.js`, is what the store and every audience read.

Operational path enforced by the store:

**Placed → Confirmed → Processing → Shipped → Out for Delivery → Delivered**

Shipped is the stored value of the BRD stage READY/SHIPPED. Ready, if a record already carries it, is the same journey step and can move to Shipped; it is not a second dispatch status. Out for Delivery is the next operational stage. Cancelled is allowed from Placed, Confirmed, Processing, or Ready, and not after dispatch. A newly placed order’s receipt title remains “your order is placed”. Confirmation is a later house action, not a synonym for checkout.

Returned, Refunded, Failed, and On Hold stay recognized so they are never drawn as Placed. They are not actions. Pickup, live carrier events, returns, refunds, failure, and hold are not workflows in this release. Stock stays reserved through Placed, Confirmed, and Processing; Shipped retires the allocation; Out for Delivery does not move stock again; Cancelled before dispatch returns it to free stock.

### P1.2 Super Admin operational authority — resolved

Model chosen: **inherited operational screens, not a second store, and not a read-only clone.**

`/super-admin/orders`, `/super-admin/orders/:id`, `/super-admin/customers`, `/super-admin/customers/:id`, `/super-admin/inventory`, and `/super-admin/reports` mount the existing Admin pages through `OperationalRoute`. The only difference is the route prefix (`/super-admin`). The pages call the same unscoped order, customer, inventory, and report contracts Admin already uses. Super Admin’s `*` permission already grants every capability those screens check; no new permission was added.

Branch drill-down remains the boutique lens. Employee scope is unchanged. Admin overview links still point at `/admin/...`. The command centre was not redesigned; it gained an operational-oversight strip and sidebar group that open the shared book.

### P1.3 AI Studio and Virtual Try-On availability — resolved as enforcement

`platformSettings.features.aiStudio` and `virtualTryOn` are not informational. The chain is governance settings → canonical provider → `getStorefrontFeatures` → the customer shell and the route guard. There is no second flag store, and pages do not decide the switch.

- Unknown is not open. Navigation, footer, homepage sections, product Try-On, account doors, and generated-design handoff offer a feature only after the provider has answered and the switch is on.
- `/ai-studio` and `/virtual-try-on` sit behind `RequireStorefrontFeature`. A direct URL reads the provider again and, when the switch is off, shows the existing unavailable notice. The fitting room is not rebuilt.
- Saved designs and saved fittings stay. Re-enabling is the next read of the same switch: the shell refetches on navigation, and entering the route reads the provider again.
- `generateAiDesign`, `createAiVariations`, `refineAiDesign`, and `createTryOn` refuse with `FEATURE_UNAVAILABLE` when the switch is off.

The fixture renderer is still not production AI, and the fitting room is still not production computer vision. Those remain production dependencies (BRD §11, §12, §35).

### P1.5 Customer-service destinations — resolved by approving house pages

The eight configured paths that 404’d now resolve:

| Path | Page |
|---|---|
| `/contact` | Care desk from the site contract, plus stores. No ticket form. |
| `/faq` | Answers that match the storefront as it behaves. |
| `/shipping` | The one complimentary insured courier. No tracking page. |
| `/returns` | Cancellation before dispatch is a house action. No return portal. |
| `/warranty` | Hallmark and lifetime care as already announced. No certificate download. |
| `/care-guide` | Guidance only. No repair booking. |
| `/privacy` | What this storefront actually keeps. |
| `/terms` | The order and feature contract a customer can already observe. |

Copy lives in one module, `features/storefront/customerService.js`, rendered by one page. It is not a CMS. Privacy and terms are house notices for this release, not counsel-reviewed production instruments.

Footer and secondary destinations, audited against the current product definition. No Coming Soon route was added.

| Destination | Decision |
|---|---|
| Home, Collections, Jewellery, Our Story, Journal, Stores, Gold Rate Board | KEEP. Homepage sections or catalogue routes that already exist. |
| AI Studio, Virtual Try-On, Custom & Bespoke | KEEP. Custom remains the atelier, not a bespoke intake (BRD §13). Hidden while AI Studio is paused. |
| Book a Private Viewing, Book a Fitting | KEEP + DEFER booking. Both open `/#stores`. A fitting or viewing workflow is not in this release. |
| Contact, FAQs, Shipping, Returns, Warranty, Care Guide, Privacy, Terms | KEEP + IMPLEMENT. The eight house pages. Not recreated. |
| Track Order | KEEP. `/account/orders`, behind the existing customer sign-in. |
| Social profiles | KEEP as external channels. They are not customer routes and were not given placeholder pages. |

### Storefront offline — recorded, not enforced

Setting the storefront offline writes an honest note: a customer maintenance notice is not enforced in this release. Browse and shop stay available. That notice was not built.

## Reconciliation against the BRD/PRD

### §5 Product scope

| Item | Class |
|---|---|
| Storefront, catalogue, collections, categories, product detail, search/filter/sort, wishlist, cart, checkout, orders, account, branch discovery | Implemented on the mock contract. Production persistence, pricing schema, and search depth remain dependencies (§9, §35). |
| AI Studio, Virtual Try-On | Implemented as fixture experiences, now gated by platform switches. Production model/CV is a dependency. |
| Customized jewellery as a full workflow | Not in this phase. Contextual AI path only (BRD §13 already says the complete workflow is absent). |
| Staff auth, multi-branch operations, inventory, content/campaign governance, media, gold rate, employees, RBAC, audit, reports | Implemented on the mock contract. Server authorization and durable storage are dependencies. |
| §5 candidates (Compare, Ring Sizer, Visual Search, Concierge, Style DNA, recommendations, Recently Viewed, Notify Me, Reviews, Branch Availability, Reserve & Visit, Appointments, Vault, Care/Repair intake, Gift, Custom Request intake, Clienteling, Product Intelligence) | Future feature. Not implemented. |

### §6–§7 Users and authorization

| Item | Class |
|---|---|
| Customer identity separate from staff | Implemented. |
| Super Admin organization-wide oversight of orders, customers, inventory, reports | P1 resolved, by the inherited-screen model above. |
| Admin head-office book; Employee branch scope that a client cannot widen | Implemented. |
| Frontend permission checks as the only authority | Production / backend dependency. The UI remains a convenience; the mock store re-checks staff scope. A server must become the authority. |

### §8 Storefront and homepage

| Item | Class |
|---|---|
| Primary nav Home, Collections, AI Studio, Stores | Implemented. AI Studio is omitted when the switch is off. |
| Homepage sections, visibility, and order | Implemented. AI and Try-On sections follow the same switches. |
| CMS-authored hero copy, media placement, CTA editing | Not in this phase. Governance can show, hide, and reorder; it cannot rewrite section content. Production CMS dependency. |

### §9–§10 Catalogue and product detail

| Item | Class |
|---|---|
| Listing, name/SKU search, category and price filters, sort, product detail, add to cart, wishlist, related pieces | Implemented. |
| Buy Now, Enquire/Customize as a request, branch availability, pickup, variants/sizes, making charges, stone lines, certificates | Not in this phase. The BRD itself says the commercial product schema must be agreed before the product UI expands. |
| Virtual Try-On on an eligible piece | Implemented, and hidden when the feature is off. |

### §11–§12 AI Studio and Virtual Try-On

| Item | Class |
|---|---|
| Prompt, type, style, occasion, purity, variations, refine, save, share, try-on continuation | Implemented as the fixture atelier. |
| Photo, jewellery, result, retry, change, save, share, catalogue continuation | Implemented as the fixture fitting room. |
| Availability switches | P1 resolved. Provider refusal, shell reading, and route guard. |
| Real model, moderation, jobs, cost, CDN, consent, retention, CV quality | Production / backend dependency. Not faked. |

### §13 Customized jewellery

Future feature for the submitted → manufacturing lifecycle. Not implemented. AI concepts are not a custom-order workflow; the terms page says so.

### §14 Customer account

| Item | Class |
|---|---|
| Profile, addresses, orders, wishlist, saved designs, saved try-ons | Implemented, owner-scoped on the mock. |
| Customization requests, notifications | Not in this phase. |
| Cross-device persistence | Production / backend dependency. |

### §15 Cart, checkout, and orders

| Item | Class |
|---|---|
| Customer-gated checkout, owned address, canonical delivery and payment methods, quote, idempotent placement, bag clear on success | Implemented on the mock. |
| Shared status vocabulary and consistent Placed rendering | P1 resolved. |
| Server quote, gateway, webhooks, reconciliation, refunds, recovery, notifications | Production / backend dependency. Checkout does not collect card secrets and does not pretend to be a gateway. |
| Ready / Shipped and Out for Delivery | Operated. Shipped is the stored Ready/Shipped stage. Out for Delivery follows it. No carrier feed. |
| Returned, Refunded, Failed, On Hold as operable steps | Recognized only. Not actions. |

### §16 Inventory and transfers

| Item | Class |
|---|---|
| Branch available/reserved/reorder, reasoned adjustment, movement ledger, allocation on place, release on ship, return on cancel | Implemented on the mock. Confirmed holds the reservation and does not move stock. |
| In transit, sold, returned, damaged, lost, archived, and the transfer lifecycle | Future feature / production dependency. Not implemented. |
| Database locking, reservation expiry, warehouse, transfers | Production / backend dependency. |

### §17 Branch and omnichannel

| Item | Class |
|---|---|
| Directory, identity, hours, status, branch operations, employee scope, Super Admin drill-down | Implemented. |
| Pickup, reserve and visit, appointments, private-viewing booking, product reservation, transfers | Future feature. “Book a Private Viewing” remains a stores anchor. |

### §18 Admin

Implemented business operations on the shared book: products, orders, customers, inventory, content visibility, branches, employees, reports. Homepage and campaigns remain the limited controls they already were. No second store was added.

### §19 Super Admin command centre

Governance surfaces (overview, branches, admins, employees, products, media, categories, collections, homepage, campaigns, AI/Try-On, gold rate, roles, audit, settings) were already implemented. Global operational screens were the P1 gap and are now the inherited routes in P1.2. No command-centre redesign.

### §20–§22 CMS, media, gold rate, campaigns

| Item | Class |
|---|---|
| Homepage show/hide/reorder, campaign live/pause, category and collection governance, product lifecycle, media library | Implemented on the mock. |
| Section editor, rich text, campaign creative, scheduling, object storage/CDN, gold-rate feed | Production / backend dependency. Not expanded. |

### §23 Customer services and trust

| Item | Class |
|---|---|
| Contact, FAQ, shipping, returns, warranty, care, privacy, terms, track order | P1 resolved, as house pages described above. |
| Hallmark stated as the house already announces it | Implemented in copy. Not a new certificate system. |
| Invoice and authenticity-certificate documents | Production / backend dependency. The order book mentions them; nothing downloads. |

### §24–§29 Personalization, vault, reviews, gifts, analytics, notifications

Future feature or production dependency, matching the BRD’s own “candidate / requires a decision” language. Not implemented. Wishlist, saved designs, saved try-ons, and related products remain the current personalization surface.

### §30 Authentication

| Item | Class |
|---|---|
| Customer login, register, reset, Google seam that refuses without a backend | Implemented. Register links to `/terms` and `/privacy` outside the checkbox label. |
| Staff login, role and capability resolution | Implemented in memory. |
| Persistent sessions, PKCE, password hashing, reset delivery | Production / backend dependency. |

### §31–§33 Backend contract, security, UX

The DataProvider boundary is intact. No TypeScript was introduced. No new dependency was added. Accessibility, responsive proof, and the single-file bundle size were not re-audited in this phase; Phase 14.0’s “not verified” notes still stand.

### §34 P1 list

| Decision | Result |
|---|---|
| P1.1 Order lifecycle | Resolved. |
| P1.2 Super Admin authority | Resolved. Inherited screens, one store. |
| P1.3 AI/Try-On availability | Resolved. Enforced, not relabeled as informational. |
| P1.4 Requirement reconciliation | This document. |
| P1.5 Customer-service promises | Resolved. Routes approved; links not removed. |

### §35 Production gaps

Unchanged as a class. This phase did not add an API provider, persistent sessions, a payment gateway, a courier, notifications, a CDN, real AI, real CV, analytics, CRM, or invoice generation.

### §36–§38 Roadmap and definition of done

Phase 14.1’s own list is the work above. Phase 14.2 remains unstarted: nothing in “Approved Product Gaps” was treated as approved by the existence of a mismatch. Definition of done for a production release is not claimed.

## Explicitly not implemented

Jewellery Compare, Ring Sizer, Visual Search, AI Concierge, Style DNA, recommendations, Recently Viewed, Notify Me, Reviews, Branch Availability, Reserve & Visit, Appointments, Private Viewing booking, Jewellery Vault, Care/Repair intake, Gift Experience, Custom Request intake, Clienteling, Product Intelligence, a customer maintenance page, a return portal, a courier-tracking page, a contact-ticket form, and a second operational data store.

## Validation

Run from `frontend/` after the Phase 14.1 edits:

| Command | Result |
|---|---|
| `npm test` | **PASS — 153 tests, 0 failures, 0 skipped.** Eight of those are the Phase 14.1 P1 regressions in `src/__tests__/phase14-1-p1.test.mjs`. |
| `npm run build` | **PASS — Vite 7.3.2, 2,216 modules, built in 5.09s.** `dist/index.html` 4,948.19 kB (gzip 3,185.14 kB). |

No live browser, screen-reader, backend, payment, courier, or model-quality check was run. Those claims stay **not verified**.
