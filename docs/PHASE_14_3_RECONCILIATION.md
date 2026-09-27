# Phase 14.3 — branch-scoped staff administration & RBAC hardening

Date: 2026-09-24. Branch: `arena/01a0d2dc-swarnova`.

## A. Objective

Phase 14.3 is a focused **authorization + organization-scope correction**, not a feature phase. It makes the branch a required, first-class attribute of every Admin and Employee identity, restricts every administrator's operational authority to their assigned branch, keeps the Super Admin global, and moves authority decisively into the provider/store so the UI is only the UX layer. No new product feature, no Phase 15 work, and no real backend was built.

## B. Source of truth

Unchanged and unmodified in this phase:

- `frontend/SWARNOVA_BRD_PRD_v2.0.md` — the product-definition baseline (byte-identical).
- `frontend/PHASE_14_AUDIT.md`, `frontend/PHASE_14_1_RECONCILIATION.md`, `frontend/PHASE_14_2_RECONCILIATION.md` — audit and prior reconciliation records (byte-identical).

The repository itself is the implementation source. Where Phase 14.1/14.2 records describe the previous "head-office Admin" model, Phase 14.3 supersedes that single behavior by explicit decision of this phase's scope (below); no other prior decision was reinterpreted.

## C. Previous behavior

1. `platformAdmins` supported `scope: "head-office"` with `branchId: null` — a global administrator whose operational book was the whole organization. ADM-001 (`arpita.mohanty@swarnova.in`) was that account.
2. `createGovernanceAdmin` allowed a head-office admin (no branch) or a branch admin; only a branch-scoped creation required `branchId`.
3. `createEmployee` trusted the browser's `actor.role`/`actor.permissions` claims, required the caller to name a branch — so an Admin could create an employee for ANY branch they could click, and a tampered client could claim any authority.
4. The Admin operational book (`listAdminOrders`, `listAdminCustomers`, `listAdminInventory`, `adminReports`, `adminOverview`, `listBranchOperations`, `listInventoryMovements`) was unscoped: no actor, no branch — the same rows for every admin.
5. `resolveStaffScope` treated a label-only admin actor as a global head-office admin; role claims were accepted without resolving the record.
6. The Super Admin had no employee-creation surface of its own; the Super Admin Employees page was read-mostly oversight only.

## D. Corrected authority model

```
ROLE → MAXIMUM AUTHORITY → CAPABILITY PROFILE → ACTUAL CAPABILITIES → BRANCH/DATA SCOPE → UI/ACTIONS
```

Capabilities and branch scope remain separate axes. A capability says WHAT may be operated (`orders.manage`); the branch assignment says WHICH organization data it applies to. Nothing in this phase removed a capability.

Required diagram (Rule 33):

```
SUPER ADMIN
    |
    +-- Admin BRANCH A (BR-001 · Bhubaneswar)
    |      |
    |      +-- Employee BRANCH A
    |      +-- Employee BRANCH A
    |
    +-- Admin BRANCH B (BR-002 · Cuttack)
    |      |
    |      +-- Employee BRANCH B
    |
    +-- Employee BRANCH C

Operational scope:

SUPER ADMIN      -> ALL BRANCHES (selection is a view filter, never a limit)
ADMIN BRANCH A   -> BRANCH A ONLY
EMPLOYEE BRANCH A-> BRANCH A ONLY
```

## E. Staff identity model

`Staff = { id, role, capabilities, branchId, profile, credentials/session }`, with the store as the canonical authority:

| Role | branchId | scope |
|---|---|---|
| SUPER_ADMIN | `null` (global) | ALL_BRANCHES |
| ADMIN | **REQUIRED** — one valid branch | ONLY_ASSIGNED_BRANCH |
| EMPLOYEE | **REQUIRED** — one valid branch | ONLY_ASSIGNED_BRANCH |

`resolveStaffScope` now resolves an administrator's identity and branch from the canonical `platformAdmins` record (`actor.id` → record → `branchId`). A label-only admin actor no longer resolves (no id = no authority), an admin without a branch assignment is a refused data defect, and `scope` on the record is always `"branch"` — head-office administrators no longer exist. Employees resolve exactly as in Phase 10.

## F. Super Admin rules

- Creates Admins: **branch REQUIRED** (`createGovernanceAdmin`). Name + email + branch; the branch must exist, be active (`assignableBranchOrFail`), and the email must be unique across all staff. Created account: `role: "admin"`, `scope: "branch"`, `branchId`, title `Branch Administrator — <city>`, and the shared demo first-sign-in password (`temporaryPassword` travels once for the invite handover — the same contract employee creation already had).
- Creates Employees: **branch REQUIRED** (`createEmployee` as SUPER_ADMIN). Any valid, active branch — an Admin or an Employee may be created for a branch regardless of whether the other exists (no organizational dependency was imposed).
- May reassign an Admin's branch and an Employee's branch (`updateGovernanceAdmin` / `updateGovernanceEmployee`): target branch validated (exists, active), role/capabilities preserved, canonical identity updated, scope moves immediately, one audit entry per change.
- Remains GLOBAL: `listGovernanceAdmins`, the whole employee directory, global order/customer/inventory/reports books, branch filter and drill-down (`/super-admin/branches/:branchId`) are unchanged, and branch selection remains a view filter. Branch enable/disable and the administrator directory are Super-Admin-only operations.

## G. Admin rules

- Creates **Employee only** — never an Admin (`createGovernanceAdmin` refuses non-Super-Admin actors) and never a Super Admin (no staff-creation path accepts a platform role; the job `role` text field is a title, and the account resolves from the record).
- **Does not choose the branch.** The provider derives `employee.branchId = authenticatedAdmin.branchId`. The Admin form shows `Branch: <admin's branch>` as a fixed fact and sends **no** `branchId`.
- An explicit conflicting `branchId` in the payload is an authorization refusal (`"This employee must belong to your assigned branch…"`), never silently corrected; an omitted branchId is derived. Naming their own branch explicitly is accepted.
- Operational access equals `Admin.branchId`: orders, customers, inventory, reports, business overview, branch coordination, stock movements and the staff list are provider-scoped to the admin's branch. Cross-branch queries, ids and payloads are refused or filtered — never honoured.
- Cannot manage another branch's employees, cannot move any employee's branch, cannot read the administrator directory, cannot enable/disable branches.

## H. Employee rules

- Cannot create staff of any kind (`createEmployee` / `createGovernanceAdmin` refuse).
- Branch scope unchanged from Phases 10/14.1/14.2: `resolveStaffScope` re-resolves branch and capabilities from the employee's own record; cross-branch queries are refused.
- Provider-side hardening: an employee SESSION cannot reach the Admin book (`adminScopeOrFail` refuses non-admin/super roles) even if a tampered client claims an admin role — the session's role is the store record's role.

## I. Branch scope rules

Client-supplied branch values can only ever narrow a GLOBAL caller: `resolveScopeBranch` refuses any branch named by a scoped caller other than its own (`"…is the only branch this account can work in."`), so `?branchId=`, `?branch=`, route ids, and request payloads cannot widen an Admin or an Employee. Super Admin branch parameters remain valid view filters (unknown branch → not found; disabled branch → refused for ASSIGNMENT, still viewable where existing routes allow).

## J. Capability rules

Untouched as a model: the seven grouped capabilities (Catalogue, Orders & Customers, Inventory, Content, Branch Operations, Reports, Staff Management) remain the only vocabulary; staff sessions carry the same claims (`Admin` = full business set, Employees = profile-derived). The grant ceiling (`capabilitiesWithinAuthority`) is now computed from the STORE-resolved scope's claims, never the browser's. Product/catalogue governance stays available to admins (it is not branch-dimensioned data; the fixture audit trail shows a branch admin submitting products for review).

## K. Provider enforcement

The provider resolves the authenticated actor from **its own staff session** (`mockProvider._staffSession`, set only by `authenticateStaff`, cleared by `staffSignOut`). Every staff-facing method — the Admin book, governance directories, employee operations, operational intake — derives the actor from that session; browser actor objects, role claims, permission lists and branch claims are ignored as authority. No session → every staff surface refuses (`"This account has no branch operations access."`). Rule 11's twelve cases are all enforced store-side and covered by tests: creation cases 1–8 (this phase's file), operational cases 9–12 (this file + Phase 10/14.1 regressions).

## L. UI enforcement

- Super Admin → Admins: create/edit dialog has ONE required Branch select (active branches only); no scope selector exists.
- Super Admin → Employees: new "New Employee" dialog reuses the shared `EmployeeFormDialog` with the required Branch select and the one-time password handover.
- Admin → Employees: no branch filter (the list is provider-scoped), the form shows `Branch: <name>` as derived text ("Derived from your own branch assignment — it cannot be changed"), and no branchId is submitted.
- Admin orders/inventory: branch filter rendered only for a global session; branch-scoped admins see their pinned book without a selector. AdminLayout names the branch next to the console label (display only).
- No new form primitives, stores, or routes; all changes reuse Field/Input/Select/Button/Dialog/Table/Badge/EmptyState/PageHeader/FilterBar/ConfirmDialog.

## M. Existing fixture migration

- **ADM-001 · Arpita Mohanty** (`arpita.mohanty@swarnova.in`) was the only non-compliant record (`scope: "head-office"`, `branchId: null`). No fixture tied her to a boutique, so per the migration rule the assignment resolves **deterministically to the first canonical branch in the branch directory: BR-001 (Swarnova Bhubaneswar)**. `scope` → `"branch"`, `title` → `Branch Administrator — Bhubaneswar`. No new branch was invented; no other credential, capability or status changed.
- All employees already carried exactly one valid branchId — verified, unchanged.
- A standing fixture-integrity test now fails the suite if any Admin or Employee lacks a valid branchId, if staff ids duplicate, or if branch records duplicate.

## N. Audit behavior

The existing single audit trail (`governanceAuditLog` + `appendAudit`) is reused; no second audit system. Staff events now carry the branch and resolved actor: `admin.create` and `employee.create` include `branchId` and the creator's resolved label; `admin.update` / `employee.update` record branch reassignment ("Branch reassigned to …", "Branch assignment changed to …") with the resolved scope branch. Order-status and inventory-adjustment entries record the RESOLVED scope branch — the client `branchId` parameter those contracts once accepted for the audit line was removed as an input.

## O. Backend-ready contract

Still frontend/mock; no API provider was built. The seam is now exactly what a server should expose:

```
createStaff(payload)  (conceptually; the mock keeps the role-specific seams
                       createGovernanceAdmin / createGovernanceEmployee)

payload: { role, name, email, phone, branchId, capabilities }
```

- Authority NEVER depends on the caller supplying actor identity: the future API resolves the actor from its authenticated session (the mock's `_staffSession` stands in for the session cookie/token).
- Super Admin: `branchId` required, must exist and be active. Admin: `branchId` omitted → derived from the authenticated admin; present-and-different → 403-style refusal (the mock's existing plain-error convention).
- The same contract must be enforced server-side; the store already behaves as the enforcement layer (plain readable errors, exactly like 4xx bodies).

## P. Tests

Baseline before implementation: `npm test` **172 passed, 0 failed**; `npm run build` PASS.

Final: `npm test` **194 passed, 0 failed, 0 skipped** — 172 existing + **22 new** in `src/__tests__/phase14-3-staff-scope.test.mjs`, covering the Rule 26 matrix: fixture integrity; Super Admin Admin/Employee creation (required/valid/any branch, disabled-branch refusal, immediate scope); Admin-derived employee creation, conflicting-branch refusal, no-Admin/no-Super-Admin creation; employee no-create and scope; Admin operational reads scoped and cross-branch refusals via query/id/payload; staff-list scoping; branch reassignment (Super Admin only, identity-only effect); admin directory/branch-status authority; provider session authority (no-session, tampered claims, sign-out); capability/branch separation; and the UI wiring (fixed-branch render, no selector, no client authority, no branch filter, active-branch-only options).

Existing suites updated only where they encoded the retired head-office-admin model (actor-aware admin book calls; the Phase 14.2 staff-scope test now pins the provider session instead of trusting a browser actor). Phase 14.1 and 14.2 tests pass.

## Q. Build

`npm run build`: **PASS** — Vite 7.3.2, 2,222 modules, ~6.3 s, single-file artifact `dist/index.html` ≈ 4,975 kB (gzip ≈ 3,192 kB). No bundling changes were made.

## R. Browser validation

The repository's browser harness (`src/__tests__/support/phase14-2-browser.mjs`) requires an external Playwright/Chromium install. As recorded in Phase 14.2, this sandbox cannot download the browser binary (CDN blocked; no system Chromium, no root). Real browser/viewport validation is therefore **NOT VERIFIED** this phase and is not claimed. What WAS verified deterministically: every touched module transforms cleanly through the running Vite dev server; the staff login route serves; SSR renders of the two creation dialogs prove the branch-fixed vs branch-selector modes; and all layout classes come from the existing responsive design system. Do not treat responsive/accessibility claims as made.

## S. Files changed

Paths relative to repository root:

- `frontend/PHASE_14_3_RECONCILIATION.md` (new)
- `frontend/src/__tests__/phase14-3-staff-scope.test.mjs` (new)
- `frontend/src/__tests__/console-regression.test.mjs`
- `frontend/src/__tests__/phase11-customer-auth.test.mjs`
- `frontend/src/__tests__/phase12-checkout.test.mjs`
- `frontend/src/__tests__/phase13-integration.test.mjs`
- `frontend/src/__tests__/phase14-1-p1.test.mjs`
- `frontend/src/__tests__/phase14-2-intake.test.mjs`
- `frontend/src/components/admin/EmployeeFormDialog.jsx`
- `frontend/src/features/authentication/permissions.js`
- `frontend/src/layouts/admin/AdminLayout.jsx`
- `frontend/src/layouts/console/ConsoleExperience.jsx`
- `frontend/src/mock/data/governance/index.js`
- `frontend/src/pages/admin/dashboard/AdminDashboardPage.jsx`
- `frontend/src/pages/admin/inventory/AdminInventoryPage.jsx`
- `frontend/src/pages/admin/orders/AdminOrdersPage.jsx`
- `frontend/src/pages/admin/organization/AdminEmployeesPage.jsx`
- `frontend/src/pages/staff/StaffLoginPage.jsx`
- `frontend/src/pages/super-admin/organization/AdminsPage.jsx`
- `frontend/src/pages/super-admin/organization/EmployeesPage.jsx`
- `frontend/src/services/organizationGovernanceService.js`
- `frontend/src/services/providers/DataProvider.jsx`
- `frontend/src/services/providers/mock/governanceStore.js`
- `frontend/src/services/providers/mock/mockProvider.js`

## T. Remaining backend dependencies

- A real server must re-implement this exact contract with authenticated sessions (the mock's in-memory `_staffSession` and store are not a security boundary against a malicious client).
- Real invite/first-sign-in flow with hashed credentials (created admins/employees still carry the shared demo password fixture).
- Durable persistence, concurrency-safe id allocation, server-side audit durability.
- Real browser/device accessibility validation (see R).

## U. Explicitly not implemented

Phase 15 and everything beyond: real backend/API provider, migration away from MockProvider, new roles, new capabilities, permission-editing UI, staff self-service, org chart management, bulk staff import, new login surfaces, role selector at login, customer-auth or Google-OAuth changes, new audit UI, notifications, unrelated refactors, animation, and new dependencies. The BRD/PRD and all earlier phase reports remain untouched.

**Phase boundary: STOP after Phase 14.3. Do not start Phase 15.**
