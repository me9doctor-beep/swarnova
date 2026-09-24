/**
 * PHASE 13 — CROSS-SYSTEM INTEGRATION + PLATFORM AUDIT CHECKS
 * -----------------------------------------------------------------------------
 * Phases 0–12 each proved their own surface. This file proves the SEAMS:
 * that the four experiences are wired to real components, that every module
 * reads the same canonical record rather than a snapshot of it, that a
 * mutation in one domain is visible in the domains that depend on it, and that
 * no link, query or overlay quietly points somewhere the platform does not
 * have.
 *
 * The strongest assertion here is the sweep: it renders the REAL `routeTree`
 * exported by `app/router.jsx` through a real data router — not a test copy of
 * the route table — so a page mounted without being imported, a route that
 * lost its guard, or a screen that throws for one role and not another cannot
 * pass unnoticed.
 *
 * Run from `frontend/`:
 *
 *   npm test
 *   node --import ./src/__tests__/support/register-assets.mjs --test src/__tests__/
 */
import "./support/browser-globals.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createMemoryRouter, RouterProvider } from "react-router-dom";

import { routeTree } from "../app/router.jsx";
import mockProvider from "../services/providers/mock/mockProvider.js";
import {
  authenticateCustomer,
  authenticateStaff,
  createGovernanceStore,
  employeeBranchOperations,
  employeeOverview,
  employeeReports,
  getAdminOrder,
  listAdminCustomers,
  listInventoryMovements,
  placeCheckoutOrder,
  registerCustomer,
  RESERVING_ORDER_STATUSES,
  updateAdminOrderStatus,
} from "../services/providers/mock/governanceStore.js";
import { GST_RATE } from "../services/pricingService.js";
import DataProvider from "../services/providers/DataProvider.jsx";
import AuthProvider from "../features/authentication/AuthProvider.jsx";
import CustomerAuthProvider from "../features/customer-auth/CustomerAuthProvider.jsx";
import {
  GUEST_OWNER_ID,
  ownerStorageKey,
  resolveOwnerValue,
} from "../state/ownerScopedStorage.js";
import { clearStorage } from "./support/browser-globals.mjs";
import {
  platformAdmins,
  platformEmployees,
  superAdminAccount,
} from "../mock/data/index.js";
import { CUSTOMER_DEMO_PASSWORD } from "../mock/data/customer/index.js";
import { ROLES } from "../features/authentication/roles.js";

const AADYA = "CUST-84920";
const AADYA_ADDR = "ADDR-001";
const SRC_DIR = join(new URL(".", import.meta.url).pathname, ".."); // frontend/src
const FRONTEND_DIR = join(SRC_DIR, "..");
const read = (relative) => readFileSync(join(SRC_DIR, relative), "utf8");

/** A provider pointed at a freshly seeded store, so no test inherits another's writes. */
function freshProvider() {
  mockProvider._store = createGovernanceStore();
  return mockProvider;
}

/** Every route in the tree, with parents resolved to concrete paths. */
function walkRoutes(routes, parent = "", out = []) {
  for (const route of routes) {
    const full =
      ((`${parent}/${route.path ?? ""}`.replace(/\/+/g, "/") || "/").replace(/\/+$/, "") || "/");
    if (route.path !== undefined || route.index) out.push({ path: full, route });
    if (route.children) walkRoutes(route.children, full, out);
  }
  return out;
}
const allRoutes = walkRoutes(routeTree);

/** Sessions for the three staff roles, seeded the way the staff login does. */
function staffSessions() {
  const store = createGovernanceStore();
  return {
    "/super-admin": authenticateStaff(store, {
      email: superAdminAccount.email,
      password: superAdminAccount.password,
    }),
    "/admin": authenticateStaff(store, {
      email: platformAdmins[0].email,
      password: platformAdmins[0].password,
    }),
    "/employee": authenticateStaff(store, {
      email: platformEmployees[0].email,
      password: platformEmployees[0].password,
    }),
  };
}

const PARAMS = { id: "JWL-001", slug: "bridal-gold", branchId: "BR-001" };
const concrete = (path) => path.replace(/:(\w+)/g, (_, key) => PARAMS[key] ?? "x");

/** Render one path of the REAL tree, as the given staff session. */
function renderPath(path, session, provider = mockProvider) {
  const router = createMemoryRouter(routeTree, { initialEntries: [path] });
  return renderToStaticMarkup(
    h(
      DataProvider,
      { provider },
      h(
        AuthProvider,
        { initialSession: session ?? null },
        h(
          CustomerAuthProvider,
          { initialSession: null },
          h(RouterProvider, { router })
        )
      )
    )
  );
}

const plainText = (html) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

/* ------------------------------------------------------------------------- */
/* 1 · The router mounts real components (the seam that once did not)         */
/* ------------------------------------------------------------------------- */

test("router · no route in the real tree mounts an undefined component", () => {
  const broken = allRoutes
    .filter(({ route }) => route.element !== undefined)
    .filter(({ route }) => typeof route.element?.type !== "function")
    .map(({ path }) => path);

  /* A page referenced without being imported compiles to an element whose
     type is undefined — the exact defect this phase exists to prove cannot
     come back. */
  assert.deepEqual(broken, [], `routes with an unmountable element: ${broken.join(", ")}`);
  assert.ok(allRoutes.length >= 60, `the route tree shrank to ${allRoutes.length} routes`);
});

/** The components a route element renders, guards included. */
function mountedNames(element, out = []) {
  if (!element || typeof element !== "object") return out;
  if (typeof element.type === "function") out.push(element.type.name);
  const children = element.props?.children;
  for (const child of Array.isArray(children) ? children : [children]) {
    mountedNames(child, out);
  }
  return out;
}

test("router · checkout and order confirmation are wired to their pages", () => {
  const byPath = new Map(allRoutes.map((entry) => [entry.path, entry.route]));
  assert.ok(mountedNames(byPath.get("/checkout").element).includes("CheckoutPage"));
  assert.ok(mountedNames(byPath.get("/order-confirmation/:id").element).includes("OrderConfirmationPage"));

  const routerSource = read("app/router.jsx");
  assert.ok(
    routerSource.includes(
      'import CheckoutPage from "../pages/customer/checkout/CheckoutPage.jsx";'
    ),
    "CheckoutPage must be imported, not merely referenced"
  );
  assert.ok(
    routerSource.includes(
      'import OrderConfirmationPage from "../pages/customer/checkout/OrderConfirmationPage.jsx";'
    ),
    "OrderConfirmationPage must be imported, not merely referenced"
  );
});

test("router · the Super Admin's branch drill-down is a real route", () => {
  const route = allRoutes.find((entry) => entry.path === "/super-admin/branches/:branchId");
  assert.ok(route, "the drill-down route is missing from the tree");
  assert.equal(route.route.element.type.name, "BranchDrillDownPage");
  assert.equal(route.route.handle.crumb, "Branch Drill-down");
});

test("sweep · every route renders for the role that owns it", () => {
  const sessions = staffSessions();
  for (const { path } of allRoutes.filter((entry) => !entry.path.includes("*"))) {
    const target = concrete(path);
    const root = Object.keys(sessions).find((prefix) => target.startsWith(prefix));
    const html = renderPath(target, root ? sessions[root] : null, freshProvider());
    if (root) {
      /* A console screen that renders nothing at all is a failure the sweep has
         to see: the guard bounced, or the page returned null. */
      assert.ok(html.length > 1500, `${target} rendered no console chrome`);
    }
  }
  delete mockProvider._store;
});

test("sweep · the guest storefront and the member-only bounce both render", () => {
  for (const path of ["/", "/collections", "/products", "/cart", "/login", "/register"]) {
    assert.doesNotThrow(
      () => renderPath(path, null, freshProvider()),
      `${path} threw for a guest`
    );
  }
  /* /account/* is guarded: a guest is bounced, so nothing private renders. */
  const html = plainText(renderPath("/account/orders", null));
  assert.doesNotMatch(html, /Saved Address|Order History/);
  delete mockProvider._store;
});

/* ------------------------------------------------------------------------- */
/* 2 · Canonical data: the bag, the fitting room, the order book             */
/* ------------------------------------------------------------------------- */

test("canonical bag · the shared add resolves ids through the storefront's own read", async () => {
  const source = read("hooks/useAddProductToBag.js");
  assert.match(source, /catalogService\.getProduct\(/, "must resolve through the ONE catalogue service");
  assert.match(source, /useCart\(\)/, "must add through the ONE bag");
  assert.doesNotMatch(source, /from "\.\.\/mock\//, "a hook may not import mock data directly");

  const provider = freshProvider();
  const published = await provider.getProduct("JWL-006");
  assert.equal(published.status, "published");
  assert.equal(await provider.getProduct("JWL-010"), null, "a non-published piece must not be bagged");
  assert.equal(await provider.getProduct("DRAFT-999"), null);
  assert.equal(await provider.getProduct(undefined), null);
});

test("canonical bag · a cart line is the product itself, priced by the product", async () => {
  const product = await freshProvider().getProduct("JWL-003");
  assert.equal(product.sku, "SWN-ERG-022");
  assert.equal(product.price, 84900);
  assert.equal(product.href, "/product/JWL-003", "the deep link is the product's own route");

  const lines = [{ id: product.id, product, quantity: 2 }];
  const subtotal = lines.reduce((total, line) => total + line.product.price * line.quantity, 0);
  assert.equal(subtotal, 169800, "the bag never carries a price of its own");
});

test("try-on · the fitting room dresses the canonical product and hands back its id", async () => {
  const provider = freshProvider();
  const source = await provider.getTryOnSource({ sourceType: "product", sourceId: "JWL-006" });
  const canonical = await provider.getProduct("JWL-006");
  assert.equal(source.sourceId, "JWL-006");
  for (const field of ["id", "name", "price", "purity", "href"]) {
    assert.equal(source.jewellery[field], canonical[field], `try-on ${field} drifted from the catalogue`);
  }

  /* An AI concept is not purchasable: the room still presents it, the bag must
     not — and nothing canonical exists behind its id. */
  const concept = await provider.getTryOnSource({ sourceType: "ai-design", sourceId: "AID-001" });
  assert.equal(concept.sourceType, "ai-design");
  assert.equal(concept.jewellery.price ?? null, null, "a concept must not pretend to carry a price");
  assert.equal(await provider.getProduct(concept.sourceId), null);

  const page = read("pages/customer/virtual-try-on/VirtualTryOnPage.jsx");
  assert.match(page, /addCanonical\(fitting\.jewellery\.id\)/, "the room adds the canonical id");
  assert.doesNotMatch(page, /useCart\(\)/, "the room must not keep its own bag logic");
  assert.match(
    read("pages/customer/account/SavedTryOnsPage.jsx"),
    /addCanonical\(entry\.result\?\.sourceId\)/,
    "the saved shelf adds the same canonical id"
  );
});

test("order book · every line mirrors the canonical product and every total reconciles", () => {
  const store = createGovernanceStore();
  for (const order of store.orders) {
    for (const item of order.items) {
      const product = store.products.find((candidate) => candidate.id === item.id);
      assert.ok(product, `${order.orderNumber}: ${item.id} has no canonical product`);
      assert.equal(item.name, product.name, `${order.orderNumber} name`);
      assert.equal(item.sku, product.sku, `${order.orderNumber} sku`);
      assert.equal(item.price, product.price, `${order.orderNumber} price`);
      assert.equal(item.href, `/product/${product.id}`, `${order.orderNumber} href`);
    }

    const subtotal = order.items.reduce((total, item) => total + item.price * item.quantity, 0);
    assert.equal(order.subtotal, subtotal, `${order.orderNumber} subtotal`);
    assert.equal(order.total, order.subtotal + order.shipping, `${order.orderNumber} total`);
    /* GST is inclusive, so the stored tax figure is the same extraction the
       pricing service performs — one rule, asserted rather than duplicated. */
    assert.equal(
      order.taxAmount,
      Math.round(order.total - order.total / (1 + GST_RATE)),
      `${order.orderNumber} taxAmount`
    );
  }
});

/* ------------------------------------------------------------------------- */
/* 3 · State sync: the order lifecycle and the stock it moved                */
/* ------------------------------------------------------------------------- */

test("inventory · the seeded book reserves exactly what the open orders hold", () => {
  const store = createGovernanceStore();
  const demand = new Map();
  for (const order of store.orders.filter((item) => RESERVING_ORDER_STATUSES.includes(item.status))) {
    for (const item of order.items) {
      const key = `${item.id}|${order.branchId}`;
      demand.set(key, (demand.get(key) ?? 0) + item.quantity);
    }
  }
  for (const row of store.inventory) {
    assert.equal(
      row.reserved,
      demand.get(`${row.productId}|${row.branchId}`) ?? 0,
      `${row.id}: reserved must equal what the open order book holds at that boutique`
    );
    assert.ok(row.available >= 0, `${row.id}: free stock can never be negative`);
  }
});

test("inventory · dispatch retires the allocation, cancellation returns it", () => {
  const store = createGovernanceStore();
  const desk = { role: ROLES.SUPER_ADMIN, label: "Rajat Dehury — Admin" };
  const place = (key, quantity) =>
    placeCheckoutOrder(store, AADYA, {
      items: [{ id: "JWL-006", quantity }],
      addressId: AADYA_ADDR,
      deliveryMethod: "insured-courier",
      paymentMethod: "upi",
      paymentDetail: { upiId: "aadya@okicici" },
      idempotencyKey: key,
    }).order;
  const row = (branchId) =>
    store.inventory.find((line) => line.productId === "JWL-006" && line.branchId === branchId);

  const shippedOrder = place("P13-SHIP", 2);
  const allocated = { available: row(shippedOrder.branchId).available, reserved: row(shippedOrder.branchId).reserved };
  const ledgerLines = () =>
    store.inventoryMovements.filter((entry) => entry.stockId === row(shippedOrder.branchId).id).length;
  const ledgerAtAllocation = ledgerLines();
  assert.match(store.inventoryMovements[0].note, new RegExp(`Allocated to order ${shippedOrder.orderNumber}`));

  updateAdminOrderStatus(store, desk, shippedOrder.id, "Confirmed");
  assert.deepEqual(
    { available: row(shippedOrder.branchId).available, reserved: row(shippedOrder.branchId).reserved },
    allocated,
    "confirmation holds the reservation — it does not move stock"
  );
  updateAdminOrderStatus(store, desk, shippedOrder.id, "Processing");
  assert.deepEqual(
    { available: row(shippedOrder.branchId).available, reserved: row(shippedOrder.branchId).reserved },
    allocated,
    "processing changes no stock"
  );

  updateAdminOrderStatus(store, desk, shippedOrder.id, "Shipped");
  const afterDispatch = row(shippedOrder.branchId);
  assert.equal(afterDispatch.reserved, allocated.reserved - 2, "the pieces leave the vitrine");
  assert.equal(afterDispatch.available, allocated.available, "no new stock is taken at dispatch");
  assert.equal(ledgerLines(), ledgerAtAllocation, "the sale was already booked at allocation");
  assert.match(
    store.auditLog.find((entry) => entry.entityId === shippedOrder.id).detail,
    /handed over for delivery\./,
    "the trail carries the consequence, not just the status"
  );

  const onTheRoad = updateAdminOrderStatus(store, desk, shippedOrder.id, "Out for Delivery");
  assert.equal(onTheRoad.status, "Out for Delivery");
  assert.deepEqual(onTheRoad.actions, ["Delivered"], "delivery follows the road, not a skip");
  assert.equal(row(shippedOrder.branchId).reserved, afterDispatch.reserved, "out for delivery does not move stock again");
  assert.equal(row(shippedOrder.branchId).available, afterDispatch.available);
  assert.throws(
    () => updateAdminOrderStatus(store, desk, shippedOrder.id, "Cancelled"),
    /cannot move/,
    "a consignment already dispatched cannot be cancelled"
  );

  const cancelled = place("P13-CANCEL", 1);
  const before = { available: row(cancelled.branchId).available, reserved: row(cancelled.branchId).reserved };
  updateAdminOrderStatus(store, desk, cancelled.id, "Cancelled");
  const after = row(cancelled.branchId);
  assert.equal(after.reserved, before.reserved - 1, "the reservation is released");
  assert.equal(after.available, before.available + 1, "and the piece is buyable again");

  const [movement] = listInventoryMovements(
    store,
    { role: ROLES.SUPER_ADMIN },
    { stockId: after.id, limit: 1 }
  );
  assert.equal(movement.type, "receipt");
  assert.equal(movement.delta, 1);
  assert.match(movement.note, /Returned to free stock — order .+ cancelled\./);
  assert.equal(movement.by, desk.label, "the ledger names who moved it");
  assert.match(
    store.auditLog.find((entry) => entry.entityId === cancelled.id).detail,
    /returned to free stock\./
  );

  /* And the invariant survives: whatever the book now holds is what its open
     orders hold, including the order that was just cancelled. */
  const demand = new Map();
  for (const order of store.orders.filter((item) => RESERVING_ORDER_STATUSES.includes(item.status))) {
    for (const item of order.items) {
      const key = `${item.id}|${order.branchId}`;
      demand.set(key, (demand.get(key) ?? 0) + item.quantity);
    }
  }
  assert.equal(after.reserved, demand.get(`JWL-006|${after.branchId}`) ?? 0);
});

test("inventory · a cancellation can never invent stock the boutique does not hold", () => {
  const store = createGovernanceStore();
  const order = store.orders.find((item) => item.status === "Placed");
  const row = store.inventory.find(
    (line) => line.productId === order.items[0].id && line.branchId === order.branchId
  );
  /* A piece allocated by hand rather than by checkout: nothing on the row is
     reserved, so there is nothing to release and free stock must stay put. */
  row.reserved = 0;
  const availableBefore = row.available;
  const ledgerBefore = store.inventoryMovements.length;

  updateAdminOrderStatus(store, { role: ROLES.SUPER_ADMIN }, order.id, "Cancelled");

  assert.equal(row.reserved, 0, "a reservation that never existed stays non-existent");
  assert.equal(row.available, availableBefore, "free stock is not conjured from a cancellation");
  assert.equal(store.inventoryMovements.length, ledgerBefore, "and the ledger records nothing");
  assert.equal(order.status, "Cancelled", "the order itself still moves — the flow is the authority");
});

test("orders · the customer, the branch and the Admin console read one book", () => {
  const store = createGovernanceStore();
  const placed = placeCheckoutOrder(store, AADYA, {
    items: [{ id: "JWL-002", quantity: 1 }],
    addressId: AADYA_ADDR,
    deliveryMethod: "insured-courier",
    paymentMethod: "upi",
    paymentDetail: { upiId: "aadya@okicici" },
    idempotencyKey: "P13-READ",
  }).order;

  const admin = getAdminOrder(store, { role: ROLES.SUPER_ADMIN }, placed.id);
  assert.equal(admin.orderNumber, placed.orderNumber);
  assert.equal(admin.branchId, placed.branchId, "one fulfilment branch, everywhere");
  assert.equal(admin.items[0].name, "Eternal Halo Ring", "the console shows the canonical piece");
  assert.equal(
    getAdminOrder(store, { role: ROLES.SUPER_ADMIN }, admin.orderNumber).id,
    admin.id,
    "number and id open the same record"
  );
});

/* ------------------------------------------------------------------------- */
/* 4 · Authorization across the branch boundary                             */
/* ------------------------------------------------------------------------- */

test("branch drill-down · a global account may name a branch, a scoped account may not", () => {
  const store = createGovernanceStore();
  const employee = { id: "EMP-001", role: "employee", label: "Meera Das — Employee" };
  const admin = { id: "ADM-001", role: "admin", label: "Arpita Mohanty — Admin" };
  const superAdmin = { id: "SA-001", role: "super_admin", label: "Rajiv Meher — Super Admin" };
  const reads = [employeeReports, employeeBranchOperations, employeeOverview];

  /* No branch named: the branch view opens on its default, exactly as before
     this phase — the drill-down added a capability, never changed one. */
  for (const read of reads) {
    for (const actor of [employee, admin, superAdmin]) {
      assert.equal(read(store, actor, {}).branch.id, "BR-001");
    }
  }

  /* A named branch is honoured for the ONE global role — the Super Admin.
     Since Phase 14.3 an administrator is branch-scoped like an employee. */
  for (const read of reads) {
    assert.equal(read(store, superAdmin, { branchId: "BR-002" }).branch.id, "BR-002");
  }

  /* …and refused for the accounts that belong to one boutique. */
  for (const actor of [employee, admin]) {
    for (const query of [{ branchId: "BR-002" }, { branchId: "BR-999" }]) {
      assert.throws(
        () => employeeReports(store, actor, query),
        /only branch this account can work in/,
        "a URL parameter must never widen a scoped account's reach"
      );
    }
  }
  assert.throws(
    () => employeeReports(store, superAdmin, { branchId: "BR-999" }),
    /could not be found/,
    "a global account may name a branch, but not an imaginary one"
  );
});

test("branch drill-down · the page reads the shared contract, never its own", () => {
  const page = read("pages/super-admin/organization/BranchDrillDownPage.jsx");
  assert.match(page, /useParams\(\)/, "the branch comes from the route, not a local copy");
  assert.match(page, /useEmployeeBranchOperations\(\{ branchId \}\)/);
  assert.match(page, /useEmployeeReports\(\{ branchId \}\)/);
  assert.match(page, /useGovernanceBranches\(\)/, "the branch list stays canonical");
  assert.match(page, /href="\/super-admin\/branches"/, "the way back is on the page itself");
  assert.doesNotMatch(page, /from "\.\.\/\.\.\/\.\.\/mock\//, "a page may not import mock data");
  assert.doesNotMatch(page, /useEmployeeOrderStatus|updateEmployeeOrderStatus|adjustEmployeeInventory/,
    "oversight stays read-only: counter actions belong to the branch console");

  const list = read("pages/super-admin/organization/BranchesPage.jsx");
  assert.match(list, /to=\{`\/super-admin\/branches\/\$\{branch\.id\}`\}/, "the rows open the drill-down");
});

test("branch drill-down · the route mounts the console with its way back", () => {
  const store = createGovernanceStore();
  mockProvider._store = store;
  const superSession = authenticateStaff(store, {
    email: superAdminAccount.email,
    password: superAdminAccount.password,
  });
  /* A static render runs no effects, so this proves the wiring — the guard,
     the shell, the page's own frame — while the branch SELECTION itself is
     proved against the provider in the check above. */
  for (const branchId of ["BR-001", "BR-002", "BR-999"]) {
    const text = plainText(renderPath(`/super-admin/branches/${branchId}`, superSession));
    assert.match(text, /Organisation · Branch Oversight/, `${branchId} did not mount the drill-down`);
    assert.match(text, /All Branches/, "the return path is part of the screen");
    assert.match(text, /Super Admin \/ Branch Drill-down/, "the crumb follows the page");
  }
  delete mockProvider._store;
});

/* ------------------------------------------------------------------------- */
/* 5 · Ownership of client collections, and identity across the seams        */
/* ------------------------------------------------------------------------- */

test("ownership · collections are partitioned per owner and a guest's moves once", () => {
  clearStorage();
  assert.equal(ownerStorageKey("cart", GUEST_OWNER_ID), "swarnova.cart.guest");
  assert.equal(ownerStorageKey("wishlist", AADYA), "swarnova.wishlist.CUST-84920");
  assert.notEqual(ownerStorageKey("cart", "CUST-84920"), ownerStorageKey("cart", "CUST-77341"));

  /* A guest with a bag signs into an account with none: the bag follows them. */
  assert.deepEqual(
    resolveOwnerValue({
      previousOwnerId: GUEST_OWNER_ID,
      previousValue: ["JWL-001"],
      storedValue: [],
      isEmpty: (value) => !value?.length,
    }),
    { value: ["JWL-001"], moved: true }
  );

  /* A member who already owns a collection keeps theirs: nothing merges. */
  assert.deepEqual(
    resolveOwnerValue({
      previousOwnerId: GUEST_OWNER_ID,
      previousValue: ["JWL-001"],
      storedValue: ["JWL-009"],
      isEmpty: (value) => !value?.length,
    }),
    { value: ["JWL-009"], moved: false }
  );

  /* Signing out hands nothing back — the guest partition starts empty, and an
     account switch never moves a member's collection either. */
  for (const previousOwnerId of [AADYA, "CUST-77341"]) {
    assert.deepEqual(
      resolveOwnerValue({
        previousOwnerId,
        previousValue: ["JWL-001"],
        storedValue: [],
        isEmpty: (value) => !value?.length,
      }),
      { value: [], moved: false }
    );
  }
  clearStorage();
});

test("identity · a registered customer is a member everywhere the platform looks", () => {
  const store = createGovernanceStore();
  const registered = registerCustomer(store, {
    name: "Ishita Nanda",
    email: "ishita.nanda@swarnova.in",
    phone: "+91 90000 00011",
    password: "Swarnova@2026",
  });

  assert.equal(registered.customer.password, undefined, "the credential never leaves the store");
  assert.equal(
    listAdminCustomers(store, { role: ROLES.SUPER_ADMIN }, { search: "ishita" }).length,
    1,
    "the Admin book sees them at once"
  );

  const session = authenticateCustomer(store, {
    email: "ishita.nanda@swarnova.in",
    password: "Swarnova@2026",
  });
  assert.equal(session.customer.id, registered.customer.id);
  assert.equal(session.customer.password, undefined);

  /* The seeded demo credential still works, and still never emits a password. */
  const demo = authenticateCustomer(store, {
    email: "aadya.sharma@swarnova.in",
    password: CUSTOMER_DEMO_PASSWORD,
  });
  assert.equal(demo.customer.id, AADYA);
  assert.doesNotMatch(JSON.stringify(demo), /password/);
});

/* ------------------------------------------------------------------------- */
/* 6 · Layering, the stack, links and the primitives the app already owns    */
/* ------------------------------------------------------------------------- */

test("layering · no UI surface reaches past the services into mock data", () => {
  const offenders = [];
  for (const dir of ["pages", "components", "hooks", "layouts", "state", "features"]) {
    for (const file of sourceFiles(join(SRC_DIR, dir))) {
      if (/from "[^"]*\/mock\/(data|assets)\//.test(readFileSync(file, "utf8"))) {
        offenders.push(file.replace(`${SRC_DIR}/`, ""));
      }
    }
  }
  assert.deepEqual(offenders, [], "UI must travel hooks → services → the data provider");
});

test("stack · the project remains JavaScript + JSX, with no TypeScript seams", () => {
  const tsFiles = sourceFiles(FRONTEND_DIR, ["node_modules", "dist"]).filter((file) =>
    /\.(ts|tsx|mts|cts)$/.test(file)
  );
  assert.deepEqual(tsFiles, [], "no TypeScript files may exist");
  assert.equal(existsSync(join(FRONTEND_DIR, "tsconfig.json")), false, "no TypeScript config");

  const pkg = JSON.parse(readFileSync(join(FRONTEND_DIR, "package.json"), "utf8"));
  const dependencies = { ...pkg.dependencies, ...pkg.devDependencies };
  for (const name of Object.keys(dependencies)) {
    assert.equal(
      /^typescript|(^|\/)ts-|tsx$/.test(name),
      false,
      `${name} must not enter the dependency set`
    );
  }
});

test("primitives · the account overlays use the shared Dialog", () => {
  for (const page of [
    "pages/customer/account/SavedDesignsPage.jsx",
    "pages/customer/account/SavedTryOnsPage.jsx",
  ]) {
    const text = read(page);
    assert.match(text, /import Dialog from "\.\.\/\.\.\/\.\.\/components\/ui\/Dialog\.jsx";/, page);
    assert.doesNotMatch(text, /role="dialog"/, `${page} must not hand-roll an overlay`);
    assert.doesNotMatch(text, /bg-black\//, `${page} must not hand-roll a backdrop`);
    assert.match(text, /<Dialog\b[\s\S]*open=\{Boolean\(/, `${page} opens the shared primitive`);
  }
});

test("links · every content href resolves to a real route or a documented gap", () => {
  const { homepage } = { homepage: createGovernanceStore().homepage };
  const anchors = new Set(homepage.sections.map((section) => section.id).concat("top"));
  const matchers = allRoutes.map((entry) => ({
    test: new RegExp(
      `^${entry.path
        .split("/")
        .map((part) =>
          part.startsWith(":") ? "[^/?#]+" : part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        )
        .join("/")}$`
    ),
  }));
  const routed = (pathname) => matchers.some((entry) => entry.test.test(pathname));

  /* Phase 14.1 approved these as house pages. A new unrouted link must not
     join quietly — there is no remaining content-gap exception. */
  const PENDING_PAGES = new Set();

  const problems = [];
  for (const file of sourceFiles(join(SRC_DIR, "mock/data"))) {
    const rel = file.replace(`${SRC_DIR}/`, "");
    for (const match of readFileSync(file, "utf8").matchAll(/href:\s*"([^"]+)"/g)) {
      const href = match[1];
      if (!href.startsWith("/")) continue;
      const [pathPart = "", hash = ""] = href.slice(1).split("#");
      const pathname = `/${pathPart.split("?")[0]}` || "/";
      if (!routed(pathname) && !PENDING_PAGES.has(pathname)) problems.push(`${rel}: ${href}`);
      if (hash && pathname === "/" && !anchors.has(hash)) problems.push(`${rel}: #${hash} has no section`);
    }
  }
  assert.deepEqual(problems, [], `unrouted content links:\n${problems.join("\n")}`);

  /* A bare anchor resolves against whatever page the visitor is reading, so a
     homepage section must be named with its path from anywhere in the app. */
  const site = read("mock/data/site/index.js");
  for (const anchor of ["#top", "#collections", "#our-story", "#journal", "#stores", "#gold-rate"]) {
    assert.equal(
      site.includes(`href: "${anchor}"`),
      false,
      `"${anchor}" must be written as "/${anchor}" so it resolves from any page`
    );
  }
});

/* ------------------------------------------------------------------------- */
/* helpers                                                                    */
/* ------------------------------------------------------------------------- */

function sourceFiles(dir, skip = []) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (skip.includes(name) || name.startsWith(".")) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...sourceFiles(full, skip));
    else if (/\.jsx?$/.test(name) && !full.includes("__tests__")) out.push(full);
  }
  return out;
}
