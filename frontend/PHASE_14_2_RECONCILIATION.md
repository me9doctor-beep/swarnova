# Phase 14.2 — approved product gaps: implementation and reconciliation

Date: 2026-09-24. Branch: `arena/01a0d24e-swarnova`.

## A. Executive summary

The three approved **frontend/mock intake workflows** are implemented through the existing provider boundary and canonical governance store. Customers can submit, list and inspect their own requests. Staff have minimal read-only visibility through the same service, provider and records, with existing capability and branch checks. No real backend, API provider, CRM, operational processing or Phase 15 work was started.

This is not a production launch. Records are in memory for the current page session and reset on a full reload, just like the canonical mock operational book. The forms, confirmations and account pages disclose this. No notification is sent. Production dependencies and verification limitations below are not marked implemented.

## B. Approved scope and verification

Before implementation, inspected the existing `SWARNOVA_BRD_PRD_v2.0.md`, `PHASE_14_AUDIT.md`, `PHASE_14_1_RECONCILIATION.md`, router, provider, canonical store, authentication, account and staff scope contracts. These documents all reside in `frontend/` in this checkout.

The scope was explicitly locked in the implementation session to:

1. **Custom Jewellery Intake**
2. **Private Viewing / Fitting** — appointment requests only
3. **Return / Care Intake** — enquiries only

BRD §§13 and 14 support custom intake and account requests; §17 supports boutique/private-viewing/appointment journeys; §23 supports returns and care. The audit and Phase 14.1 report correctly identify these as unimplemented candidates. No direct product-definition contradiction was found. The user's Phase 14.2 approval authorizes these three, not all candidates.

The BRD/PRD, Phase 14.0 audit and Phase 14.1 reconciliation are **unchanged**. No replacement BRD/PRD was created.

## C–E. Implemented features, customer UX and account integration

| Workflow | Create | Account list | Account detail | Initial status |
|---|---|---|---|---|
| Custom | `/custom-jewellery` | `/account/custom-requests` | `/account/custom-requests/:id` | `SUBMITTED` |
| Viewing/fitting | `/appointments` | `/account/appointments` | `/account/appointments/:id` | `REQUESTED` |
| Return/care | `/account/service-requests/new` | `/account/service-requests` | `/account/service-requests/:id` | `SUBMITTED` |

One typed `IntakePage` handles the three forms without duplicating service workflows. `IntakeAccountPage` handles lists/details; `IntakeRecord` is a domain presentation component, not a new UI primitive. Existing AccountLayout and AccountNavigation remain the account shell.

- Custom: jewellery type, style, occasion, quantity, metal, purity, stones, budget preference, requirements, optional published product, optional shared AI concept, contact context and optional preferred boutique. No preference means head-office intake, not an invented branch assignment.
- Appointments: PRIVATE_VIEWING or FITTING, an existing available boutique, preferred date, preferred local time and optional note. Dates/times are preferences; there is no slot availability, reservation or staff confirmation.
- Service: choose an owned canonical order and one of its items, RETURN_REQUEST or CARE_REQUEST, reason and description. Branch and product are derived from the order, not browser claims. No invented return eligibility policy is enforced or promised.
- Lists/details expose status, submitted information, date, branch, order and product/design references as applicable. Contact and reference names are submission snapshots. Changes to catalogue labels do not rewrite the submitted information.
- Native form validation, labelled shared Input/Select/Textarea controls, semantic headings, text status labels, disabled submission feedback and alert messages are used. Layouts reuse the existing colour/type tokens and primitives. No animation system, new CSS or dependencies were added.
- Reference/supporting image uploads are explicitly unavailable: no customer-owned durable attachment service exists. Empty attachment arrays reserve the contract, and non-empty submissions are rejected rather than pretending an upload succeeded.
- The shared demo AI concept ID is validated against provider-side concept fixtures. It is **not** a private saved-design ID or a durable snapshot of customer-specific prompt/refinement work. The form says this. Production must supply an owned design/reference service before supporting those private snapshots.

### Entry points

Custom & Bespoke now opens custom intake, without removing AI Studio. Product detail carries `productId`; the AI Studio result carries `aiDesignId`. Existing viewing/fitting calls to action now open the reusable appointment form with service context. Branch cards carry `branchId`. Order detail carries `orderId` into service intake. Returns and care house pages link to intake while retaining their information. The returns copy now distinguishes submitting an enquiry from operating a return/refund.

Routes/context are centralized in `utils/links.js` and rendered using existing Button/ContentLink/TextLink navigation. All three destinations appear in the existing account navigation.

## F. Staff / operational integration

The existing Admin, Employee and Super Admin shells expose:

- `/{audience}/custom-requests`
- `/{audience}/appointments`
- `/{audience}/service-requests`

One `IntakeOperationsPage` reads the same typed service and same canonical collection. Native expandable details provide read-only handoff information. No separate staff detail store, CRM, calendar or mutation workflow was built.

Navigation and route guards use existing **Orders & Customers / `orders.view`**. Store-side scope is re-resolved from the existing staff model. Super Admin remains global; head-office Admin is global; branch-scoped Admin remains branch-scoped. Employee capability and branch are resolved from canonical employee/profile records, not incoming permission or branch claims.

## G–H. Data contracts and provider flow

```
UI → IntakePage / IntakeAccountPage / IntakeOperationsPage
   → useIntake → intakeService → DataProvider
   → MockProvider → canonical governanceStore.intakeRequests
```

The three record types share **one** canonical `intakeRequests` collection. There is no duplicate customer, branch, order, product or request store. UI/pages/hooks do not import mock data or governanceStore.

The stable typed provider contract intentionally avoids three identical service implementations:

| Method | Result | Audience |
|---|---|---|
| `getIntakeOptions(kind)` | Contact context and relevant canonical branches/products/concepts/owned orders | Customer |
| `createIntakeRequest(kind, payload)` | Detached created record | Customer |
| `getIntakeRequests(kind)` | Detached own records, newest first | Customer |
| `getIntakeRequest(kind, id)` | Detached own record, or NOT_FOUND | Customer |
| `getOperationalIntakeRequests(actor, kind, { branchId } = {})` | Detached capability- and branch-scoped records | Staff |

`kind` is `custom`, `appointment` or `service`. Customer identity is **never** a method argument from the UI. MockProvider resolves its customer session for every read/write. Staff actor handling deliberately follows the existing mock operational contract; a future server must derive actor identity from its authenticated session, not trust a browser actor object.

### Record fields

Common: `id` (`REQ-000001` sequence), `kind`, `customerId`, `status`, `contact` snapshot, nullable `branchId`/`branchName`, ISO `createdAt`/`updatedAt`.

Custom: nullable `productId`, `aiDesignId`, `productName`, `designName`; derived `source` (DIRECT, PRODUCT, AI_DESIGN, PRODUCT_AND_AI); category, style, occasion, metalPreference, purity, stonePreference, budgetRange, description, quantity, nullable preferredBranchId and empty referenceImages.

Appointment: type (PRIVATE_VIEWING/FITTING), required branchId, requestedDate (`YYYY-MM-DD`), requestedTime (`HH:mm`, boutique local time), nullable note and empty productIds (no product reservation built).

Service: type (RETURN_REQUEST/CARE_REQUEST), orderId, orderItemId, derived productId/productName and branchId, reason, description, empty attachments. Existing order items use `id` as their product/item reference; the identity is qualified by **orderId + orderItemId**. No new line-item store was invented.

Optional text becomes null; attachments remain arrays. No form state enters records. The provider whitelists accepted fields and ignores caller-supplied customerId, id, status, timestamps, contact and service branch claims. Reads return detached copies.

### Updates and status vocabulary

**No update/transition method exists in this phase.** Customer-created custom/service records are SUBMITTED; appointments are REQUESTED. BRD custom review/quotation/approval/payment/manufacturing/quality/delivery/completion stages and appointment CONFIRMED/COMPLETED/CANCELLED are later operational vocabulary, not selectable or simulated outcomes here.

### Validation and errors

- Authenticated, enabled canonical customer required; existing `SESSION_EXPIRED` contract represents missing/expired identity.
- Kind/type enum checks; required category/description or reason/description; trimmed optional text; 160-character short fields and 2,000-character description/note limits; integer custom quantity 1–100.
- Published product and known shared demo concept references validated provider-side.
- Selected branch must exist and not be disabled. Missing/disabled branch: `UNAVAILABLE`.
- Appointment date must be a real calendar date, today or later relative to the provider clock, with valid 24-hour time. No live availability or opening-hours acceptance is implied.
- Order must be owned; item must be in that order; any supplied productId must match the selected item. Invalid/foreign references return `NOT_FOUND`, without revealing another owner's record.
- Unsupported uploads/provider operation: `UNAVAILABLE`; invalid fields/type/reference: `VALIDATION_ERROR`.
- Operational authorization uses existing scope/capability errors, including refusal of foreign branch filters. Invalid customer record IDs return `NOT_FOUND`.
- Provider failures propagate to existing alert/AsyncBoundary handling. Production HTTP/error mapping belongs to the API implementation.

## I–J. Ownership, RBAC and branch scope

Customer lists, detail and create all resolve session identity in MockProvider and verify it again in the canonical store. Changing a request ID cannot reveal a different customer's record. Changing order/item IDs cannot attach a foreign order to service intake. Staff login cannot satisfy RequireCustomer.

Guest create routes use RequireCustomer and existing loginPathWithReturnTo/safeReturnTo. Product/design/type/branch query context survives customer login. OAuth architecture and staff authentication are unchanged.

Staff reads use resolveStaffScope, existing `orders.view`, and resolveScopeBranch. Employee branch query tampering is refused. Branch Admin cannot widen authority. Super Admin can see the entire book or request an existing branch filter. Custom requests without a preferred branch are head-office/global-only until a future operational assignment system exists. Service branch comes from canonical order fulfilment.

## K. Loading, empty, success and failure states

- Static loading state via AsyncBoundary; no spinner/animation.
- Empty account list, empty operational scope and no-owned-orders service state.
- Provider unavailable, unauthorized/session, validation, not-found and submission failure messages.
- Disabled submit while pending; hook-level concurrent-submission guard.
- Success shows actual request ID and initial status, with a detail link and explicit no-notification/no-confirmation/session-lifetime copy.
- Form values remain available after a failed submission for correction/retry.
- Scoped resource keys prevent stale owner/kind/list/detail data from rendering during reused-route navigation. Browser testing found the initial detail-to-list stale-shape defect; it was fixed and the browser regression now exercises that navigation.

## L. BRD/PRD reconciliation

| Requirement | Classification | Reconciliation |
|---|---|---|
| Custom Jewellery Intake | **IMPLEMENTED** | Authenticated submit, owned list/detail, canonical product/shared concept references, branch/context and read-only handoff |
| End-to-end custom commercial/manufacturing journey | **PARTIAL** | Intake only; later stages are not operated |
| Private Viewing / Fitting | **IMPLEMENTED** | Shared request form, branch preferences, owned history/detail and scoped handoff |
| Confirmed appointment / live availability | **BACKEND-DEPENDENT** | No slot locking, staff confirmation, calendar or notifications |
| Return / Care Intake | **IMPLEMENTED** | Owned order/item enquiry, list/detail and scoped read-only handoff |
| Return eligibility/inspection/refund/repair execution | **BACKEND-DEPENDENT** | No approvals, settlement, pickups or completion claims |
| Durable image attachments and private AI-design snapshots | **BACKEND-DEPENDENT** | Contract fields only; secure owned storage/reference service required |
| Persistent sessions/records, cross-device access and server enforcement | **BACKEND-DEPENDENT** | Existing mock semantics retained, not represented as production security |
| Full screen-reader/manual keyboard audit and loaded premium webfont rendering | **NOT VERIFIED** | Automated checks below do not establish these claims |

## M. Future / Not Approved

All of these remain **FUTURE** or separately backend-dependent; none is marked implemented:

Compare; Ring Sizer; Visual Search; AI Concierge; Style DNA; Jewellery Vault; Reviews; Notify Me; Clienteling; Product Intelligence; Reserve & Visit beyond this request workflow; advanced personalization; advanced analytics; CRM; real notifications; real courier integration; real refund processing; real repair processing.

Also not approved: new recommendations, Recently Viewed, loyalty, gift cards, buyback, repair operations, advanced appointment management, real-time inventory, tracking, CMS editing, real AI, real CV, payment gateway, calendar synchronization, SMS, WhatsApp and email delivery.

Additional observations recorded, not automatically fixed: existing account-shell muted text has three automated contrast findings (Client Salon, membership date and Atelier Navigation). They are outside the newly implemented workflow content. Existing external Google Fonts loading is blocked in this sandbox. No account-shell redesign, global token change or font-hosting migration was undertaken.

## N. Backend dependencies

A future API provider/server must implement authenticated identity and authorization, durable persistence and IDs, transactional creation/idempotency, server validation, private owned AI references, secure attachment scanning/storage, eligibility and operational review, branch assignment, timezone-aware scheduling policy, actual staff confirmation, quotation/approval/advance/manufacturing, refund/repair/courier processing and notifications as separately approved. Browser-local mock objects are not a security boundary against a malicious script.

No real API provider/backend was implemented or started. No secrets were added. No OAuth changes were made.

## O. Tests and validation

Commands run from `frontend/` unless noted.

### Baseline

Initial dependency-less attempt: `npm test` ran 17 top-level entries (9 passed, 8 failed because JSX harness dependencies were absent); `npm run build` could not find Vite. Ran `npm ci` with the existing unchanged lockfile, then established the usable baseline **before implementation**:

- `npm test`: **153 passed, 0 failed, 0 skipped**.
- `npm run build`: **PASS**, Vite 7.3.2, 2,216 modules, 5.07s, index.html 4,948.19 kB / gzip 3,185.14 kB.

Two later command invocations from the repository root returned ENOENT (package.json is in frontend); they were rerun from the correct directory and are not application test failures.

### Final automated suite

- `npm test`: **172 passed, 0 failed, 0 skipped, 0 cancelled**; final recorded duration 14,258.03ms.
- **19 new tests** in `src/__tests__/phase14-2-intake.test.mjs`: custom creation/validation/reference integrity; customer ownership and detached list/detail reads for all kinds; unauthenticated rejection; both appointment types/initial status/date/time/branch validation; both service types/initial status/canonical order integrity/foreign order and invalid item/product rejection; employee capabilities/branch tampering, head-office Admin, branch Admin and global Super Admin across all kinds; unavailable provider; mounted guards/deep-link route definitions; safe login context; escaped detail rendering.
- Existing 153 regressions pass, including customer/staff authentication, Google seam, registration, checkout, orders, cart/wishlist, AI/VTO/saved-state contracts, governance, operational branch scope and Phase 14.1 P1 tests. This is regression-suite evidence, not a claim of production integration testing.

### Browser validation

Supplementary reproducible script: `src/__tests__/support/phase14-2-browser.mjs`. Start Vite and run it with externally installed Playwright/axe tooling using PLAYWRIGHT_MODULE, AXE_SCRIPT and optional CHROMIUM_EXECUTABLE/BASE_URL environment variables. Tooling was installed outside the repository; package.json and package-lock.json are unchanged. The default Playwright browser download failed due sandbox network restrictions; an external npm-packaged Chromium binary and its runtime libraries were used instead.

- Actual guest redirects for all create route families, customer login with product context, all three submissions, confirmations, detail/list navigation and not-found state passed. Direct reloads of all customer create/list/detail route families also passed (after reload the in-memory book is empty, and detail correctly reports not found).
- Super Admin sees the same newly submitted records, not fixtures in another store.
- Admin and Employee login and all three request routes passed; detailed permission and branch adversarial checks are in the provider tests.
- **72 viewport checks**: 12 form/list/detail/operational content views × 375, 640, 768, 1024, 1280 and 1536px. No document-level horizontal overflow.
- axe WCAG 2 A/AA and 2.1 AA: **zero violations within new intake content** across the 12 checked views, evaluated at desktop after viewport checks. Early hint contrast findings in new forms were corrected using existing secondary-text tokens. The inherited account-shell findings above were recorded separately, not concealed as a full-site clean bill.
- Final browser run: **no application JavaScript/React errors**. Existing Google Fonts requests failed with ERR_CONNECTION_CLOSED; therefore a completely error-free network console and loaded premium webfont appearance are **NOT VERIFIED**. Fallback fonts were used in this sandbox.
- Real backend, screen-reader, real device and external integration tests were not run.

### Static boundaries

- Zero `.ts`/`.tsx` source files or tracked tsconfig; no new TypeScript dependency.
- No new dependency or lockfile changes.
- No presentation import of src/mock or governanceStore.
- No new animations/keyframes/animation library.
- `git diff --check` passes.
- Source-of-truth BRD and earlier audit/reconciliation documents unchanged.

## P. Final build

`npm run build`: **PASS**.

| Metric | Result |
|---|---|
| Vite | 7.3.2 |
| Modules transformed | 2,222 |
| Build time | 4.63s |
| Single-file artifact | `dist/index.html` |
| Artifact size | 4,969.22 kB |
| Gzip | 3,190.74 kB |

Build artifacts, browser binaries, external tools and temporary logs are not added to Git. The large single-file artifact predates this phase; no bundling redesign was performed.

## Q. Exact files changed

Paths relative to repository root:

- `frontend/PHASE_14_2_RECONCILIATION.md`
- `frontend/src/__tests__/phase14-2-intake.test.mjs`
- `frontend/src/__tests__/support/phase14-2-browser.mjs`
- `frontend/src/app/router.jsx`
- `frontend/src/components/account/AccountNavigation.jsx`
- `frontend/src/components/cards/BranchCard.jsx`
- `frontend/src/components/requests/IntakeRecord.jsx`
- `frontend/src/features/storefront/customerService.js`
- `frontend/src/hooks/useIntake.js`
- `frontend/src/layouts/console/config.js`
- `frontend/src/mock/data/campaigns/index.js`
- `frontend/src/mock/data/homepage/index.js`
- `frontend/src/mock/data/site/index.js`
- `frontend/src/pages/customer/account/OrderDetailPage.jsx`
- `frontend/src/pages/customer/ai-studio/AiStudioPage.jsx`
- `frontend/src/pages/customer/product/ProductDetailPage.jsx`
- `frontend/src/pages/customer/requests/IntakeAccountPage.jsx`
- `frontend/src/pages/customer/requests/IntakePage.jsx`
- `frontend/src/pages/customer/service/CustomerServicePage.jsx`
- `frontend/src/pages/operations/IntakeOperationsPage.jsx`
- `frontend/src/services/intakeService.js`
- `frontend/src/services/providers/DataProvider.jsx`
- `frontend/src/services/providers/mock/governanceStore.js`
- `frontend/src/services/providers/mock/mockProvider.js`
- `frontend/src/utils/links.js`

## R–S. Commit and push

Delivery is committed and pushed only on `arena/01a0d24e-swarnova`. The exact delivered commit hash and actual push result are supplied in the final delivery response after the Git operations complete; this document does not pretend to embed its own future commit hash. No other branch is created or pushed.

Phase boundary: approved frontend/mock intake scope implemented; production dependencies remain as classified. Stop after delivery. **Do not start Phase 15.**
