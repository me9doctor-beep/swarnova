/**
 * PHASE 14.3 — BRANCH-SCOPED STAFF ADMINISTRATION & RBAC HARDENING
 * -----------------------------------------------------------------------------
 * The corrected authority model, enforced by the canonical governance store
 * and the provider's own staff session:
 *
 *   · Super Admin creates Admins and Employees WITH a required branch.
 *   · Admin creates Employees ONLY for the Admin's own branch — the branch
 *     is derived, never chosen, and a conflicting claim is refused.
 *   · Admin operational access equals Admin.branchId; Employee scope stands.
 *   · Super Admin remains GLOBAL — branch selection is a view filter.
 *   · The provider resolves the authenticated actor from ITS OWN session;
 *     browser actor objects and branch claims are never authority.
 *
 * Everything here works against the SAME canonical store the app reads —
 * no second staff store exists.
 */
import { readFileSync } from "node:fs";
import "./support/browser-globals.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import mockProvider from "../services/providers/mock/mockProvider.js";
import EmployeeFormDialog from "../components/admin/EmployeeFormDialog.jsx";
import {
  adjustAdminInventory,
  adminOverview,
  adminReports,
  authenticateStaff,
  createEmployee,
  createGovernanceAdmin,
  createGovernanceStore,
  listAdminCustomers,
  listAdminInventory,
  listAdminOrders,
  listBranchOperations,
  listGovernanceAdmins,
  listGovernanceEmployees,
  resolveStaffScope,
  setBranchStatus,
  updateAdminOrderStatus,
  updateGovernanceAdmin,
  updateGovernanceEmployee,
} from "../services/providers/mock/governanceStore.js";
import { ROLES } from "../features/authentication/roles.js";
import { CAPABILITIES, FULL_BUSINESS_CAPABILITIES } from "../features/authentication/capabilities.js";
import { can } from "../features/authentication/permissions.js";

const PASSWORD = "Swarnova@123";
const BBSR = "BR-001";
const CTC = "BR-002";

function freshStore() {
  return createGovernanceStore();
}

function superAdmin() {
  return { id: "SA-001", role: ROLES.SUPER_ADMIN, label: "Rajiv Meher — Super Admin" };
}

function adminActor(store, email = "arpita.mohanty@swarnova.in") {
  const session = authenticateStaff(store, { email, password: PASSWORD });
  return { id: session.user.id, role: session.role, label: `${session.user.name} — Admin` };
}

function employeeActor(store, email = "meera.das@swarnova.in") {
  const session = authenticateStaff(store, { email, password: PASSWORD });
  return { id: session.user.id, role: session.role, label: `${session.user.name} — Employee` };
}

const EMPLOYEE_PAYLOAD = {
  name: "Phase 14.3 Hire",
  email: "fourteen.three@swarnova.in",
  phone: "+91 94371 30003",
  role: "Sales Consultant",
  profileId: "PROF-BRANCH-SALES",
};

/* ------------------------------------------------------------------ */
/* Fixture integrity (Rule 29)                                         */
/* ------------------------------------------------------------------ */

test("14.3 · every Admin and Employee fixture carries exactly one valid branch; the Super Admin is global", () => {
  const store = freshStore();

  const branchIds = new Set(store.branches.map((branch) => branch.id));
  for (const admin of store.admins) {
    assert.equal(admin.role, "admin");
    assert.ok(
      branchIds.has(admin.branchId),
      `${admin.id} (${admin.email}) must be assigned a valid branch`
    );
  }
  for (const employee of store.employees) {
    assert.ok(
      branchIds.has(employee.branchId),
      `${employee.id} (${employee.email}) must be assigned a valid branch`
    );
  }

  /* No duplicate staff ids, no duplicate branch records. */
  const adminIds = store.admins.map((admin) => admin.id);
  const employeeIds = store.employees.map((employee) => employee.id);
  assert.equal(new Set(adminIds).size, adminIds.length);
  assert.equal(new Set(employeeIds).size, employeeIds.length);
  assert.equal(new Set(store.branches.map((branch) => branch.id)).size, store.branches.length);

  /* The migration preserved the known demo personas and credentials. */
  assert.ok(store.admins.some((admin) => admin.email === "arpita.mohanty@swarnova.in"));
  for (const email of [
    "meera.das@swarnova.in",
    "rohit.panda@swarnova.in",
    "rakesh.nayak@swarnova.in",
    "bikash.behera@swarnova.in",
  ]) {
    assert.ok(
      store.employees.some((employee) => employee.email === email),
      `${email} is preserved`
    );
  }

  const scope = resolveStaffScope(store, superAdmin());
  assert.equal(scope.global, true);
  assert.equal(scope.branchId, null);
});

/* ------------------------------------------------------------------ */
/* Super Admin creation                                                */
/* ------------------------------------------------------------------ */

test("14.3 · the Super Admin creates an Admin with a REQUIRED branch", () => {
  const store = freshStore();
  const before = store.admins.length;

  const created = createGovernanceAdmin(
    store,
    { name: "New Branch Admin", email: "new.admin@swarnova.in", branchId: CTC },
    superAdmin()
  );

  assert.equal(store.admins.length, before + 1);
  assert.equal(created.role, "admin");
  assert.equal(created.branchId, CTC);
  assert.equal(created.scope, "branch");
  assert.match(created.title, /Cuttack/);
  assert.ok(created.temporaryPassword, "the invite handover travels once");

  const audit = store.auditLog[0];
  assert.equal(audit.action, "admin.create");
  assert.equal(audit.entityId, created.id);
  assert.equal(audit.branchId, CTC);

  /* The created Admin immediately inherits the branch's operational scope. */
  const session = authenticateStaff(store, { email: "new.admin@swarnova.in", password: PASSWORD });
  assert.equal(session.role, ROLES.ADMIN);
  assert.equal(session.user.branchId, CTC);
  const scope = resolveStaffScope(store, { id: created.id, role: ROLES.ADMIN });
  assert.equal(scope.global, false);
  assert.equal(scope.branchId, CTC);
});

test("14.3 · the Super Admin cannot create an Admin without a branch, or with an invalid or disabled one", () => {
  const store = freshStore();
  const before = store.admins.length;

  assert.throws(
    () =>
      createGovernanceAdmin(
        store,
        { name: "No Branch", email: "no.branch@swarnova.in", branchId: "" },
        superAdmin()
      ),
    /Choose the branch/
  );
  assert.throws(
    () =>
      createGovernanceAdmin(
        store,
        { name: "Imaginary", email: "imaginary@swarnova.in", branchId: "BR-999" },
        superAdmin()
      ),
    /unavailable/
  );

  /* A disabled branch cannot receive staff (existing branch status rule). */
  setBranchStatus(store, "BR-003", "disabled", superAdmin());
  assert.throws(
    () =>
      createGovernanceAdmin(
        store,
        { name: "Closed Shop", email: "closed@swarnova.in", branchId: "BR-003" },
        superAdmin()
      ),
    /disabled/
  );
  assert.equal(store.admins.length, before);
});

test("14.3 · the Super Admin creates an Employee with a REQUIRED branch; the employee is scoped to it immediately", () => {
  const store = freshStore();
  const before = store.employees.length;

  assert.throws(
    () => createEmployee(store, { ...EMPLOYEE_PAYLOAD, branchId: "" }, superAdmin()),
    /Choose the branch/
  );
  assert.throws(
    () => createEmployee(store, { ...EMPLOYEE_PAYLOAD, branchId: "BR-999" }, superAdmin()),
    /unavailable/
  );

  const created = createEmployee(
    store,
    { ...EMPLOYEE_PAYLOAD, email: "super.hire@swarnova.in", branchId: CTC },
    superAdmin()
  );
  assert.equal(store.employees.length, before + 1);
  assert.equal(created.branchId, CTC);

  const scope = resolveStaffScope(store, { id: created.id, role: ROLES.EMPLOYEE });
  assert.equal(scope.branchId, CTC);
  assert.equal(scope.global, false);
});

test("14.3 · the Super Admin can create an Admin in ANY valid branch — no organizational dependencies", () => {
  const store = freshStore();

  /* An Admin for a branch with no employees, and an Employee for a branch
     with no Admin: neither requires the other to exist first. */
  const admin = createGovernanceAdmin(
    store,
    { name: "Rourkela Admin", email: "rourkela.admin@swarnova.in", branchId: "BR-003" },
    superAdmin()
  );
  const employee = createEmployee(
    store,
    { ...EMPLOYEE_PAYLOAD, email: "bbsr.hire@swarnova.in", branchId: BBSR },
    superAdmin()
  );
  assert.equal(admin.branchId, "BR-003");
  assert.equal(employee.branchId, BBSR);
});

/* ------------------------------------------------------------------ */
/* Admin creation — the derived branch contract                        */
/* ------------------------------------------------------------------ */

test("14.3 · an Admin creates an Employee whose branch is DERIVED from the Admin's own assignment", () => {
  const store = freshStore();
  const admin = adminActor(store, "ishita.rath@swarnova.in"); // BR-001
  const before = store.employees.length;

  /* Preferred contract: the payload omits the branch entirely. */
  const created = createEmployee(store, { ...EMPLOYEE_PAYLOAD }, admin);

  assert.equal(store.employees.length, before + 1);
  assert.equal(created.branchId, BBSR, "the Admin's branch is the employee's branch");

  const session = authenticateStaff(store, { email: EMPLOYEE_PAYLOAD.email, password: PASSWORD });
  assert.equal(session.role, ROLES.EMPLOYEE);
  assert.equal(session.user.branchId, BBSR);

  const audit = store.auditLog[0];
  assert.equal(audit.action, "employee.create");
  assert.equal(audit.branchId, BBSR);
  assert.match(audit.actor, /Ishita Rath/);
});

test("14.3 · an Admin naming ANOTHER branch is refused — not corrected", () => {
  const store = freshStore();
  const admin = adminActor(store, "ishita.rath@swarnova.in"); // BR-001
  const before = store.employees.length;

  assert.throws(
    () => createEmployee(store, { ...EMPLOYEE_PAYLOAD, branchId: CTC }, admin),
    /your assigned branch/
  );
  assert.equal(store.employees.length, before, "no employee was created for BR-002");

  /* The Admin's OWN branch named explicitly is accepted (no silent rewrite). */
  const created = createEmployee(store, { ...EMPLOYEE_PAYLOAD, branchId: BBSR }, admin);
  assert.equal(created.branchId, BBSR);
});

test("14.3 · an Admin cannot create an Admin, and nobody can create a Super Admin", () => {
  const store = freshStore();
  const admin = adminActor(store);
  const beforeAdmins = store.admins.length;

  assert.throws(
    () =>
      createGovernanceAdmin(
        store,
        { name: "Usurper", email: "usurper@swarnova.in", branchId: BBSR },
        admin
      ),
    /Only the Super Admin/
  );
  assert.equal(store.admins.length, beforeAdmins);

  /* No staff-creation path accepts a super-admin target: createEmployee
     always writes role "employee", and the browser cannot supply a role. */
  const created = createEmployee(
    store,
    { ...EMPLOYEE_PAYLOAD, role: "Super Admin", branchId: BBSR },
    superAdmin()
  );
  assert.equal(created.role, "Super Admin"); // a job TITLE, never the platform role
  const session = authenticateStaff(store, { email: EMPLOYEE_PAYLOAD.email, password: PASSWORD });
  assert.equal(session.role, ROLES.EMPLOYEE, "the account resolves from the record, not the title");
});

test("14.3 · an Employee cannot create staff of any kind", () => {
  const store = freshStore();
  const employee = employeeActor(store);
  const beforeEmployees = store.employees.length;
  const beforeAdmins = store.admins.length;

  assert.throws(
    () => createEmployee(store, { ...EMPLOYEE_PAYLOAD }, employee),
    /Only Admins and Super Admins/
  );
  assert.throws(
    () =>
      createGovernanceAdmin(
        store,
        { name: "Employee Admin", email: "employee.admin@swarnova.in", branchId: BBSR },
        employee
      ),
    /Only the Super Admin/
  );
  assert.equal(store.employees.length, beforeEmployees);
  assert.equal(store.admins.length, beforeAdmins);
});

/* ------------------------------------------------------------------ */
/* Admin operational scope                                             */
/* ------------------------------------------------------------------ */

test("14.3 · an Admin's operational book is exactly their branch — reads, detail and actions", () => {
  const store = freshStore();
  const admin = adminActor(store, "ishita.rath@swarnova.in"); // BR-001
  const scope = resolveStaffScope(store, admin);
  assert.equal(scope.branchId, BBSR);

  /* Orders, customers, inventory, reports and branch operations read BR-001. */
  const orders = listAdminOrders(store, admin);
  assert.ok(orders.length > 0);
  assert.ok(orders.every((order) => order.branchId === BBSR));

  const customers = listAdminCustomers(store, admin);
  const bbsrCustomerIds = new Set(
    store.orders.filter((order) => order.branchId === BBSR).map((order) => order.customerId)
  );
  assert.ok(customers.length > 0);
  assert.ok(customers.every((customer) => bbsrCustomerIds.has(customer.id)));

  const inventory = listAdminInventory(store, admin);
  assert.ok(inventory.length > 0);
  assert.ok(inventory.every((row) => row.branchId === BBSR));

  const reports = adminReports(store, admin);
  assert.equal(reports.salesByBranch.length, 1);
  assert.equal(reports.salesByBranch[0].branchId, BBSR);

  const branches = listBranchOperations(store, admin);
  assert.deepEqual(branches.map((branch) => branch.id), [BBSR]);

  const overview = adminOverview(store, admin);
  assert.equal(overview.branchId, BBSR);
  assert.equal(overview.business.totalBranches, 1);
});

test("14.3 · an Admin cannot reach another branch's data — query, detail, mutation or payload", () => {
  const store = freshStore();
  const admin = adminActor(store, "ishita.rath@swarnova.in"); // BR-001

  /* ?branch=BR-002 in a query — refused, never honoured. */
  assert.throws(
    () => listAdminOrders(store, admin, { branchId: CTC }),
    /only branch this account can work in/
  );
  assert.throws(() => listAdminCustomers(store, admin, { branchId: CTC }));
  assert.throws(() => listAdminInventory(store, admin, { branchId: CTC }));

  /* Route parameters — a BR-002 order id cannot be opened or moved. */
  const foreignOrder = store.orders.find((order) => order.branchId === CTC);
  assert.ok(foreignOrder, "the fixture book holds a Cuttack order");
  assert.equal(
    listAdminOrders(store, admin, { search: foreignOrder.orderNumber }).length,
    0,
    "a BR-002 order never appears in the BR-001 book, not even by search"
  );
  assert.equal(
    adminOverview(store, admin).ordersNeedingAttention.some((order) => order.id === foreignOrder.id),
    false,
    "the BR-001 dashboard never surfaces a BR-002 order"
  );
  assert.throws(() => updateAdminOrderStatus(store, admin, foreignOrder.id, "Cancelled"), /another boutique/);
  assert.equal(
    store.orders.find((order) => order.id === foreignOrder.id).status,
    foreignOrder.status,
    "the foreign order was not touched"
  );

  /* Request payloads — BR-002 stock cannot be adjusted from BR-001. */
  const foreignStock = store.inventory.find((row) => row.branchId === CTC);
  assert.throws(
    () => adjustAdminInventory(store, admin, foreignStock.id, { delta: 1, reason: "Scope probe" }),
    /works Swarnova Bhubaneswar only/
  );
  assert.equal(
    store.inventory.find((row) => row.id === foreignStock.id).available,
    foreignStock.available,
    "the foreign stock row was not touched"
  );

  /* The Super Admin, unimpressed, still reads everything. */
  const global = listAdminOrders(store, superAdmin(), { branchId: CTC });
  assert.ok(global.every((order) => order.branchId === CTC));
});

test("14.3 · the Admin staff-management list shows ONLY own-branch employees, store- and provider-side", () => {
  const store = freshStore();
  const admin = adminActor(store, "ishita.rath@swarnova.in"); // BR-001

  const list = listGovernanceEmployees(store, admin);
  assert.ok(list.length > 0);
  assert.ok(list.every((employee) => employee.branchId === BBSR));

  /* The Admin cannot manage another branch's employee, or move anyone's branch. */
  const foreign = store.employees.find((employee) => employee.branchId === CTC);
  assert.throws(
    () => updateGovernanceEmployee(store, foreign.id, { status: "disabled" }, admin),
    /another boutique/
  );
  const own = store.employees.find((employee) => employee.branchId === BBSR);
  assert.throws(
    () => updateGovernanceEmployee(store, own.id, { branchId: CTC }, admin),
    /Only the Super Admin can reassign/
  );

  /* The Super Admin reassigns the branch: identity scope changes, the
     historical order book does NOT move with the person. */
  const ordersBefore = store.orders.filter((order) => order.branchId === BBSR).length;
  const moved = updateGovernanceEmployee(store, own.id, { branchId: CTC }, superAdmin());
  assert.equal(moved.branchId, CTC);
  assert.equal(moved.profileId, own.profileId, "role and capabilities ride along unchanged");
  assert.equal(store.orders.filter((order) => order.branchId === BBSR).length, ordersBefore);

  const audit = store.auditLog[0];
  assert.equal(audit.action, "employee.update");
  assert.match(audit.detail, /Branch reassigned to/);
});

test("14.3 · administrator management is platform governance: Super Admin only", () => {
  const store = freshStore();
  const admin = adminActor(store);
  const employee = employeeActor(store);

  assert.throws(
    () => listGovernanceAdmins(store, admin),
    /Only the Super Admin can view administrator accounts/
  );
  assert.throws(() => updateGovernanceAdmin(store, "ADM-002", { status: "disabled" }, admin));
  assert.throws(() => updateGovernanceAdmin(store, "ADM-002", { status: "disabled" }, employee));
  assert.throws(
    () => updateGovernanceAdmin(store, "ADM-002", { scope: "head-office" }, superAdmin()),
    /branch-assigned/
  );

  /* The Super Admin may reassign an Admin to another valid branch. */
  const moved = updateGovernanceAdmin(store, "ADM-002", { branchId: CTC }, superAdmin());
  assert.equal(moved.branchId, CTC);
  assert.match(moved.title, /Cuttack/);
  assert.equal(
    resolveStaffScope(store, { id: "ADM-002", role: ROLES.ADMIN }).branchId,
    CTC,
    "the operational scope moves with the reassignment"
  );
  assert.throws(
    () => updateGovernanceAdmin(store, "ADM-002", { branchId: "BR-999" }, superAdmin()),
    /unavailable/
  );

  const directory = listGovernanceAdmins(store, superAdmin());
  assert.equal(directory.length, store.admins.length);
});

test("14.3 · branch status changes are platform governance: Super Admin only", () => {
  const store = freshStore();
  const admin = adminActor(store);
  const employee = employeeActor(store);

  assert.throws(() => setBranchStatus(store, BBSR, "disabled", admin), /Only the Super Admin/);
  assert.throws(() => setBranchStatus(store, BBSR, "disabled", employee), /Only the Super Admin/);
  assert.equal(store.branches.find((branch) => branch.id === BBSR).status, "active");
  setBranchStatus(store, BBSR, "disabled", superAdmin());
  assert.equal(store.branches.find((branch) => branch.id === BBSR).status, "disabled");
});

/* ------------------------------------------------------------------ */
/* Employee scope (regression of the Phase 10 contract)                */
/* ------------------------------------------------------------------ */

test("14.3 · an Employee cannot widen their branch through query, id or manipulated claims", () => {
  const store = freshStore();
  const employee = employeeActor(store, "meera.das@swarnova.in"); // BR-001

  /* The Admin book never answers an employee — whatever route calls it. */
  assert.throws(() => listAdminOrders(store, employee), /no head-office operations access/);

  const scope = resolveStaffScope(store, employee);
  assert.equal(scope.branchId, BBSR);
  assert.equal(scope.global, false);
});

/* ------------------------------------------------------------------ */
/* The provider is authoritative                                       */
/* ------------------------------------------------------------------ */

test("14.3 · the provider resolves the authenticated actor from its own session; client claims are ignored", async () => {
  const provider = { ...mockProvider, _store: freshStore(), _staffSession: null };

  /* No session — no staff surface answers at all. */
  await assert.rejects(async () => provider.getAdminOrders({}));
  await assert.rejects(async () => provider.getGovernanceAdmins());

  /* Sign-in installs the provider-side session. */
  await provider.authenticateStaff({ email: "ishita.rath@swarnova.in", password: PASSWORD });

  const orders = await provider.getAdminOrders({});
  assert.ok(orders.every((order) => order.branchId === BBSR));

  /* A tampered query naming another branch is refused provider-side. */
  await assert.rejects(async () => provider.getAdminOrders({ branchId: CTC }));

  /* The Admin cannot read the administrator directory. */
  await assert.rejects(async () => provider.getGovernanceAdmins());

  /* The Admin's employee list is provider-scoped to the branch. */
  const employees = await provider.getGovernanceEmployees();
  assert.ok(employees.every((employee) => employee.branchId === BBSR));

  /* Sign-out ends the session — every staff surface closes again. */
  await provider.staffSignOut();
  await assert.rejects(async () => provider.getAdminOrders({}));
});

test("14.3 · an employee session cannot reach the Admin book, whatever the browser claims", async () => {
  const provider = { ...mockProvider, _store: freshStore(), _staffSession: null };
  await provider.authenticateStaff({ email: "meera.das@swarnova.in", password: PASSWORD });

  /* The session's role is the store record's role — an Admin-book call from
     an employee session resolves as an employee and is refused. */
  await assert.rejects(async () => provider.getAdminOrders({}), /no head-office operations access/);
  await assert.rejects(
    async () => provider.createGovernanceAdmin({ name: "X", email: "x@x.in", branchId: BBSR }),
    /Only the Super Admin/
  );

  /* Employee operations still work and stay scoped. */
  const orders = await provider.getEmployeeOrders({}, {});
  assert.ok(orders.every((order) => order.branchId === BBSR));
  await assert.rejects(async () => provider.getEmployeeOrders({}, { branchId: CTC }));
});

test("14.3 · the provider derives an Admin-created employee's branch; the UI payload cannot move it", async () => {
  const provider = { ...mockProvider, _store: freshStore(), _staffSession: null };
  await provider.authenticateStaff({ email: "ishita.rath@swarnova.in", password: PASSWORD }); // BR-001

  /* No branchId in the payload — derived. */
  const derived = await provider.createGovernanceEmployee({ ...EMPLOYEE_PAYLOAD });
  assert.equal(derived.branchId, BBSR);

  /* A conflicting branchId in the payload — refused. */
  await assert.rejects(
    async () =>
      provider.createGovernanceEmployee({ ...EMPLOYEE_PAYLOAD, email: "other@swarnova.in", branchId: CTC }),
    /your assigned branch/
  );
});

/* ------------------------------------------------------------------ */
/* Capabilities remain the WHAT; the branch remains the WHICH          */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* The UI reflects the same rules (Rule 13)                            */
/* ------------------------------------------------------------------ */

const readSource = (relative) =>
  readFileSync(new URL("../", import.meta.url).pathname + relative, "utf8");

test("14.3 · the Admin creation form shows the branch as a fixed fact — no selector to reach for", () => {
  const html = renderToStaticMarkup(
    React.createElement(EmployeeFormDialog, {
      profiles: [{ id: "PROF-BRANCH-SALES", name: "Branch Sales", capabilities: {} }],
      actorPermissions: ["orders.view"],
      branches: [
        { id: "BR-001", name: "Swarnova Bhubaneswar" },
        { id: "BR-002", name: "Swarnova Cuttack" },
      ],
      fixedBranch: { id: "BR-001", name: "Swarnova Bhubaneswar" },
      onClose: () => {},
      onSubmit: () => {},
    })
  );

  assert.match(html, /Swarnova Bhubaneswar/);
  assert.match(html, /Derived from your own branch assignment/);
  assert.doesNotMatch(html, /Choose a branch\u2026/, "no branch selector renders for the Admin");
  assert.doesNotMatch(html, /Swarnova Cuttack/, "no other branch is even offered");
});

test("14.3 · the Super Admin creation form keeps the REQUIRED branch selector", () => {
  const html = renderToStaticMarkup(
    React.createElement(EmployeeFormDialog, {
      profiles: [{ id: "PROF-BRANCH-SALES", name: "Branch Sales", capabilities: {} }],
      actorPermissions: ["*"],
      branches: [
        { id: "BR-001", name: "Swarnova Bhubaneswar" },
        { id: "BR-002", name: "Swarnova Cuttack" },
      ],
      onClose: () => {},
      onSubmit: () => {},
    })
  );

  assert.match(html, /Choose a branch/);
  assert.match(html, /Swarnova Cuttack/);
});

test("14.3 · the staff-management surfaces wire the 14.3 rules through the existing pages", () => {
  const adminEmployees = readSource("pages/admin/organization/AdminEmployeesPage.jsx");
  assert.match(adminEmployees, /fixedBranch=/, "the Admin form receives the Admin's own branch");
  assert.match(adminEmployees, /user\?\.branchId/, "the branch comes from the session");
  assert.match(
    adminEmployees,
    /organizationGovernanceService\.createEmployee,\s*\n\s*data/,
    "no client authority travels with the create call"
  );
  assert.doesNotMatch(adminEmployees, /"branch",\n\s*label/, "no branch filter on the Admin list");

  const superEmployees = readSource("pages/super-admin/organization/EmployeesPage.jsx");
  assert.match(superEmployees, /EmployeeFormDialog/, "the Super Admin reuses the shared staff form");
  assert.match(superEmployees, /New Employee/);
  assert.doesNotMatch(superEmployees, /fixedBranch=/, "the Super Admin chooses the branch");

  const adminsPage = readSource("pages/super-admin/organization/AdminsPage.jsx");
  assert.match(adminsPage, /Choose the branch this administrator manages\./);
  assert.doesNotMatch(adminsPage, /head-office.*whole platform/, "no head-office scope is offered");
  assert.match(adminsPage, /branch\.status !== "disabled"/, "disabled branches are not assignable");

  const adminLayout = readSource("layouts/admin/AdminLayout.jsx");
  assert.match(adminLayout, /branchName/, "the Admin shell names the branch (display only)");

  const formDialog = readSource("components/admin/EmployeeFormDialog.jsx");
  assert.match(
    formDialog,
    /branchSelectable \? \{ branchId: form\.branchId \} : \{\}/,
    "a derived branch never travels in the payload"
  );
});

test("14.3 · capability claims are unchanged for Admins; branch scope is a separate axis", () => {
  const store = freshStore();
  const session = authenticateStaff(store, { email: "arpita.mohanty@swarnova.in", password: PASSWORD });

  for (const key of [
    CAPABILITIES.CATALOGUE_MANAGE,
    CAPABILITIES.ORDERS_MANAGE,
    CAPABILITIES.INVENTORY_MANAGE,
    CAPABILITIES.CONTENT_MANAGE,
    CAPABILITIES.BRANCHES_MANAGE,
    CAPABILITIES.REPORTS_VIEW,
    CAPABILITIES.STAFF_MANAGE,
  ]) {
    assert.ok(can(session.permissions, key), `Admin keeps ${key}`);
  }
  assert.deepEqual(
    Object.keys(FULL_BUSINESS_CAPABILITIES).sort(),
    ["branches", "catalogue", "content", "inventory", "orders", "reports", "staff"]
  );

  /* …and the capability does not widen the branch: orders.manage still reads
     one boutique's book. */
  const admin = { id: session.user.id, role: session.role };
  assert.ok(listAdminOrders(store, admin).every((order) => order.branchId === session.user.branchId));
  assert.throws(() => listAdminOrders(store, admin, { branchId: CTC }));
});
