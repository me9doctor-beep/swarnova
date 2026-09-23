/**
 * PHASE 12 — CHECKOUT + COMMERCE COMPLETION (§47 checks)
 * -----------------------------------------------------------------------------
 * The commerce journey, driven exactly the way the storefront drives it:
 * the page maps its bag into a domain payload through `checkoutService`,
 * the mock provider enforces the whole business boundary store-side, and
 * ONE canonical order enters the ONE order book the Admin console, the
 * branch consoles, the analytics and the customer account all already read.
 *
 * Nothing here trusts the client: every check that involves ownership,
 * methods, stock or payment crosses the governance store — the seam the
 * future backend occupies one-to-one.
 *
 * Run from `frontend/`:
 *
 *   npm test
 *   node --import ./src/__tests__/support/register-assets.mjs --test src/__tests__/
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";

import mockProvider from "../services/providers/mock/mockProvider.js";
import {
  CHECKOUT_CODES,
  addCustomerAddress,
  adminOverview,
  adminReports,
  authenticateCustomer,
  authenticateStaff,
  createGovernanceStore,
  getCheckoutSummary,
  getCustomerOrder,
  getEmployeeOrder,
  listAdminOrders,
  listAuditLogs,
  listCustomerOrders,
  listEmployeeOrders,
  listInventoryMovements,
  placeCheckoutOrder,
  platformOverview,
  registerCustomer,
} from "../services/providers/mock/governanceStore.js";
import { checkoutService } from "../services/checkoutService.js";
import {
  buildCheckoutPayload,
  checkoutItemsSignature,
  toCheckoutItems,
} from "../services/checkoutService.js";
import { calculateTotals, GST_RATE } from "../services/pricingService.js";
import { CUSTOMER_DEMO_PASSWORD } from "../mock/data/customer/index.js";
import { deliveryMethods, paymentMethods } from "../mock/data/checkout/index.js";
import { ROLES } from "../features/authentication/roles.js";
import { translateCheckoutError } from "../features/checkout/checkoutErrors.js";
import AppProviders from "../app/providers.jsx";
import CustomerAuthProvider from "../features/customer-auth/CustomerAuthProvider.jsx";
import RequireCustomer from "../features/customer-auth/RequireCustomer.jsx";
import CheckoutPage from "../pages/customer/checkout/CheckoutPage.jsx";

const PASSWORD = CUSTOMER_DEMO_PASSWORD;
const AADYA = "CUST-84920";
const RITIKA = "CUST-77341";
const AADYA_ADDR = "ADDR-001"; // Aadya's default (New Delhi)
const BBSR = "BR-001";
const CTC = "BR-002";

const freshStore = () => createGovernanceStore();

/** Reset the shared provider singleton so provider-level tests stay isolated. */
function freshProvider() {
  mockProvider._store = null;
  mockProvider._customerSessionId = undefined;
  return mockProvider;
}

const rejectsWithCode = (fn, code) =>
  assert.rejects(
    (async () => fn())(),
    (error) => {
      assert.equal(error.code, code);
      return true;
    }
  );

const throwsWithCode = (fn, code) =>
  assert.throws(fn, (error) => {
    assert.equal(error.code, code);
    return true;
  });

/** A one-line bag of a published piece, quoted and placed the way the UI does. */
const bag = (...items) => items.map(([id, quantity]) => ({ id, quantity }));

const VALID_CHECKOUT = {
  items: bag(["JWL-001", 1]),
  addressId: AADYA_ADDR,
  deliveryMethod: "insured-courier",
  paymentMethod: "upi",
  paymentDetail: { upiId: "aadya@okicici" },
  idempotencyKey: "CHK-TEST-VALID",
};

function placeValid(store, overrides = {}) {
  return placeCheckoutOrder(store, AADYA, { ...VALID_CHECKOUT, ...overrides });
}

function renderCheckoutPage(path, session) {
  return renderToStaticMarkup(
    h(
      AppProviders,
      null,
      h(
        CustomerAuthProvider,
        { initialSession: session },
        h(MemoryRouter, { initialEntries: [path] }, h(RequireCustomer, null, h(CheckoutPage)))
      )
    )
  );
}

const MEMBER = {
  customer: {
    id: "CUST-84920",
    name: "Aadya Sharma",
    email: "aadya.sharma@swarnova.in",
    phone: "+91 98765 43210",
    tier: "Swarnova Privé",
    memberSince: "October 2024",
    status: "active",
  },
};

/* ------------------------------------------------------------------------- */
/* The pricing domain — the ONE calculation                                   */
/* ------------------------------------------------------------------------- */

test("pricing · the ONE totals calculation: subtotal + delivery − discount = grand total, GST extracted inclusively", () => {
  const totals = calculateTotals({
    items: [
      { unitPrice: 72400, quantity: 1 },
      { unitPrice: 56800, quantity: 2 },
    ],
    deliveryCharge: 0,
  });

  assert.equal(totals.subtotal, 186000);
  assert.equal(totals.deliveryCharge, 0);
  assert.equal(totals.discount, 0, "the source of truth grants no discounts — the boundary stays 0");
  assert.equal(totals.grandTotal, 186000);
  assert.equal(totals.taxMode, "inclusive");
  assert.equal(totals.taxRate, GST_RATE, 0.03);
  /* GST is carried INSIDE the prices — backed out of the total, never added. */
  assert.equal(totals.taxAmount, Math.round(186000 - 186000 / 1.03));
  assert.equal(totals.taxAmount, 5417);

  /* A paid delivery charge would flow through the same single sum. */
  const withDelivery = calculateTotals({ items: [{ unitPrice: 10000, quantity: 1 }], deliveryCharge: 250, discount: 100 });
  assert.equal(withDelivery.grandTotal, 10150);
});

/* ------------------------------------------------------------------------- */
/* 1–3 · the session, the bag and the boundary                                */
/* ------------------------------------------------------------------------- */

test("1 · a guest cannot checkout — no session, no summary and no order", async () => {
  const store = freshStore();

  throwsWithCode(() => getCheckoutSummary(store, null, VALID_CHECKOUT.items), CHECKOUT_CODES.SESSION_EXPIRED);
  throwsWithCode(() => placeCheckoutOrder(store, null, VALID_CHECKOUT), CHECKOUT_CODES.SESSION_EXPIRED);
  throwsWithCode(
    () => placeCheckoutOrder(store, "CUST-99999", VALID_CHECKOUT),
    CHECKOUT_CODES.SESSION_EXPIRED,
    "a fabricated customer id is simply no session"
  );

  const provider = freshProvider();
  await rejectsWithCode(() => provider.placeOrder(VALID_CHECKOUT), CHECKOUT_CODES.SESSION_EXPIRED);
  await rejectsWithCode(() => provider.getCheckoutSummary(VALID_CHECKOUT.items), CHECKOUT_CODES.SESSION_EXPIRED);
});

test("2 · an authenticated customer can checkout end-to-end", async () => {
  const provider = freshProvider();
  await provider.authenticateCustomer({ identifier: "aadya.sharma@swarnova.in", password: PASSWORD });

  const response = await provider.placeOrder(VALID_CHECKOUT);
  assert.ok(response.order);
  assert.ok(response.payment);
  assert.equal(response.order.customerId, AADYA);
  assert.equal(response.order.status, "Placed");
  assert.equal(response.order.paymentStatus, "paid");

  /* The same journey through the page's service boundary. */
  const provider2 = freshProvider();
  await provider2.authenticateCustomer({ identifier: "+91 98765 43210", password: PASSWORD });
  const payload = buildCheckoutPayload({
    checkoutId: "CHK-TEST-SVC",
    items: [{ id: "JWL-001", product: { id: "JWL-001" }, quantity: 1, product_snapshot: "never sent" }],
    addressId: AADYA_ADDR,
    deliveryMethod: "insured-courier",
    paymentMethod: "netbanking",
    paymentDetail: null,
  });
  assert.deepEqual(Object.keys(payload).sort(), [
    "addressId",
    "deliveryMethod",
    "idempotencyKey",
    "items",
    "paymentDetail",
    "paymentMethod",
  ]);
  assert.equal(payload.items[0].id, "JWL-001");
  assert.equal(payload.items[0].quantity, 1);
  assert.ok(!("product_snapshot" in payload.items[0]), "no React/UI state crosses the boundary");

  const viaService = await checkoutService.placeOrder(provider2, payload);
  assert.equal(viaService.order.paymentMethod, "Prepaid · Net Banking");
});

test("3 · an empty cart cannot checkout", () => {
  const store = freshStore();

  throwsWithCode(() => getCheckoutSummary(store, AADYA, []), CHECKOUT_CODES.CART_EMPTY);
  throwsWithCode(() => placeCheckoutOrder(store, AADYA, { ...VALID_CHECKOUT, items: [] }), CHECKOUT_CODES.CART_EMPTY);
  throwsWithCode(
    () => placeCheckoutOrder(store, AADYA, { ...VALID_CHECKOUT, items: [{ id: "JWL-999", quantity: 1 }] }),
    CHECKOUT_CODES.PRODUCT_UNAVAILABLE,
    "a bag of only unknown pieces is no bag at all"
  );
});

/* ------------------------------------------------------------------------- */
/* 4–5 · address ownership                                                    */
/* ------------------------------------------------------------------------- */

test("4 · a customer checks out against their own saved address, and can add one mid-checkout", () => {
  const store = freshStore();

  const summary = getCheckoutSummary(store, AADYA, VALID_CHECKOUT.items);
  assert.ok(summary.ready, "the quote is clear to place with the customer's own address");

  const response = placeValid(store);
  assert.equal(response.order.shippingAddress.name, "Aadya Sharma");
  assert.equal(response.order.shippingAddress.postalCode, "110057");

  /* Adding an address mid-checkout uses the existing address system. */
  const store2 = freshStore();
  const added = addCustomerAddress(store2, AADYA, {
    name: "Aadya Sharma",
    phone: "+91 98765 43210",
    line1: "10, Golf Green",
    city: "Kolkata",
    state: "West Bengal",
    postalCode: "700095",
  });
  const placed = placeCheckoutOrder(store2, AADYA, { ...VALID_CHECKOUT, addressId: added.id });
  assert.equal(placed.order.shippingAddress.line1, "10, Golf Green");
  assert.equal(placed.order.shippingAddress.city, "Kolkata");
});

test("5 · a customer cannot place an order against another customer's address", () => {
  const store = freshStore();

  /* ADDR-001 belongs to Aadya; Ritika's session cannot even see it, let alone order to it. */
  throwsWithCode(
    () => placeCheckoutOrder(store, RITIKA, { ...VALID_CHECKOUT, addressId: "ADDR-001" }),
    CHECKOUT_CODES.ADDRESS_NOT_FOUND
  );
  throwsWithCode(
    () => placeCheckoutOrder(store, RITIKA, { ...VALID_CHECKOUT, addressId: "ADDR-DOES-NOT-EXIST" }),
    CHECKOUT_CODES.ADDRESS_NOT_FOUND
  );
  throwsWithCode(
    () => placeCheckoutOrder(store, AADYA, { ...VALID_CHECKOUT, addressId: "  " }),
    CHECKOUT_CODES.ADDRESS_REQUIRED
  );

  /* No order leaked into the book through the forged id. */
  assert.equal(store.orders.length, 12);
});

/* ------------------------------------------------------------------------- */
/* 6–8 · delivery, payment and inventory validity                             */
/* ------------------------------------------------------------------------- */

test("6 · an invented delivery method is rejected", () => {
  const store = freshStore();

  throwsWithCode(
    () => placeCheckoutOrder(store, AADYA, { ...VALID_CHECKOUT, deliveryMethod: "same-day-express" }),
    CHECKOUT_CODES.DELIVERY_METHOD_INVALID
  );
  throwsWithCode(
    () => placeCheckoutOrder(store, AADYA, { ...VALID_CHECKOUT, deliveryMethod: null }),
    CHECKOUT_CODES.DELIVERY_METHOD_INVALID
  );
});

test("7 · an invented payment method is rejected — and UPI needs its client-safe detail", () => {
  const store = freshStore();

  throwsWithCode(
    () => placeCheckoutOrder(store, AADYA, { ...VALID_CHECKOUT, paymentMethod: "cod" }),
    CHECKOUT_CODES.PAYMENT_METHOD_INVALID,
    "the source of truth supports no cash-on-delivery"
  );
  throwsWithCode(
    () => placeCheckoutOrder(store, AADYA, { ...VALID_CHECKOUT, paymentMethod: "card" }),
    CHECKOUT_CODES.PAYMENT_METHOD_INVALID
  );
  throwsWithCode(
    () => placeCheckoutOrder(store, AADYA, { ...VALID_CHECKOUT, paymentDetail: { upiId: "" } }),
    CHECKOUT_CODES.PAYMENT_INFO_REQUIRED
  );
  throwsWithCode(
    () => placeCheckoutOrder(store, AADYA, { ...VALID_CHECKOUT, paymentDetail: { upiId: "not-a-handle" } }),
    CHECKOUT_CODES.PAYMENT_INFO_REQUIRED
  );
});

test("8 · checkout refuses stock it cannot fulfil — quote and placement both", () => {
  const store = freshStore();
  const before = store.inventory.map((row) => ({ ...row }));

  /* JWL-003 exists only in Bhubaneswar (3 free) — ten are impossible. */
  const oversized = bag(["JWL-003", 10]);
  const summary = getCheckoutSummary(store, AADYA, oversized);
  assert.equal(summary.ready, false);
  assert.ok(summary.issues.some((issue) => issue.code === CHECKOUT_CODES.OUT_OF_STOCK));
  assert.equal(summary.fulfilment, null);

  throwsWithCode(
    () => placeCheckoutOrder(store, AADYA, { ...VALID_CHECKOUT, items: oversized }),
    CHECKOUT_CODES.OUT_OF_STOCK
  );

  /* Nothing moved: a refused checkout leaves inventory exactly as it was. */
  assert.deepEqual(
    store.inventory.map((row) => ({ ...row })),
    before
  );

  /* And an unpublished lifecycle piece can never be bought. */
  const summaryDraft = getCheckoutSummary(store, AADYA, bag(["JWL-010", 1]));
  assert.ok(summaryDraft.issues.some((issue) => issue.code === CHECKOUT_CODES.PRODUCT_UNAVAILABLE));
  throwsWithCode(
    () => placeCheckoutOrder(store, AADYA, { ...VALID_CHECKOUT, items: bag(["JWL-010", 1]) }),
    CHECKOUT_CODES.PRODUCT_UNAVAILABLE
  );
  throwsWithCode(
    () => placeCheckoutOrder(store, AADYA, { ...VALID_CHECKOUT, items: bag(["JWL-001", 0]) }),
    CHECKOUT_CODES.INVALID_QUANTITY
  );
  throwsWithCode(
    () => placeCheckoutOrder(store, AADYA, { ...VALID_CHECKOUT, items: bag(["JWL-001", 1.5]) }),
    CHECKOUT_CODES.INVALID_QUANTITY
  );
});

/* ------------------------------------------------------------------------- */
/* 9–12 · the order: creation, totals, snapshots                              */
/* ------------------------------------------------------------------------- */

test("9 · a valid checkout creates ONE canonical order", () => {
  const store = freshStore();
  const response = placeValid(store);

  assert.equal(store.orders.length, 13, "one new order on top of the twelve seeded in the book");
  assert.equal(response.order.id, "ORD-2026-9391");
  assert.equal(response.order.orderNumber, "SWN-9391-IN");
  assert.ok(response.order.createdAt);
  assert.equal(response.order.status, "Placed", "the order enters at the head of the existing lifecycle");
  assert.ok(store.orders.some((order) => order.id === response.order.id));
});

test("10 · the order's totals come from the ONE calculation", () => {
  const store = freshStore();
  const response = placeValid(store, {
    items: bag(["JWL-001", 1], ["JWL-002", 2]),
  });

  const expected = calculateTotals({
    items: [
      { unitPrice: 72400, quantity: 1 },
      { unitPrice: 56800, quantity: 2 },
    ],
    deliveryCharge: deliveryMethods[0].charge,
  });

  assert.equal(response.order.subtotal, expected.subtotal);
  assert.equal(response.order.shipping, expected.deliveryCharge);
  assert.equal(response.order.total, expected.grandTotal);
  assert.equal(response.order.taxAmount, expected.taxAmount);
  assert.equal(response.order.subtotal, 186000);
  assert.equal(response.order.total, 186000);
  assert.equal(response.order.taxAmount, 5417);

  /* The summary quoted the exact same numbers before placement. */
  const quote = getCheckoutSummary(store, AADYA, bag(["JWL-001", 1]));
  assert.equal(quote.totals.grandTotal, 72400);
  assert.equal(quote.totals.taxAmount, calculateTotals({ items: [{ unitPrice: 72400, quantity: 1 }], deliveryCharge: 0 }).taxAmount);
});

test("11 · order items snapshot the canonical product, not the client's bag", () => {
  const store = freshStore();
  const response = placeValid(store, {
    items: bag(["JWL-001", 1], ["JWL-002", 2]),
  });

  assert.equal(response.order.items.length, 2);
  const [first, second] = response.order.items;

  assert.deepEqual(
    { ...first, image: undefined },
    {
      id: "JWL-001",
      name: "Hrudaya Diamond Pendant",
      sku: "SWN-PND-001",
      purity: "22K",
      price: 72400,
      quantity: 1,
      href: "/product/JWL-001",
      image: undefined,
    }
  );
  assert.ok(first.image && "src" in first.image && "alt" in first.image, "the imagery snapshot travels with the order");
  assert.equal(second.name, "Eternal Halo Ring");
  assert.equal(second.price, 56800);
  assert.equal(second.quantity, 2);
});

test("12 · the order snapshots the delivery address — owned, complete, leak-free", () => {
  const store = freshStore();
  const response = placeValid(store);
  const snapshot = response.order.shippingAddress;

  assert.deepEqual(snapshot, {
    name: "Aadya Sharma",
    phone: "+91 98765 43210",
    line1: "42, Vasant Vihar Enclave",
    line2: "Near Palm Grove Club",
    city: "New Delhi",
    state: "Delhi",
    postalCode: "110057",
    country: "India",
  });
  assert.ok(!("id" in snapshot) && !("isDefault" in snapshot), "the snapshot is postal data, not the address record");
  assert.equal(response.order.deliveryMethod, "insured-courier");
  assert.equal(response.order.courier, "Blue Dart Apex Insured");
});

/* ------------------------------------------------------------------------- */
/* 13–16 · the payment boundary                                               */
/* ------------------------------------------------------------------------- */

test("13 · the payment success path settles through the abstraction", () => {
  const store = freshStore();
  const response = placeValid(store);

  assert.equal(response.payment.status, "success");
  assert.equal(response.payment.method, "upi");
  assert.equal(response.payment.label, "Prepaid · UPI");
  assert.equal(response.payment.amount, response.order.total);
  assert.equal(response.order.paymentStatus, "paid");
  assert.match(response.payment.id, /^PAY-/);

  /* Net banking rides the same abstraction to the same canonical label. */
  const other = placeValid(store, {
    paymentMethod: "netbanking",
    paymentDetail: null,
    idempotencyKey: "CHK-TEST-NB",
  });
  assert.equal(other.payment.label, "Prepaid · Net Banking");
  assert.equal(other.order.paymentMethod, "Prepaid · Net Banking");
});

test("14 · a declined payment rejects with a customer-safe envelope", () => {
  const store = freshStore();

  let declined = null;
  try {
    placeValid(store, { paymentDetail: { upiId: "fail@bank" } });
  } catch (error) {
    declined = error;
  }

  assert.ok(declined, "the processor declined the documented demo handle");
  assert.equal(declined.code, CHECKOUT_CODES.PAYMENT_DECLINED);
  assert.ok(declined.message.includes("declined"));
  assert.ok(!declined.message.includes("undefined"), "the message is presentation-safe");
});

test("15 · a failed payment creates no order — successful or otherwise", () => {
  const store = freshStore();
  const ordersBefore = store.orders.length;
  const auditBefore = store.auditLog.length;
  const customerOrdersBefore = listCustomerOrders(store, AADYA).length;

  assert.throws(() => placeValid(store, { paymentDetail: { upiId: "fail@bank" } }));

  assert.equal(store.orders.length, ordersBefore, "nothing entered the book");
  assert.equal(store.auditLog.length, auditBefore, "nothing was audited as business activity");
  assert.equal(listCustomerOrders(store, AADYA).length, customerOrdersBefore);
  assert.equal(
    store.inventory.find((row) => row.id === "STK-001-BR-001").available,
    6,
    "no stock moved"
  );

  /* The customer can then retry successfully with the same key. */
  const retried = placeValid(store, { paymentDetail: { upiId: "aadya@okhdfc" } });
  assert.equal(retried.order.status, "Placed");
});

test("16 · a retried submission replays its original order — idempotency-ready", () => {
  const store = freshStore();
  const first = placeValid(store);
  const ordersAfterFirst = store.orders.length;
  const stockAfterFirst = store.inventory.find((row) => row.id === "STK-001-BR-001");

  const replay = placeValid(store);
  assert.equal(replay.replay, true);
  assert.equal(replay.order.id, first.order.id, "the same key returns the same order");
  assert.equal(replay.payment.id, first.payment.id);
  assert.equal(store.orders.length, ordersAfterFirst, "no duplicate order was created");
  assert.equal(
    store.inventory.find((row) => row.id === "STK-001-BR-001").available,
    stockAfterFirst.available,
    "no duplicate stock was taken"
  );

  /* A different key is a different checkout and correctly creates its own order. */
  const second = placeValid(store, { idempotencyKey: "CHK-TEST-SECOND", items: bag(["JWL-004", 1]) });
  assert.equal(second.replay, false);
  assert.equal(store.orders.length, ordersAfterFirst + 1);
});

/* ------------------------------------------------------------------------- */
/* 17–18 · the bag's fate                                                     */
/* ------------------------------------------------------------------------- */

test("17–18 · the bag clears only on success — the page wiring says so", () => {
  const srcDir = join(dirname(fileURLToPath(import.meta.url)), "..");
  const pageSource = readFileSync(join(srcDir, "pages/customer/checkout/CheckoutPage.jsx"), "utf8");

  /* The single clear() lives in the success branch of the placed order… */
  const successBranch = pageSource.slice(
    pageSource.indexOf("if (response?.order)"),
    pageSource.indexOf("/* A rejection renders where the customer is")
  );
  assert.ok(successBranch.includes("clear()"), "the purchased bag clears after the order exists");
  assert.ok(successBranch.includes("/order-confirmation/"), "and hands the customer to the confirmation");

  /* …and nothing clears the bag before the provider answers. */
  const beforePlace = pageSource.slice(0, pageSource.indexOf("const response = await placeOrder(payload);"));
  assert.ok(!beforePlace.includes("clear()"), "no premature clear — a failed checkout keeps the bag");
  assert.match(pageSource, /useCart\(\)/, "the existing CartContext is the bag the checkout consumes");
});

/* ------------------------------------------------------------------------- */
/* 19–22 · the order across the audiences                                     */
/* ------------------------------------------------------------------------- */

test("19 · the customer sees the new order through the existing order contract", () => {
  const store = freshStore();
  const response = placeValid(store);

  const orders = listCustomerOrders(store, AADYA);
  assert.equal(orders[0].id, response.order.id, "newest first, through useOrders");

  const byNumber = getCustomerOrder(store, AADYA, response.order.orderNumber);
  assert.equal(byNumber.id, response.order.id, "useOrder resolves by order number");
});

test("20 · the Admin console sees the canonical order in the order book", () => {
  const store = freshStore();
  const response = placeValid(store);

  const adminOrder = listAdminOrders(store, { search: response.order.orderNumber });
  assert.equal(adminOrder.length, 1);
  assert.equal(adminOrder[0].customerName, "Aadya Sharma", "the book joins the customer directory");
  assert.equal(adminOrder[0].branchName, "Swarnova Bhubaneswar", "…and the branch record");
  assert.deepEqual(adminOrder[0].actions, ["Confirmed", "Cancelled"], "a placed order confirms before preparation");

  /* Reports read the same book — no checkout-only sales record exists. */
  const placed = adminReports(store).ordersByStatus.find((row) => row.status === "Placed");
  assert.ok(placed.count >= 1);
});

test("21 · the fulfilling branch's employee sees the order; another branch does not", () => {
  const store = freshStore();
  const response = placeValid(store); // BR-001 fulfils from the canonical first candidate

  const bbsr = store.employees.find((item) => item.id === "EMP-001"); // Bhubaneswar
  const ctc = store.employees.find((item) => item.id === "EMP-008"); // Cuttack

  const bbsrOrders = listEmployeeOrders(store, {
    id: bbsr.id,
    role: ROLES.EMPLOYEE,
    label: `${bbsr.name} — Employee`,
  });
  assert.ok(bbsrOrders.some((order) => order.id === response.order.id));

  const ctcOrders = listEmployeeOrders(store, {
    id: ctc.id,
    role: ROLES.EMPLOYEE,
    label: `${ctc.name} — Employee`,
  });
  assert.ok(!ctcOrders.some((order) => order.id === response.order.id));
});

test("22 · Super Admin retains global visibility of the new order", () => {
  const store = freshStore();
  const response = placeValid(store);

  /* The super-admin actor sees every branch's book, unrestricted. */
  const globalOrders = listEmployeeOrders(store, {
    id: "superadmin@swarnova.in",
    role: ROLES.SUPER_ADMIN,
    label: "Super Admin",
  });
  assert.ok(globalOrders.some((order) => order.id === response.order.id));
  assert.ok(globalOrders.some((order) => order.branchId === CTC), "no branch restriction was applied");

  const overview = adminOverview(store);
  assert.ok(overview.business.openOrders >= 1);

  const platform = platformOverview(store);
  assert.ok(platform.branches.total > 0, "the command centre keeps its global lens");
});

/* ------------------------------------------------------------------------- */
/* 23–24 · inventory and audit consistency                                    */
/* ------------------------------------------------------------------------- */

test("23 · order and inventory stay consistent — allocation, not invention", () => {
  const store = freshStore();
  const rowBefore = { ...store.inventory.find((row) => row.id === "STK-001-BR-001") };
  const movementsBefore = store.inventoryMovements.length;

  const response = placeValid(store);
  const row = store.inventory.find((item) => item.id === "STK-001-BR-001");

  assert.equal(row.available, rowBefore.available - 1);
  assert.equal(row.reserved, rowBefore.reserved + 1);
  assert.equal(
    row.available + row.reserved,
    rowBefore.available + rowBefore.reserved,
    "pieces moved from free to reserved — the model's minimal effect"
  );

  const movement = store.inventoryMovements[0];
  assert.equal(store.inventoryMovements.length, movementsBefore + 1);
  assert.equal(movement.type, "sale");
  assert.equal(movement.delta, -1);
  assert.match(movement.note, new RegExp(response.order.orderNumber));
  assert.match(movement.by, /Aadya Sharma — Storefront/);

  /* The movement log reads through the existing contract. */
  const listed = listInventoryMovements(store, { stockId: "STK-001-BR-001", limit: 5 });
  assert.ok(listed.some((item) => item.id === movement.id));
});

test("24 · the placement is audited business activity in the existing trail", () => {
  const store = freshStore();
  const response = placeValid(store);

  const logs = listAuditLogs(store, { action: "order.place" });
  assert.equal(logs.length, 1);
  assert.equal(logs[0].entityId, response.order.id);
  assert.equal(logs[0].entityLabel, response.order.orderNumber);
  assert.equal(logs[0].branchId, BBSR, "the fulfilling branch rides the audit entry");
  assert.match(logs[0].actor, /Aadya Sharma — Storefront/);
});

/* ------------------------------------------------------------------------- */
/* 25–26 · ownership and scope                                                */
/* ------------------------------------------------------------------------- */

test("25 · Customer A cannot reach Customer B's new order", () => {
  const store = freshStore();
  const response = placeValid(store);

  assert.equal(getCustomerOrder(store, RITIKA, response.order.id), null);
  assert.equal(getCustomerOrder(store, RITIKA, response.order.orderNumber), null);
  assert.ok(!listCustomerOrders(store, RITIKA).some((order) => order.id === response.order.id));
});

test("26 · branch scope does not escalate — the new order obeys Phase 10 boundaries", () => {
  const store = freshStore();
  const response = placeValid(store); // fulfilled by BR-001

  const ctc = store.employees.find((item) => item.id === "EMP-008");
  const ctcActor = { id: ctc.id, role: ROLES.EMPLOYEE, label: `${ctc.name} — Employee` };

  assert.throws(
    () => getEmployeeOrder(store, ctcActor, response.order.id),
    /another boutique/,
    "another branch's employee cannot even open it"
  );

  /* And the lifecycle still moves only along the existing flow table. */
  const bbsr = store.employees.find((item) => item.id === "EMP-001");
  const bbsrActor = { id: bbsr.id, role: ROLES.EMPLOYEE, label: `${bbsr.name} — Employee` };
  assert.throws(
    () =>
      placeCheckoutOrder(store, AADYA, {
        ...VALID_CHECKOUT,
        deliveryMethod: undefined,
        idempotencyKey: "CHK-TEST-FRESH",
      }),
    CHECKOUT_CODES.DELIVERY_METHOD_INVALID
  );
  assert.ok(
    listEmployeeOrders(store, bbsrActor, { status: "Placed" }).some(
      (order) => order.id === response.order.id
    )
  );
});

/* ------------------------------------------------------------------------- */
/* 27–30 · the phases before this one still stand                             */
/* ------------------------------------------------------------------------- */

test("27 · the Phase 11 customer identity surface is untouched", () => {
  const store = freshStore();
  const session = authenticateCustomer(store, {
    identifier: "aadya.sharma@swarnova.in",
    password: PASSWORD,
  });
  assert.equal(session.customer.id, AADYA);

  const registered = registerCustomer(store, {
    name: "Phase Twelve",
    email: "phase.twelve@swarnova.in",
    phone: "+91 90000 12000",
    password: PASSWORD,
  });
  assert.ok(registered.customer.id.startsWith("CUST-"));
  assert.throws(
    () =>
      registerCustomer(store, {
        name: "Duplicate",
        email: "phase.twelve@swarnova.in",
        phone: "+91 90000 12001",
        password: PASSWORD,
      }),
    (error) => error.code === "EMAIL_TAKEN"
  );
});

test("28 · the Phase 9 Admin operations surface is untouched", () => {
  const store = freshStore();
  const session = authenticateStaff(store, {
    email: "arpita.mohanty@swarnova.in",
    password: PASSWORD,
  });
  assert.equal(session.role, ROLES.ADMIN);

  const overview = adminOverview(store);
  assert.ok(Array.isArray(overview.attention));
  const reports = adminReports(store);
  assert.equal(reports.salesByBranch.length, store.branches.length);
});

test("29 · the Phase 10 Employee surface is untouched", () => {
  const store = freshStore();
  const bbsr = store.employees.find((item) => item.id === "EMP-001");
  const actor = { id: bbsr.id, role: ROLES.EMPLOYEE, label: `${bbsr.name} — Employee` };

  assert.ok(listEmployeeOrders(store, actor).length > 0);
  assert.equal(
    listEmployeeOrders(store, actor).every((order) => order.branchId === BBSR),
    true,
    "branch scope holds with checkout orders in the book"
  );
});

test("30 · the Super Admin surface is untouched", () => {
  const store = freshStore();
  const session = authenticateStaff(store, { email: "superadmin@swarnova.in", password: PASSWORD });
  assert.deepEqual(session.permissions, ["*"]);

  const platform = platformOverview(store);
  assert.ok(platform.products.total > 0);
  assert.ok(platform.storefront.status);
});

/* ------------------------------------------------------------------------- */
/* The canonical surfaces and the storefront wiring                           */
/* ------------------------------------------------------------------------- */

test("surfaces · the provider offers exactly the canonical delivery and payment methods", async () => {
  const provider = freshProvider();

  const delivery = await provider.getDeliveryMethods();
  assert.equal(delivery.length, 1, "the source of truth promises one method — no invented tiers");
  assert.equal(delivery[0].id, "insured-courier");
  assert.equal(delivery[0].charge, 0);
  assert.ok(delivery[0].courier);

  const payment = await provider.getPaymentMethods();
  assert.deepEqual(
    payment.map((method) => method.id),
    ["upi", "netbanking"],
    "the prepaid methods the order book already records — no COD, no card form"
  );
  assert.ok(payment.every((method) => !/card|cvv|number/i.test(method.label)));
});

test("surfaces · the checkout summary is the validated quote the page renders", async () => {
  const provider = freshProvider();
  await provider.authenticateCustomer({ identifier: "aadya.sharma@swarnova.in", password: PASSWORD });

  const summary = await provider.getCheckoutSummary(bag(["JWL-001", 1], ["JWL-002", 2]));
  assert.equal(summary.ready, true);
  assert.equal(summary.count, 3);
  assert.equal(summary.items.length, 2);
  assert.equal(summary.fulfilment.branchId, BBSR, "the store, not the client, resolved the boutique");
  assert.equal(summary.delivery.id, "insured-courier");
  assert.equal(summary.totals.grandTotal, 186000);
  assert.deepEqual(summary.issues, []);

  /* The service maps the page's bag objects into the same quote request. */
  const pageBag = [{ id: "JWL-001", product: { id: "JWL-001", price: 72400 }, quantity: 2 }];
  assert.deepEqual(toCheckoutItems(pageBag), [{ id: "JWL-001", quantity: 2 }]);
  assert.equal(checkoutItemsSignature(pageBag), "JWL-001:2");
});

test("surfaces · checkout errors translate to customer-safe copy", () => {
  const declined = translateCheckoutError({ code: CHECKOUT_CODES.PAYMENT_DECLINED, message: "raw" });
  assert.equal(declined.title, "Payment declined");
  assert.ok(declined.message.includes("declined"));
  assert.ok(!declined.message.includes("raw"), "the envelope copy wins");

  const unknown = translateCheckoutError(new Error("ERR_SOCKET"));
  assert.ok(unknown.message.length > 0, "unknown failures degrade safely");
});

test("wiring · the router carries the guarded checkout surface and the cart leads to it", () => {
  const srcDir = join(dirname(fileURLToPath(import.meta.url)), "..");
  const routerSource = readFileSync(join(srcDir, "app/router.jsx"), "utf8");

  assert.ok(routerSource.includes('path: "checkout"'), "/checkout exists");
  assert.ok(routerSource.includes('path: "order-confirmation/:id"'), "/order-confirmation/:id exists");
  assert.ok(routerSource.includes("<CheckoutPage />") && routerSource.includes("<OrderConfirmationPage />"));

  const cartSource = readFileSync(join(srcDir, "pages/customer/cart/CartPage.jsx"), "utf8");
  assert.match(cartSource, /to="\/checkout"/, "the bag's CTA leads to the one checkout");
  assert.ok(!cartSource.includes("Demonstration Commerce Environment"), "the demo notice has retired");
});

test("wiring · checkout is invisible to guests and renders its empty bag for members", () => {
  const guest = renderCheckoutPage("/checkout", null);
  assert.ok(!guest.includes("Place Order"), "a guest never sees the checkout surface");
  assert.ok(!guest.includes("Delivery Address"));

  const memberEmpty = renderCheckoutPage("/checkout", MEMBER);
  assert.ok(memberEmpty.includes("Checkout"), "the member's checkout renders");
  assert.ok(memberEmpty.includes("Your bag is empty."), "the empty bag speaks first");
  assert.ok(memberEmpty.includes("Continue Shopping"));
  assert.ok(!memberEmpty.includes("Place Order"), "no payment UI with nothing to purchase");
});
