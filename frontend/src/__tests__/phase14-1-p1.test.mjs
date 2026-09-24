/**
 * PHASE 14.1 — P1 REGRESSION
 * -----------------------------------------------------------------------------
 * The four P1 decisions, proved on the contracts the product actually uses:
 * one order status, one operational book, one feature switch, and footer
 * destinations that resolve. No second store, no candidate feature.
 *
 * Run from `frontend/`:
 *   node --import ./src/__tests__/support/register-assets.mjs --test src/__tests__/phase14-1-p1.test.mjs
 */
import "./support/browser-globals.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { routeTree } from "../app/router.jsx";
import site from "../mock/data/site/index.js";
import homepage from "../mock/data/homepage/index.js";
import { platformAdmins, platformEmployees, superAdminAccount } from "../mock/data/index.js";
import { ROLES } from "../features/authentication/roles.js";
import {
  customerReceiptTitle,
  orderStatusMeta,
} from "../features/orders/orderLifecycle.js";
import {
  featureEntry,
  filterFeatureLinks,
  isFeatureOpen,
} from "../features/storefront/availability.js";
import { getCustomerServicePage } from "../features/storefront/customerService.js";
import { loadOwnerState, ownerStorageKey, saveOwnerState } from "../state/ownerScopedStorage.js";
import { clearStorage } from "./support/browser-globals.mjs";
import mockProvider from "../services/providers/mock/mockProvider.js";
import {
  authenticateStaff,
  createGovernanceStore,
  getAdminOrder,
  getCustomerOrder,
  getEmployeeOrder,
  listAdminCustomers,
  listAdminInventory,
  listAdminOrders,
  listCustomerOrders,
  listEmployeeCustomers,
  listEmployeeInventory,
  listEmployeeOrders,
  placeCheckoutOrder,
  updateAdminOrderStatus,
  updatePlatformSettings,
} from "../services/providers/mock/governanceStore.js";

const SRC = join(new URL(".", import.meta.url).pathname, "..");
const read = (relative) => readFileSync(join(SRC, relative), "utf8");
const AADYA = "CUST-84920";
const PASSWORD = "Swarnova@123";

function freshStore() {
  const store = createGovernanceStore();
  mockProvider._store = store;
  return store;
}

function actorFrom(session, roleLabel) {
  return {
    id: session.user.id,
    role: session.role,
    label: `${session.user.name} — ${roleLabel}`,
  };
}

function placeOne(store) {
  return placeCheckoutOrder(store, AADYA, {
    items: [{ id: "JWL-001", quantity: 1 }],
    addressId: "ADDR-001",
    deliveryMethod: "insured-courier",
    paymentMethod: "upi",
    paymentDetail: { upiId: "aadya@okicici" },
    idempotencyKey: `CHK-14-1-${store.counters.order}`,
  });
}

function walkRoutes(routes, parent = "", out = []) {
  for (const route of routes) {
    const full =
      (`${parent}/${route.path ?? ""}`.replace(/\/+/g, "/") || "/").replace(/\/+$/, "") || "/";
    if (route.path !== undefined || route.index) out.push({ path: full, route });
    if (route.children) walkRoutes(route.children, full, out);
  }
  return out;
}

const routes = walkRoutes(routeTree);
const routed = (pathname) =>
  routes.some((entry) => {
    const pattern = entry.path
      .split("/")
      .map((part) => (part.startsWith(":") ? "[^/?#]+" : part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
      .join("/");
    return new RegExp(`^${pattern}$`).test(pathname);
  });

/* -------------------------------------------------------------------------- */
/* Order lifecycle                                                             */
/* -------------------------------------------------------------------------- */

test("order · a new checkout begins as Placed and every audience reads that status", () => {
  const store = freshStore();
  const placed = placeOne(store);
  const order = placed.order;

  assert.equal(order.status, "Placed");
  assert.equal(customerReceiptTitle(order.status), "Thank you — your order is placed");
  assert.equal(orderStatusMeta(order.status).label, "Placed");
  assert.notEqual(orderStatusMeta(order.status).label, "Confirmed");

  const customerList = listCustomerOrders(store, AADYA);
  const customerDetail = getCustomerOrder(store, AADYA, order.id);
  assert.equal(customerList.find((item) => item.id === order.id).status, "Placed");
  assert.equal(customerDetail.status, "Placed");
  assert.equal(orderStatusMeta(customerList[0].status).label, orderStatusMeta(customerDetail.status).label);

  const globalActor = { role: ROLES.SUPER_ADMIN };
  const adminList = listAdminOrders(store, globalActor, { search: order.orderNumber });
  const adminDetail = getAdminOrder(store, globalActor, order.id);
  assert.equal(adminList[0].status, "Placed");
  assert.equal(adminDetail.status, "Placed");
  assert.equal(orderStatusMeta(adminDetail.status).label, "Placed");

  const superAdmin = listAdminOrders(store, globalActor, { search: order.orderNumber });
  assert.equal(superAdmin[0].status, adminDetail.status, "Super Admin reads the same book, not a copy");
  assert.equal(orderStatusMeta(superAdmin[0].status).label, "Placed");

  const employee = store.employees.find(
    (item) => item.branchId === order.branchId && item.status === "active"
  );
  assert.ok(employee, "the fulfilling boutique has an employee who can see the order");
  const employeeView = listEmployeeOrders(store, {
    id: employee.id,
    role: ROLES.EMPLOYEE,
    label: `${employee.name} — Employee`,
  });
  const employeeOrder = employeeView.find((item) => item.id === order.id);
  assert.ok(employeeOrder, "the fulfilling employee sees the new order");
  assert.equal(employeeOrder.status, "Placed");
  assert.equal(orderStatusMeta(employeeOrder.status).label, "Placed");

  const other = store.employees.find(
    (item) => item.branchId !== order.branchId && item.status === "active"
  );
  if (other) {
    const otherView = listEmployeeOrders(store, {
      id: other.id,
      role: ROLES.EMPLOYEE,
      label: `${other.name} — Employee`,
    });
    assert.equal(otherView.some((item) => item.id === order.id), false);
  }
});

test("order · customer, admin and employee screens display the shared Placed label", () => {
  const pages = {
    "pages/customer/account/OrdersPage.jsx": /orderStatusMeta\(order\.status\)\.label/,
    "pages/customer/account/OrderDetailPage.jsx": /orderStatusMeta\(order\.status\)/,
    "pages/customer/checkout/OrderConfirmationPage.jsx": /customerReceiptTitle\(order\.status\)/,
    "pages/admin/orders/AdminOrdersPage.jsx": /orderStatusMeta\(order\.status\)/,
    "pages/admin/orders/AdminOrderDetailPage.jsx": /orderStatusMeta\(order\.status\)/,
    "pages/employee/orders/EmployeeOrdersPage.jsx": /orderStatusMeta\(order\.status\)/,
    "pages/employee/orders/EmployeeOrderDetailPage.jsx": /orderStatusMeta\(order\.status\)/,
  };
  for (const [file, pattern] of Object.entries(pages)) {
    const source = read(file);
    assert.match(source, pattern, `${file} must display the shared status`);
    assert.doesNotMatch(
      source,
      /label:\s*"Confirmed"/,
      `${file} must not hardcode Confirmed as the receipt status`
    );
  }
  assert.match(read("features/admin/operations.js"), /from \"\.\.\/orders\/orderLifecycle\.js\"/);
  assert.match(read("app/router.jsx"), /OperationalRoute page=\{AdminOrdersPage\}/);
  assert.match(read("app/router.jsx"), /OperationalRoute page=\{AdminOrderDetailPage\}/);
});

test("order · cancellation before dispatch still stands; return and refund are not rewritten", () => {
  const store = freshStore();
  const { order } = placeOne(store);

  const desk = { role: ROLES.SUPER_ADMIN, label: "Phase 14.1" };
  const cancelled = updateAdminOrderStatus(store, desk, order.id, "Cancelled");
  assert.equal(cancelled.status, "Cancelled");
  assert.equal(cancelled.paymentStatus, "refunded");
  assert.equal(orderStatusMeta(cancelled.status).label, "Cancelled");
  assert.notEqual(cancelled.status, "Refunded");
  assert.throws(() => updateAdminOrderStatus(store, desk, order.id, "Refunded"));

  const shipped = store.orders.find((item) => item.status === "Shipped");
  assert.ok(shipped, "the book still has a dispatched order");
  assert.throws(() => updateAdminOrderStatus(store, desk, shipped.id, "Cancelled"));

  const remembered = store.orders.find((item) => item.customerId && item.id !== order.id);
  remembered.status = "Returned";
  assert.equal(getCustomerOrder(store, remembered.customerId, remembered.id).status, "Returned");
  assert.equal(getAdminOrder(store, desk, remembered.id).status, "Returned");
  assert.equal(orderStatusMeta("Returned").label, "Returned");
  assert.equal(orderStatusMeta("Refunded").label, "Refunded");
  assert.notEqual(orderStatusMeta("Returned").label, "Placed");
  assert.notEqual(orderStatusMeta("Refunded").label, "Placed");
});

/* -------------------------------------------------------------------------- */
/* Super Admin authority                                                       */
/* -------------------------------------------------------------------------- */

test("super admin · global orders, customers and inventory, then a branch, then back", () => {
  const store = freshStore();
  const globalActor = { role: ROLES.SUPER_ADMIN };
  const globalOrders = listAdminOrders(store, globalActor);
  const globalCustomers = listAdminCustomers(store, globalActor);
  const globalInventory = listAdminInventory(store, globalActor);
  assert.ok(globalOrders.length > 1);
  assert.ok(new Set(globalOrders.map((order) => order.branchId)).size > 1, "global orders span branches");
  assert.ok(globalCustomers.length > 1);
  assert.ok(new Set(globalInventory.map((row) => row.branchId)).size > 1, "global inventory spans branches");

  const branchOrders = listAdminOrders(store, globalActor, { branchId: "BR-001" });
  const branchCustomers = listAdminCustomers(store, globalActor, { branchId: "BR-001" });
  const branchInventory = listAdminInventory(store, globalActor, { branchId: "BR-001" });
  assert.ok(branchOrders.length > 0);
  assert.ok(branchOrders.length < globalOrders.length);
  assert.ok(branchOrders.every((order) => order.branchId === "BR-001"));
  assert.ok(branchCustomers.length > 0);
  assert.ok(branchCustomers.length <= globalCustomers.length);
  assert.ok(branchInventory.every((row) => row.branchId === "BR-001"));
  assert.ok(branchInventory.length < globalInventory.length);

  assert.equal(listAdminOrders(store, globalActor).length, globalOrders.length, "omitting the branch returns the organization");
  assert.equal(listAdminCustomers(store, globalActor).length, globalCustomers.length);
  assert.equal(listAdminInventory(store, globalActor).length, globalInventory.length);

  const router = read("app/router.jsx");
  assert.match(router, /path: "orders"/);
  assert.match(router, /path: "customers"/);
  assert.match(router, /path: "inventory"/);
  assert.match(router, /path: "branches\/:branchId"/);
  assert.match(read("pages/super-admin/organization/BranchDrillDownPage.jsx"), /\/super-admin\/orders\?branch=/);
  assert.doesNotMatch(router, /SuperAdminOrdersPage/);
  assert.equal(read("services/providers/mock/governanceStore.js").includes("export function createGovernanceStore"), true);
});

test("super admin · employee and admin restrictions are unchanged", () => {
  const store = freshStore();
  const employeeSession = authenticateStaff(store, {
    email: platformEmployees[0].email,
    password: PASSWORD,
  });
  const employee = actorFrom(employeeSession, "Employee");
  assert.equal(employeeSession.role, ROLES.EMPLOYEE);
  assert.throws(() => listEmployeeOrders(store, employee, { branchId: "BR-002" }), /only branch/i);
  assert.throws(() => listEmployeeCustomers(store, employee, { branchId: "BR-002" }), /only branch/i);
  assert.throws(() => listEmployeeInventory(store, employee, { branchId: "BR-002" }), /only branch/i);
  assert.throws(() => getEmployeeOrder(store, employee, "ORD-2026-9389"), /another boutique/i);

  const adminSession = authenticateStaff(store, {
    email: platformAdmins[0].email,
    password: PASSWORD,
  });
  assert.equal(adminSession.role, ROLES.ADMIN);
  const branchAdmin = { id: adminSession.user.id, role: adminSession.role };
  const adminOrders = listAdminOrders(store, branchAdmin);
  assert.ok(adminOrders.length > 0, "the branch Admin reads their own branch's book");
  assert.ok(adminOrders.every((order) => order.branchId === adminSession.user.branchId));

  const superSession = authenticateStaff(store, {
    email: superAdminAccount.email,
    password: superAdminAccount.password,
  });
  assert.equal(superSession.role, ROLES.SUPER_ADMIN);
  assert.deepEqual(superSession.permissions, ["*"]);
  const globalActor = { role: ROLES.SUPER_ADMIN };
  const globalOrders = listAdminOrders(store, globalActor);
  assert.ok(
    globalOrders.length >= adminOrders.length,
    "the Super Admin keeps the organization-wide book"
  );
});

/* -------------------------------------------------------------------------- */
/* AI Studio and Virtual Try-On                                                */
/* -------------------------------------------------------------------------- */

test("features · an enabled switch opens the provider, a disabled switch blocks use and the URL", async () => {
  const store = freshStore();

  let reading = await mockProvider.getStorefrontFeatures();
  assert.equal(reading.aiStudio, true);
  assert.equal(reading.virtualTryOn, true);
  assert.equal(featureEntry({ status: "success", ...reading }, "aiStudio"), "open");
  assert.equal(featureEntry({ status: "success", ...reading }, "virtualTryOn"), "open");
  assert.equal(featureEntry({ status: "loading", aiStudio: true }, "aiStudio"), "pending");

  const concept = await mockProvider.generateAiDesign({ prompt: "a gold necklace for a wedding" });
  assert.ok(concept?.id, "an enabled studio can still render a concept");
  await assert.rejects(
    () => mockProvider.createTryOn({ sourceType: "product", sourceId: "JWL-006" }),
    (error) => error.code !== "FEATURE_UNAVAILABLE"
  );

  updatePlatformSettings(store, {
    features: { aiStudio: { enabled: false }, virtualTryOn: { enabled: false } },
  });
  reading = await mockProvider.getStorefrontFeatures();
  assert.equal(reading.aiStudio, false);
  assert.equal(reading.virtualTryOn, false);
  assert.equal(featureEntry({ status: "success", ...reading }, "aiStudio"), "closed");
  assert.equal(featureEntry({ status: "success", ...reading }, "virtualTryOn"), "closed");
  assert.equal(isFeatureOpen(reading, "aiStudio"), false);
  assert.equal(isFeatureOpen(reading, "virtualTryOn"), false);

  await assert.rejects(
    () => mockProvider.generateAiDesign({ prompt: "a gold necklace" }),
    (error) => error.code === "FEATURE_UNAVAILABLE"
  );
  await assert.rejects(
    () => mockProvider.createTryOn({ sourceType: "product", sourceId: "JWL-006", photo: { image: { src: "x" } } }),
    (error) => error.code === "FEATURE_UNAVAILABLE"
  );

  const siteView = await mockProvider.getSite();
  for (const column of [siteView.navigation, siteView.quickLinks, siteView.experience]) {
    assert.equal(column.some((link) => link.href === "/ai-studio" || link.href === "/virtual-try-on"), false);
  }
  const home = await mockProvider.getHomepage();
  assert.equal(home.sections.some((section) => section.type === "ai_studio"), false);
  assert.equal(home.sections.some((section) => section.type === "virtual_tryon"), false);
  const hero = home.sections.find((section) => section.type === "hero");
  assert.notEqual(hero?.content?.secondaryCta?.href, "/ai-studio");

  const guard = read("features/storefront/RequireStorefrontFeature.jsx");
  const router = read("app/router.jsx");
  assert.match(guard, /featureEntry\(/);
  assert.match(guard, /FeatureUnavailable/);
  assert.match(guard, /entry === "closed"/);
  assert.match(guard, /entry !== "open"/);
  assert.match(router, /RequireStorefrontFeature feature="aiStudio"/);
  assert.match(router, /RequireStorefrontFeature feature="virtualTryOn"/);

  updatePlatformSettings(store, {
    features: { aiStudio: { enabled: true }, virtualTryOn: { enabled: true } },
  });
  reading = await mockProvider.getStorefrontFeatures();
  assert.equal(featureEntry({ status: "success", ...reading }, "aiStudio"), "open");
  assert.equal(featureEntry({ status: "success", ...reading }, "virtualTryOn"), "open");
  const restored = await mockProvider.generateAiDesign({ prompt: "a gold necklace for a wedding" });
  assert.ok(restored?.id, "re-enabling restores the same provider, not a second flag");
});

test("features · contextual doors use the shared reading, and saved fittings are not deleted", () => {
  clearStorage();
  const store = freshStore();
  const fitting = [{ saveId: "TRY-KEEP", result: { id: "TRY-1", jewellery: "Necklace" } }];
  const designs = [{ concept: { id: "AID-KEEP", title: "Kept" } }];
  saveOwnerState("saved-try-ons", AADYA, fitting);
  saveOwnerState("saved-designs", AADYA, designs);

  updatePlatformSettings(store, {
    features: { aiStudio: { enabled: false }, virtualTryOn: { enabled: false } },
  });

  assert.deepEqual(loadOwnerState("saved-try-ons", AADYA, []), fitting);
  assert.deepEqual(loadOwnerState("saved-designs", AADYA, []), designs);
  assert.equal(localStorage.getItem(ownerStorageKey("saved-try-ons", AADYA))?.includes("TRY-KEEP"), true);

  const closed = { status: "success", aiStudio: false, virtualTryOn: false };
  assert.equal(isFeatureOpen(closed, "virtualTryOn"), false);
  assert.deepEqual(
    filterFeatureLinks(
      [
        { label: "AI Studio", href: "/ai-studio" },
        { label: "Stores", href: "/#stores" },
      ],
      closed
    ).map((link) => link.href),
    ["/#stores"]
  );

  const doors = {
    "components/product/ProductSummary.jsx": /isFeatureOpen\(features, "virtualTryOn"\)/,
    "components/cards/ProductCard.jsx": /isFeatureOpen\(availability, "virtualTryOn"\)/,
    "pages/customer/ai-studio/AiStudioPage.jsx": /isFeatureOpen\(availability, "virtualTryOn"\)/,
    "pages/customer/account/AccountOverviewPage.jsx": /isFeatureOpen\(availability, "virtualTryOn"\)/,
    "pages/customer/account/SavedTryOnsPage.jsx": /tryOnOpen \? <Button href="\/virtual-try-on">/,
    "pages/customer/account/SavedDesignsPage.jsx": /isFeatureOpen\(availability, "aiStudio"\)/,
    "components/layout/Footer.jsx": /links=\{experience\}/,
    "components/layout/Header.jsx": /isFeatureRouteOpen\(item\.href, availability\)/,
  };
  for (const [file, pattern] of Object.entries(doors)) {
    assert.match(read(file), pattern, `${file} must respect the shared feature reading`);
  }

  updatePlatformSettings(store, {
    features: { aiStudio: { enabled: true }, virtualTryOn: { enabled: true } },
  });
  assert.deepEqual(loadOwnerState("saved-try-ons", AADYA, []), fitting);
  assert.deepEqual(loadOwnerState("saved-designs", AADYA, []), designs);
  clearStorage();
});

/* -------------------------------------------------------------------------- */
/* Customer links                                                              */
/* -------------------------------------------------------------------------- */

test("links · every footer and customer-service destination still resolves", () => {
  const anchors = new Set(homepage.sections.map((section) => section.id).concat("top"));
  const columns = [...site.quickLinks, ...site.customerService, ...site.experience, ...site.legal];

  for (const link of columns) {
    assert.equal(link.href.startsWith("/"), true, `${link.label} must be an in-app destination`);
    const [pathPart = "", hash = ""] = link.href.slice(1).split("#");
    const pathname = `/${pathPart.split("?")[0]}` || "/";
    assert.equal(routed(pathname), true, `${link.label} (${link.href}) has no route`);
    if (hash) assert.equal(anchors.has(hash), true, `${link.label} points at a missing #${hash}`);
  }

  const serviceRoutes = {
    contact: "/contact",
    faq: "/faq",
    shipping: "/shipping",
    returns: "/returns",
    warranty: "/warranty",
    care: "/care-guide",
    privacy: "/privacy",
    terms: "/terms",
  };
  for (const [key, path] of Object.entries(serviceRoutes)) {
    const page = getCustomerServicePage(key);
    assert.ok(page?.title, `${path} has no house page`);
    assert.ok(page.sections?.length > 0, `${path} is empty`);
    assert.equal(routed(path), true, `${path} is not mounted`);
    const blob = JSON.stringify(page);
    assert.equal(/coming soon/i.test(blob), false, `${path} must not be a placeholder`);
  }

  assert.equal(site.customerService.some((link) => link.href === "/contact"), true);
  assert.equal(site.legal.some((link) => link.href === "/privacy"), true);
  assert.equal(site.legal.some((link) => link.href === "/terms"), true);
  assert.equal(site.quickLinks.some((link) => link.href === "/#our-story"), true);
  assert.equal(site.quickLinks.some((link) => link.href === "/#stores"), true);
});
