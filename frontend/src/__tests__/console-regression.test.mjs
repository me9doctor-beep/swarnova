/**
 * PHASE 10 REGRESSION — the experiences that must not move
 * -----------------------------------------------------------------------------
 * Phase 10 adds the Employee console and hardens branch scope; it must change
 * nothing for the two consoles and the storefront that already exist. These
 * checks exercise the same canonical store the employee tests use:
 *
 *   · Admin sign-in, overview and reports
 *   · Super Admin sign-in, platform overview and the audit trail — including
 *     the employee actions Phase 10 records
 *   · the customer storefront's published-only catalogue
 *   · Admin staff management (the one staff-creation path)
 */
import test from "node:test";
import assert from "node:assert/strict";

import mockProvider from "../services/providers/mock/mockProvider.js";
import {
  adjustEmployeeInventory,
  adminOverview,
  adminReports,
  authenticateStaff,
  createEmployee,
  createGovernanceStore,
  listAuditLogs,
  platformOverview,
} from "../services/providers/mock/governanceStore.js";
import { ROLES } from "../features/authentication/roles.js";
import { CAPABILITIES } from "../features/authentication/capabilities.js";
import { can } from "../features/authentication/permissions.js";

const PASSWORD = "Swarnova@123";

test("regression · Admin sign-in and the Admin console payloads are unchanged", () => {
  const store = createGovernanceStore();
  const session = authenticateStaff(store, { email: "arpita.mohanty@swarnova.in", password: PASSWORD });

  assert.equal(session.role, ROLES.ADMIN);
  assert.ok(can(session.permissions, CAPABILITIES.ORDERS_MANAGE));
  assert.ok(can(session.permissions, CAPABILITIES.STAFF_MANAGE));

  const overview = adminOverview(store);
  assert.ok(overview.business.openOrders > 0);
  assert.ok(overview.business.activeBranches > 0);
  assert.ok(Array.isArray(overview.attention));

  const reports = adminReports(store);
  assert.equal(reports.salesByBranch.length, store.branches.length);
});

test("regression · Super Admin sign-in, platform overview and audit still work — and employee actions land in the trail", () => {
  const store = createGovernanceStore();
  const session = authenticateStaff(store, { email: "superadmin@swarnova.in", password: PASSWORD });

  assert.equal(session.role, ROLES.SUPER_ADMIN);
  assert.deepEqual(session.permissions, ["*"]);

  const rohit = store.employees.find((employee) => employee.id === "EMP-004");
  adjustEmployeeInventory(
    store,
    { id: rohit.id, role: ROLES.EMPLOYEE, label: `${rohit.name} — Employee` },
    "STK-003-BR-001",
    { delta: 1, reason: "Received one piece from the workshop." }
  );

  const logs = listAuditLogs(store, { action: "inventory.adjust" });
  assert.ok(logs.length > 0);
  assert.match(logs[0].actor, /Rohit Panda/);
  assert.equal(logs[0].branchId, "BR-001");

  const platform = platformOverview(store);
  assert.ok(platform.products.total > 0);
  assert.ok(platform.storefront.status);
});

test("regression · the customer storefront still serves published pieces only", async () => {
  const products = await mockProvider.getProducts({});
  assert.ok(products.length > 0);
  assert.ok(products.some((product) => product.id === "JWL-001"));
  assert.ok(
    !products.some((product) => product.id === "JWL-009"),
    "a draft piece never reaches the storefront"
  );

  const detail = await mockProvider.getProduct("JWL-001");
  assert.equal(detail.id, "JWL-001");
  assert.ok(detail.images.length > 0);
});

test("regression · Admin staff management can still create an employee within its own authority", () => {
  const store = createGovernanceStore();
  const admin = { role: ROLES.ADMIN, permissions: ["*"], label: "Arpita Mohanty — Admin" };
  const before = store.employees.length;

  const created = createEmployee(
    store,
    {
      name: "Regression Hire",
      email: "regression.hire@swarnova.in",
      phone: "+91 94371 30001",
      branchId: "BR-001",
      role: "Sales Consultant",
      profileId: "PROF-BRANCH-SALES",
    },
    admin
  );

  assert.equal(store.employees.length, before + 1);
  assert.equal(created.branchId, "BR-001");
  assert.equal(created.profileId, "PROF-BRANCH-SALES");
  assert.ok(created.temporaryPassword);
  assert.equal(store.auditLog[0].action, "employee.create");
});
