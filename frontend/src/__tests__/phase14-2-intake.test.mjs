import "./support/browser-globals.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { routeTree } from "../app/router.jsx";
import RequireCustomer from "../features/customer-auth/RequireCustomer.jsx";
import { CustomerAuthContext } from "../features/customer-auth/CustomerAuthProvider.jsx";
import { loginPathWithReturnTo } from "../features/customer-auth/customerRoutes.js";
import { ROLES } from "../features/authentication/roles.js";
import { createGovernanceStore } from "../services/providers/mock/governanceStore.js";
import mockProvider from "../services/providers/mock/mockProvider.js";
import { intakeService } from "../services/intakeService.js";
import { intakePaths, intakeLink } from "../utils/links.js";
import IntakeRecord from "../components/requests/IntakeRecord.jsx";

function fresh() {
  const provider = {
    ...mockProvider,
    _store: createGovernanceStore(),
    _customerSessionId: "CUST-84920",
  };
  // Pin the provider session, never supply a customer claim with request data.
  provider.customerSessionId = function () {
    return this._customerSessionId;
  };
  return provider;
}
const custom = {
  category: "Ring",
  description: "An understated anniversary piece",
  quantity: 1,
};
const appointment = {
  type: "PRIVATE_VIEWING",
  branchId: "BR-001",
  requestedDate: "2099-10-01",
  requestedTime: "14:30",
};
function servicePayload(provider, type = "RETURN_REQUEST") {
  const order = provider
    .getStore()
    .orders.find((o) => o.customerId === provider.customerSessionId());
  return {
    type,
    orderId: order.id,
    orderItemId: order.items[0].id,
    reason: "Fit",
    description: "Please advise on the fit.",
  };
}
const create = (p, kind, payload) => intakeService.create(p, kind, payload);

test("14.2 · custom submit derives owner, status, contact, IDs and timestamps; no order is created", async () => {
  const p = fresh();
  const count = p.getStore().orders.length;
  const r = await create(p, "custom", {
    ...custom,
    customerId: "someone-else",
    status: "COMPLETED",
    id: "fake",
  });
  assert.equal(r.customerId, "CUST-84920");
  assert.equal(r.status, "SUBMITTED");
  assert.match(r.id, /^REQ-\d{6}$/);
  assert.ok(r.contact.email);
  assert.ok(r.createdAt);
  assert.equal(r.branchId, null);
  assert.equal(p.getStore().orders.length, count);
});
test("14.2 · custom product and AI references validated and snapshotted", async () => {
  const p = fresh();
  const options = await intakeService.options(p, "custom");
  const r = await create(p, "custom", {
    ...custom,
    productId: options.products[0].id,
    aiDesignId: options.designs[0].id,
  });
  assert.equal(r.productId, options.products[0].id);
  assert.equal(r.aiDesignId, options.designs[0].id);
  assert.equal(r.source, "PRODUCT_AND_AI");
  assert.ok(r.productName);
  assert.ok(r.designName);
  for (const patch of [{ productId: "missing" }, { aiDesignId: "missing" }])
    await assert.rejects(create(p, "custom", { ...custom, ...patch }), {
      code: "VALIDATION_ERROR",
    });
});
test("14.2 · custom validation and unsupported upload fail without writing", async () => {
  const p = fresh();
  for (const patch of [
    { category: " " },
    { description: "" },
    { description: "x".repeat(2001) },
    { quantity: 0 },
    { style: {} },
  ])
    await assert.rejects(create(p, "custom", { ...custom, ...patch }), {
      code: "VALIDATION_ERROR",
    });
  await assert.rejects(
    create(p, "custom", { ...custom, referenceImages: ["data:fake"] }),
    { code: "UNAVAILABLE" },
  );
  assert.equal(p.getStore().intakeRequests.length, 0);
});
for (const kind of ["custom", "appointment", "service"]) {
  test(`14.2 · ${kind} list/detail are owner-scoped and detached`, async () => {
    const p = fresh();
    const payload =
      kind === "custom"
        ? custom
        : kind === "appointment"
          ? appointment
          : servicePayload(p);
    assert.deepEqual(await intakeService.list(p, kind), []);
    const r = await create(p, kind, payload);
    assert.equal((await intakeService.list(p, kind))[0].id, r.id);
    assert.equal((await intakeService.get(p, kind, r.id)).id, r.id);
    r.status = "COMPLETED";
    assert.notEqual(
      (await intakeService.get(p, kind, r.id)).status,
      "COMPLETED",
    );
    p._customerSessionId = "CUST-77341";
    assert.deepEqual(await intakeService.list(p, kind), []);
    await assert.rejects(intakeService.get(p, kind, r.id), {
      code: "NOT_FOUND",
    });
    p._customerSessionId = null;
    await assert.rejects(create(p, kind, payload), { code: "SESSION_EXPIRED" });
    await assert.rejects(intakeService.list(p, kind), {
      code: "SESSION_EXPIRED",
    });
  });
}
for (const type of ["PRIVATE_VIEWING", "FITTING"])
  test(`14.2 · ${type} requests a branch, never confirms a slot`, async () => {
    const p = fresh();
    const r = await create(p, "appointment", {
      ...appointment,
      type,
      status: "CONFIRMED",
    });
    assert.equal(r.type, type);
    assert.equal(r.branchId, "BR-001");
    assert.equal(r.status, "REQUESTED");
    assert.equal(r.requestedTime, "14:30");
    assert.equal(r.confirmedAt, undefined);
  });
test("14.2 · appointment rejects invalid date, time, type, disabled and missing branches", async () => {
  const p = fresh();
  for (const patch of [
    { requestedDate: "2099-02-30" },
    { requestedDate: "2000-01-01" },
    { requestedTime: "24:00" },
    { type: "RESERVATION" },
  ])
    await assert.rejects(
      create(p, "appointment", { ...appointment, ...patch }),
      { code: "VALIDATION_ERROR" },
    );
  await assert.rejects(
    create(p, "appointment", { ...appointment, branchId: "missing" }),
    { code: "UNAVAILABLE" },
  );
  p.getStore().branches.find((b) => b.id === appointment.branchId).status =
    "disabled";
  await assert.rejects(create(p, "appointment", appointment), {
    code: "UNAVAILABLE",
  });
});
for (const type of ["RETURN_REQUEST", "CARE_REQUEST"])
  test(`14.2 · ${type} uses canonical owned order and item without mutating order`, async () => {
    const p = fresh();
    const payload = servicePayload(p, type);
    const before = JSON.stringify(p.getStore().orders);
    const r = await create(p, "service", { ...payload, branchId: "forged" });
    assert.equal(r.status, "SUBMITTED");
    assert.equal(r.type, type);
    assert.equal(r.productId, payload.orderItemId);
    assert.notEqual(r.branchId, "forged");
    assert.equal(JSON.stringify(p.getStore().orders), before);
  });
test("14.2 · service rejects other owners, cross-order items and product mismatches", async () => {
  const p = fresh();
  const payload = servicePayload(p);
  const foreign = p
    .getStore()
    .orders.find((o) => o.customerId !== p.customerSessionId());
  for (const patch of [
    { orderId: foreign.id, orderItemId: foreign.items[0].id },
    { orderItemId: "missing" },
    { productId: "wrong" },
  ])
    await assert.rejects(create(p, "service", { ...payload, ...patch }), {
      code: "NOT_FOUND",
    });
  await assert.rejects(create(p, "service", { ...payload, reason: "" }), {
    code: "VALIDATION_ERROR",
  });
  await assert.rejects(create(p, "service", { ...payload, type: "REFUND" }), {
    code: "VALIDATION_ERROR",
  });
});
for (const kind of ["custom", "appointment", "service"])
  test(`14.2 · ${kind} staff capability, branch, Admin and Super Admin scope`, async () => {
    const p = fresh();
    const store = p.getStore();
    const employee = store.employees.find((e) => e.status !== "disabled");
    employee.capabilities = { orders: "view" };
    const branchId = employee.branchId;
    const other = store.branches.find(
      (b) => b.id !== branchId && b.status !== "disabled",
    ).id;
    // Create real requests for each branch, using owned canonical orders for service.
    for (const branch of [branchId, other]) {
      if (kind === "service") {
        const order = store.orders.find((o) => o.branchId === branch);
        p._customerSessionId = order.customerId;
        await create(p, kind, {
          type: "CARE_REQUEST",
          orderId: order.id,
          orderItemId: order.items[0].id,
          reason: "Care",
          description: "Advice please",
        });
      } else
        await create(
          p,
          kind,
          kind === "custom"
            ? { ...custom, preferredBranchId: branch }
            : { ...appointment, branchId: branch },
        );
    }
    const actor = {
      id: employee.id,
      role: ROLES.EMPLOYEE,
      branchId: other,
      permissions: ["*"],
    };
    assert.equal((await intakeService.operations(p, actor, kind)).length, 1);
    await assert.rejects(
      intakeService.operations(p, actor, kind, { branchId: other }),
    );
    const admin = store.admins.find((a) => a.status !== "disabled");
    admin.scope = "head-office";
    assert.equal(
      (
        await intakeService.operations(
          p,
          { id: admin.id, role: ROLES.ADMIN },
          kind,
        )
      ).length,
      2,
    );
    admin.scope = "branch";
    admin.branchId = branchId;
    assert.equal(
      (
        await intakeService.operations(
          p,
          { id: admin.id, role: ROLES.ADMIN },
          kind,
        )
      ).length,
      1,
    );
    assert.equal(
      (await intakeService.operations(p, { role: ROLES.SUPER_ADMIN }, kind))
        .length,
      2,
    );
    employee.capabilities.orders = "none";
    await assert.rejects(intakeService.operations(p, actor, kind));
    await assert.rejects(
      intakeService.operations(p, { role: ROLES.CUSTOMER }, kind),
    );
  });
test("14.2 · unavailable provider contract returns honest unavailable error", async () => {
  await assert.rejects(intakeService.create({}, "custom", custom), {
    code: "UNAVAILABLE",
  });
});
test("14.2 · all deep-link routes mounted behind customer or staff guards", () => {
  const customer = routeTree.find((r) => r.path === "/");
  for (const path of ["custom-jewellery", "appointments"])
    assert.equal(
      customer.children.find((r) => r.path === path).element.type,
      RequireCustomer,
    );
  const account = customer.children.find((r) => r.path === "account");
  assert.equal(account.element.type, RequireCustomer);
  for (const { segment } of Object.values(intakePaths)) {
    assert.ok(account.children.find((r) => r.path === segment));
    assert.ok(account.children.find((r) => r.path === `${segment}/:id`));
    for (const prefix of ["/admin", "/employee", "/super-admin"])
      assert.ok(
        routeTree
          .find((r) => r.path === prefix)
          .children.find((r) => r.path === segment),
      );
  }
  assert.ok(account.children.find((r) => r.path === "service-requests/new"));
});
test("14.2 · guest guard does not render intake and preserves contextual login returnTo", () => {
  const path = intakeLink("custom", { productId: "JWL-001" });
  assert.equal(
    new URL(
      loginPathWithReturnTo(path),
      "https://swarnova.test",
    ).searchParams.get("returnTo"),
    path,
  );
  const html = renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      { initialEntries: [path] },
      React.createElement(
        CustomerAuthContext.Provider,
        { value: { isAuthenticated: false, isLoading: false } },
        React.createElement(RequireCustomer, null, "private intake"),
      ),
    ),
  );
  assert.ok(!html.includes("private intake"));
});
test("14.2 · request detail renders status, submitted information, references and safe text", async () => {
  const p = fresh();
  const r = await create(p, "custom", {
    ...custom,
    description: "<script>alert(1)</script>",
  });
  const html = renderToStaticMarkup(
    React.createElement(IntakeRecord, { record: r }),
  );
  assert.match(html, /SUBMITTED/);
  assert.match(html, /Ring/);
  assert.match(html, /&lt;script&gt;/);
  assert.ok(!html.includes("<script>"));
});
