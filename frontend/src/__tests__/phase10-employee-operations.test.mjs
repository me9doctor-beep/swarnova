/**
 * PHASE 10 — EMPLOYEE / BRANCH OPERATIONS (§24 provider & store checks)
 * -----------------------------------------------------------------------------
 * Twenty checks over the canonical store, driven exactly the way the Employee
 * console drives it: a session is obtained from the shared staff login, the
 * ACTOR (`{ id, role, label }`) is the only identity handed to the provider,
 * and every scope decision is re-resolved store-side. No component state, no
 * URL parameter and no client-supplied claim is trusted anywhere in this file —
 * which is the point.
 *
 * Run from `frontend/`:
 *
 *   npm test
 *   node --import ./src/__tests__/support/register-assets.mjs --test src/__tests__/
 *
 * The import hook only maps image imports (`*.png`, `*.webp`, …) to an empty
 * module so the mock catalogue can be loaded outside Vite.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";

import {
  adjustEmployeeInventory,
  authenticateStaff,
  createEmployee,
  createGovernanceStore,
  employeeBranchOperations,
  employeeOverview,
  employeeReports,
  getEmployeeCustomer,
  getEmployeeOrder,
  listEmployeeCustomers,
  listEmployeeInventory,
  listEmployeeOrders,
  resolveStaffScope,
  transitionGovernanceProduct,
  updateEmployeeOrderStatus,
  updateEmployeeProfile,
  updateGovernanceEmployee,
  updateGovernanceProduct,
} from "../services/providers/mock/governanceStore.js";
import { CAPABILITIES } from "../features/authentication/capabilities.js";
import { ROLES } from "../features/authentication/roles.js";
import { can } from "../features/authentication/permissions.js";
import AuthProvider from "../features/authentication/AuthProvider.jsx";
import RequireCapability from "../features/authentication/RequireCapability.jsx";
import { CONSOLE_CONFIG } from "../layouts/console/config.js";
import { filterNavigation } from "../layouts/console/navigation.js";

const PASSWORD = "Swarnova@123";
const BBSR = "BR-001";
const CTC = "BR-002";

const freshStore = () => createGovernanceStore();

/** The session → actor hop the UI performs (`useEmployeeActor`). */
function signIn(store, email) {
  const session = authenticateStaff(store, { email, password: PASSWORD });
  return {
    session,
    actor: {
      id: session.user.id,
      role: session.role,
      label: `${session.user.name} — Employee`,
    },
  };
}

const actorFor = (store, id) => {
  const employee = store.employees.find((item) => item.id === id);
  return { id: employee.id, role: ROLES.EMPLOYEE, label: `${employee.name} — Employee` };
};

const ordersAt = (store, branchId) => store.orders.filter((order) => order.branchId === branchId);

/**
 * Renders a capability gate exactly as the router does: same session store,
 * same gate component — inside a memory router because the refusal state's
 * recovery links are routes.
 */
function renderGate(session, capability, marker = "RESTRICTED-PAGE-MARKER") {
  return renderToStaticMarkup(
    h(
      MemoryRouter,
      null,
      h(
        AuthProvider,
        { initialSession: session },
        h(RequireCapability, { capability }, h("p", null, marker))
      )
    )
  );
}

/* ------------------------------------------------------------------------- */

test("1 · an employee signs in with a staff credential and resolves to their role, branch and capabilities", () => {
  const store = freshStore();
  const { session } = signIn(store, "meera.das@swarnova.in");

  assert.equal(session.role, ROLES.EMPLOYEE);
  assert.equal(session.user.id, "EMP-001");
  assert.equal(session.user.branchId, BBSR);
  assert.equal(
    session.user.branchName,
    store.branches.find((branch) => branch.id === BBSR).name
  );

  for (const capability of [
    CAPABILITIES.CATALOGUE_VIEW,
    CAPABILITIES.CATALOGUE_MANAGE,
    CAPABILITIES.ORDERS_VIEW,
    CAPABILITIES.ORDERS_MANAGE,
    CAPABILITIES.INVENTORY_VIEW,
    CAPABILITIES.INVENTORY_MANAGE,
    CAPABILITIES.BRANCHES_VIEW,
    CAPABILITIES.REPORTS_VIEW,
  ]) {
    assert.ok(can(session.permissions, capability), `expected ${capability}`);
  }
  assert.ok(!can(session.permissions, CAPABILITIES.STAFF_MANAGE));
});

test("2 · a disabled employee account cannot sign in", () => {
  const store = freshStore();
  const disabled = store.employees.find((employee) => employee.status === "disabled");
  assert.ok(disabled, "fixtures are expected to hold a disabled employee");

  assert.throws(
    () => authenticateStaff(store, { email: disabled.email, password: PASSWORD }),
    /disabled/i
  );
});

test("3 · scope is resolved store-side — a client cannot widen its branch, capabilities or permissions", () => {
  const store = freshStore();

  /* A forged actor: the branch and claims a tampered frontend might attach. */
  const scope = resolveStaffScope(store, {
    id: "EMP-010",
    role: ROLES.EMPLOYEE,
    label: "Rakesh Nayak — Employee",
    branchId: CTC,
    capabilities: { inventory: "manage", reports: "view" },
    permissions: ["*"],
  });

  assert.equal(scope.branchId, BBSR, "the employee's own branch wins");
  assert.equal(scope.employee.id, "EMP-010");
  assert.equal(scope.capabilities.inventory, "view", "granted level stands, the claim is ignored");
  assert.ok(!scope.capabilities.reports);
  assert.ok(!can(scope.permissions, CAPABILITIES.INVENTORY_MANAGE));
  assert.ok(!can(scope.permissions, CAPABILITIES.REPORTS_VIEW));
});

test("4 · an employee cannot create staff accounts", () => {
  const store = freshStore();
  const { actor } = signIn(store, "meera.das@swarnova.in");
  const before = store.employees.length;

  assert.throws(
    () =>
      createEmployee(
        store,
        {
          name: "New Hire",
          email: "new.hire@swarnova.in",
          phone: "+91 94371 30000",
          branchId: BBSR,
          role: "Sales Consultant",
          profileId: "PROF-BRANCH-SALES",
        },
        actor
      ),
    /Only Admins and Super Admins/
  );
  assert.equal(store.employees.length, before);
});

test("5 · an employee cannot change capability profiles, grant capabilities or rewrite their own authority", () => {
  const store = freshStore();
  const { actor } = signIn(store, "meera.das@swarnova.in");
  const colleague = store.employees.find((employee) => employee.id === "EMP-002");

  assert.throws(
    () => updateGovernanceEmployee(store, colleague.id, { profileId: "PROF-BRANCH-MANAGER" }, actor),
    /Only Admins and Super Admins/
  );
  assert.throws(
    () =>
      updateGovernanceEmployee(
        store,
        colleague.id,
        { capabilities: { ...colleague.capabilities, staff: "manage" } },
        actor
      ),
    /Only Admins and Super Admins/
  );

  /* Self-service is the phone number, nothing else. */
  const rakesh = actorFor(store, "EMP-010");
  for (const field of ["role", "branchId", "profileId", "capabilities", "status", "email"]) {
    assert.throws(
      () => updateEmployeeProfile(store, rakesh, { [field]: "whatever" }),
      /Only your phone number can be changed/,
      `expected ${field} to be refused`
    );
  }

  const updated = updateEmployeeProfile(store, rakesh, { phone: "+91 94371 20099" });
  assert.equal(updated.phone, "+91 94371 20099");
  assert.equal(store.auditLog[0].action, "employee.profile.update");
  assert.match(store.auditLog[0].actor, /Rakesh Nayak/);
});

test("6 · the order book an employee reads is their own branch's, whole and only", () => {
  const store = freshStore();
  const { actor } = signIn(store, "meera.das@swarnova.in");

  const orders = listEmployeeOrders(store, actor);
  assert.deepEqual(
    orders.map((order) => order.id).sort(),
    ordersAt(store, BBSR).map((order) => order.id).sort()
  );
  assert.ok(orders.every((order) => order.branchId === BBSR));
  assert.ok(!orders.some((order) => order.id === "ORD-2026-9389"), "a Cuttack order never appears");
});

test("7 · naming another branch in a query is refused, never honoured", () => {
  const store = freshStore();
  const { actor } = signIn(store, "meera.das@swarnova.in");

  assert.throws(() => listEmployeeOrders(store, actor, { branchId: CTC }), /only branch/i);
  assert.throws(() => listEmployeeCustomers(store, actor, { branchId: "BR-003" }), /only branch/i);
  assert.throws(() => listEmployeeInventory(store, actor, { branchId: CTC }), /only branch/i);
});

test("8 · another branch's order cannot be read by id", () => {
  const store = freshStore();
  const { actor } = signIn(store, "meera.das@swarnova.in");

  assert.throws(() => getEmployeeOrder(store, actor, "ORD-2026-9389"), /another boutique/i);
  assert.throws(() => getEmployeeOrder(store, actor, "ORD-2026-9290"), /another boutique/i);

  const own = getEmployeeOrder(store, actor, "ORD-2026-9390");
  assert.equal(own.branchId, BBSR);
});

test("9 · another branch's order cannot be moved along the lifecycle", () => {
  const store = freshStore();
  const { actor } = signIn(store, "meera.das@swarnova.in");
  const target = store.orders.find((order) => order.branchId === CTC && order.status === "Placed");

  assert.throws(
    () => updateEmployeeOrderStatus(store, actor, target.id, "Processing"),
    /another boutique/i
  );
  assert.equal(store.orders.find((order) => order.id === target.id).status, "Placed");
});

test("10 · orders.manage moves a branch order through the shared lifecycle, and the lifecycle itself stands", () => {
  const store = freshStore();
  const bikash = actorFor(store, "EMP-008"); // Cuttack · Branch Sales (orders: manage)

  const placed = store.orders.find((order) => order.branchId === CTC && order.status === "Placed");
  const moved = updateEmployeeOrderStatus(store, bikash, placed.id, "Processing");
  assert.equal(moved.status, "Processing");

  /* No employee-specific lifecycle: the business flow is the only one. */
  const delivered = store.orders.find((order) => order.branchId === CTC && order.status === "Delivered");
  assert.throws(
    () => updateEmployeeOrderStatus(store, bikash, delivered.id, "Processing"),
    /cannot move to/
  );
});

test("11 · orders.view alone can look an order up but cannot manage it", () => {
  const store = freshStore();
  const rakesh = actorFor(store, "EMP-010"); // Bhubaneswar · front desk (orders: view)

  const order = getEmployeeOrder(store, rakesh, "ORD-2026-9390");
  assert.equal(order.branchId, BBSR);
  assert.deepEqual(order.actions, ["Processing", "Cancelled"], "the lifecycle is reported, not a grant");
  assert.throws(
    () => updateEmployeeOrderStatus(store, rakesh, "ORD-2026-9390", "Processing"),
    /order management capability/
  );
});

test("12 · the customer book holds the branch's own customers, measured by the branch's own trade", () => {
  const store = freshStore();
  const { actor } = signIn(store, "meera.das@swarnova.in");

  const customers = listEmployeeCustomers(store, actor);
  const expectedIds = [
    ...new Set(ordersAt(store, BBSR).map((order) => order.customerId)),
  ].sort();
  assert.deepEqual(customers.map((customer) => customer.id).sort(), expectedIds);

  const aadya = customers.find((customer) => customer.id === "CUST-84920");
  const branchOrders = ordersAt(store, BBSR).filter((order) => order.customerId === "CUST-84920");
  assert.equal(aadya.orderCount, branchOrders.length);
  assert.equal(
    aadya.totalSpent,
    branchOrders
      .filter((order) => order.status !== "Cancelled")
      .reduce((sum, order) => sum + order.total, 0),
    "cross-branch spend is never counted here"
  );
});

test("13 · another branch's customer record is refused", () => {
  const store = freshStore();
  const { actor } = signIn(store, "meera.das@swarnova.in");

  /* The canonical directory holds her — this branch simply never served her. */
  assert.ok(store.customers.some((customer) => customer.id === "CUST-91552"));
  assert.ok(!listEmployeeCustomers(store, actor).some((customer) => customer.id === "CUST-91552"));
  assert.throws(() => getEmployeeCustomer(store, actor, "CUST-91552"), /branch-scoped/i);
});

test("14 · inventory lists only this branch's stock lines, with reorder state", () => {
  const store = freshStore();
  const { actor } = signIn(store, "rohit.panda@swarnova.in");

  const rows = listEmployeeInventory(store, actor);
  assert.deepEqual(
    rows.map((row) => row.id).sort(),
    store.inventory
      .filter((row) => row.branchId === BBSR)
      .map((row) => row.id)
      .sort()
  );

  const low = rows.find((row) => row.id === "STK-005-BR-001");
  assert.equal(low.state, "low");
  assert.equal(low.reorderLevel, 2);
});

test("15 · another branch's stock line cannot be adjusted", () => {
  const store = freshStore();
  const { actor } = signIn(store, "meera.das@swarnova.in");
  const target = store.inventory.find((row) => row.id === "STK-001-BR-002");
  const before = target.available;

  assert.throws(
    () =>
      adjustEmployeeInventory(store, actor, target.id, {
        delta: 5,
        reason: "Stock received from head office.",
      }),
    /own stock|another boutique/i
  );
  assert.equal(target.available, before);
});

test("16 · inventory.view cannot adjust stock; inventory.manage can — and the adjustment rules stand", () => {
  const store = freshStore();

  const viewer = actorFor(store, "EMP-008"); // inventory: view
  assert.throws(
    () =>
      adjustEmployeeInventory(store, viewer, "STK-001-BR-002", {
        delta: 1,
        reason: "Cycle count correction.",
      }),
    /inventory management capability/
  );

  const manager = actorFor(store, "EMP-004"); // Bhubaneswar · Inventory Associate
  const row = store.inventory.find((item) => item.id === "STK-001-BR-001");
  const before = row.available;

  const updated = adjustEmployeeInventory(store, manager, row.id, {
    delta: 4,
    reason: "Stock received from head office.",
  });
  assert.equal(updated.available, before + 4);

  assert.throws(
    () => adjustEmployeeInventory(store, manager, row.id, { delta: -500, reason: "Below zero." }),
    /below zero/i
  );
  assert.throws(
    () => adjustEmployeeInventory(store, manager, row.id, { delta: 2, reason: "   " }),
    /reason is required/i
  );
  assert.throws(
    () => adjustEmployeeInventory(store, manager, row.id, { delta: 0, reason: "No change." }),
    /whole-piece/i
  );
});

test("17 · every adjustment is audited with the real employee, the branch, the entity and the reason", () => {
  const store = freshStore();
  const manager = actorFor(store, "EMP-004");
  const reason = "Cycle count — two pieces received from the workshop.";

  adjustEmployeeInventory(store, manager, "STK-002-BR-001", { delta: 2, reason });

  const entry = store.auditLog.find((item) => item.action === "inventory.adjust");
  assert.ok(entry, "the adjustment reaches the canonical audit trail");
  assert.equal(entry.entityId, "STK-002-BR-001");
  assert.equal(entry.branchId, BBSR);
  assert.match(entry.actor, /Rohit Panda/);
  assert.match(entry.detail, /two pieces received from the workshop/);

  const movement = store.inventoryMovements[0];
  assert.equal(movement.type, "adjustment");
  assert.equal(movement.stockId, "STK-002-BR-001");
  assert.equal(movement.delta, 2);
  assert.match(movement.by, /Rohit Panda/);
  assert.equal(movement.note, reason);
});

test("18 · reports need reports.view and report on this branch only", () => {
  const store = freshStore();
  const meera = actorFor(store, "EMP-001");

  const reports = employeeReports(store, meera);
  assert.equal(reports.branch.id, BBSR);

  const branchSales = ordersAt(store, BBSR)
    .filter((order) => order.status !== "Cancelled")
    .reduce((sum, order) => sum + order.total, 0);
  assert.equal(reports.sales.all.value, branchSales);
  assert.equal(
    reports.ordersByStatus.reduce((sum, row) => sum + row.count, 0),
    ordersAt(store, BBSR).length,
    "the order book shown is this branch's"
  );

  const noReports = actorFor(store, "EMP-008");
  assert.throws(() => employeeReports(store, noReports), /reports capability/);
});

test("19 · product governance cannot be reached from a branch account — head office keeps it", () => {
  const store = freshStore();
  const meera = actorFor(store, "EMP-001");

  assert.throws(
    () => updateGovernanceProduct(store, "JWL-009", { price: 120000 }, meera),
    /product governance belongs to head office/
  );
  assert.throws(
    () => transitionGovernanceProduct(store, "JWL-011", "publish", {}, meera),
    /product governance belongs to head office/
  );

  /* The same call from head office gets past the boundary and reaches the
     ordinary editing rules — the guard refuses branch accounts only. */
  const edited = updateGovernanceProduct(
    store,
    "JWL-009",
    { price: 120000 },
    { role: ROLES.ADMIN, label: "Arpita Mohanty — Admin" }
  );
  assert.equal(edited.price, 120000);
});

test("20 · capability gating holds at every layer: navigation, route gates and payloads", () => {
  const store = freshStore();
  const rohitSession = signIn(store, "rohit.panda@swarnova.in").session; // catalogue · inventory · branches
  const meeraSession = signIn(store, "meera.das@swarnova.in").session;

  /* Navigation — a profile only ever sees the doors it can open. */
  const rohitNav = filterNavigation(CONSOLE_CONFIG.employee.navigation, rohitSession.permissions);
  const rohitLabels = rohitNav.flatMap((group) => group.items.map((item) => item.label));
  assert.deepEqual(rohitLabels, [
    "Dashboard",
    "Products",
    "Inventory",
    "Branch Operations",
    "My Profile",
  ]);

  const meeraLabels = filterNavigation(
    CONSOLE_CONFIG.employee.navigation,
    meeraSession.permissions
  ).flatMap((group) => group.items.map((item) => item.label));
  assert.ok(meeraLabels.includes("Reports"));
  assert.ok(!rohitLabels.includes("Reports"));
  for (const forbidden of ["Employees", "Admins", "Roles & Permissions", "Platform Settings", "Governance", "Media"]) {
    assert.ok(!meeraLabels.includes(forbidden), `${forbidden} belongs to another console`);
  }
  assert.ok(
    CONSOLE_CONFIG.employee.navigation
      .flatMap((group) => group.items)
      .every((item) => item.to.startsWith("/employee")),
    "the employee console never links into another console"
  );

  /* Direct navigation — the route gate renders the refusal, not the page. */
  const denied = renderGate(rohitSession, CAPABILITIES.REPORTS_VIEW);
  assert.match(denied, /Access Restricted/);
  assert.ok(!denied.includes("RESTRICTED-PAGE-MARKER"), "no restricted content leaks through");

  const allowed = renderGate(meeraSession, CAPABILITIES.REPORTS_VIEW);
  assert.ok(allowed.includes("RESTRICTED-PAGE-MARKER"));

  /* Payloads — blocks owned by a capability are absent without it. */
  const rohitOverview = employeeOverview(store, actorFor(store, "EMP-004"));
  assert.equal(rohitOverview.today, null);
  assert.equal(rohitOverview.openOrders, null);
  assert.deepEqual(rohitOverview.recentOrders, []);
  assert.ok(rohitOverview.inventory.units > 0);

  const rohitBranch = employeeBranchOperations(store, actorFor(store, "EMP-004"));
  assert.equal(rohitBranch.orders, null);
  assert.ok(rohitBranch.inventory.rows > 0);
  assert.equal(rohitBranch.branch.id, BBSR);
});
