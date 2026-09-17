/**
 * PHASE 11 — CUSTOMER AUTHENTICATION + IDENTITY (§36 checks)
 * -----------------------------------------------------------------------------
 * Twenty-two checks over the canonical store and the customer-auth boundary,
 * driven exactly the way the storefront drives it: credentials resolve to a
 * customer session through the provider, and every account read/write is
 * re-scoped to the authenticated customer id store-side. No URL parameter,
 * no query string and no client-supplied claim is trusted anywhere in this
 * file — which is the point.
 *
 * Run from `frontend/`:
 *
 *   npm test
 *   node --import ./src/__tests__/support/register-assets.mjs --test src/__tests__/
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";

import mockProvider from "../services/providers/mock/mockProvider.js";
import {
  CUSTOMER_AUTH_CODES,
  addCustomerAddress,
  adminOverview,
  adminReports,
  authenticateCustomer,
  authenticateStaff,
  createGovernanceStore,
  deleteCustomerAddress,
  employeeOverview,
  findCustomerByIdentifier,
  getCustomerOrder,
  getCustomerProfile,
  listAdminCustomers,
  listAdminOrders,
  listAuditLogs,
  listCustomerAddresses,
  listCustomerOrders,
  listEmployeeCustomers,
  platformOverview,
  registerCustomer,
  requestCustomerPasswordReset,
  resetCustomerPassword,
  resolveCustomerScope,
  resolveStaffScope,
  setDefaultCustomerAddress,
  toAdminCustomer,
  toCustomerPublic,
  updateCustomerAddress,
  updateCustomerProfile,
} from "../services/providers/mock/governanceStore.js";
import { customerAuthService } from "../services/customerAuthService.js";
import { CUSTOMER_DEMO_PASSWORD } from "../mock/data/customer/index.js";
import { ROLES } from "../features/authentication/roles.js";
import { CAPABILITIES } from "../features/authentication/capabilities.js";
import { can } from "../features/authentication/permissions.js";
import RoleBoundary from "../features/authentication/RoleBoundary.jsx";
import CustomerAuthProvider from "../features/customer-auth/CustomerAuthProvider.jsx";
import RequireCustomer from "../features/customer-auth/RequireCustomer.jsx";
import GuestOnly from "../features/customer-auth/GuestOnly.jsx";
import {
  CUSTOMER_AUTH_ERROR_CODES,
  translateCustomerAuthError,
} from "../features/customer-auth/customerAuthErrors.js";
import {
  CUSTOMER_HOME_PATH,
  CUSTOMER_LOGIN_PATH,
  loginPathWithReturnTo,
  safeReturnTo,
  withReturnTo,
} from "../features/customer-auth/customerRoutes.js";
import {
  GUEST_OWNER_ID,
  loadOwnerState,
  ownerIdFor,
  ownerStorageKey,
  resolveOwnerValue,
  saveOwnerState,
} from "../state/ownerScopedStorage.js";

const PASSWORD = CUSTOMER_DEMO_PASSWORD;
const AADYA = "CUST-84920";
const RITIKA = "CUST-77341";
const AADYA_EMAIL = "aadya.sharma@swarnova.in";
const RITIKA_PHONE = "+91 90071 22314";

const freshStore = () => createGovernanceStore();

/** Reset the shared provider singleton so provider-level tests stay isolated. */
function freshProvider() {
  mockProvider._store = null;
  mockProvider._customerSessionId = undefined;
  return mockProvider;
}

/** The mock throws synchronously — invoke inside an async wrapper so both
 *  sync throws and async rejections surface as rejections with the code. */
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

const VALID_ADDRESS = {
  name: "Ritika Sengupta",
  phone: "+91 90071 22314",
  line1: "14/2, Hindusthan Park",
  city: "Kolkata",
  state: "West Bengal",
  postalCode: "700029",
};

function renderCustomerGate(element, { session, path = "/account/orders" } = {}) {
  return renderToStaticMarkup(
    h(
      MemoryRouter,
      { initialEntries: [path] },
      h(CustomerAuthProvider, { initialSession: session }, element)
    )
  );
}

/** A Map-backed `localStorage` so partition persistence is testable in node. */
function installStorageShim() {
  const backing = new Map();
  const hadNative = typeof localStorage !== "undefined";
  const native = hadNative ? globalThis.localStorage : undefined;
  globalThis.localStorage = {
    getItem: (key) => (backing.has(String(key)) ? backing.get(String(key)) : null),
    setItem: (key, value) => backing.set(String(key), String(value)),
    removeItem: (key) => backing.delete(String(key)),
    clear: () => backing.clear(),
  };
  return () => {
    if (hadNative) globalThis.localStorage = native;
    else delete globalThis.localStorage;
  };
}

/* ------------------------------------------------------------------------- */
/* 1–8 · the authentication contract                                         */
/* ------------------------------------------------------------------------- */

test("1 · a customer signs in with email or phone and receives a public session customer", () => {
  const store = freshStore();

  const byEmail = authenticateCustomer(store, { identifier: AADYA_EMAIL, password: PASSWORD });
  assert.equal(byEmail.customer.id, AADYA);
  assert.equal(byEmail.customer.name, "Aadya Sharma");
  assert.equal(byEmail.customer.email, AADYA_EMAIL);
  assert.ok(!("password" in byEmail.customer));

  /* Phone numbers match on digits alone; email matches case-insensitively. */
  const byPhone = authenticateCustomer(store, { identifier: RITIKA_PHONE, password: PASSWORD });
  assert.equal(byPhone.customer.id, RITIKA);
  const byDigits = authenticateCustomer(store, { identifier: "919007122314", password: PASSWORD });
  assert.equal(byDigits.customer.id, RITIKA);
  const byCaps = authenticateCustomer(store, { identifier: "AADYA.SHARMA@SWARNOVA.IN", password: PASSWORD });
  assert.equal(byCaps.customer.id, AADYA);
});

test("2 · unknown identifiers, wrong passwords and blank credentials all reject without disclosure", () => {
  const store = freshStore();

  /* Identical codes for unknown vs wrong — the response never says which half failed. */
  throwsWithCode(
    () => authenticateCustomer(store, { identifier: AADYA_EMAIL, password: "wrong-password" }),
    CUSTOMER_AUTH_CODES.INVALID_CREDENTIALS
  );
  throwsWithCode(
    () => authenticateCustomer(store, { identifier: "nobody@swarnova.in", password: PASSWORD }),
    CUSTOMER_AUTH_CODES.INVALID_CREDENTIALS
  );
  throwsWithCode(
    () => authenticateCustomer(store, { identifier: "", password: "" }),
    CUSTOMER_AUTH_CODES.VALIDATION_ERROR
  );

  /* The UI translation carries no technical detail. */
  assert.match(
    translateCustomerAuthError({ code: CUSTOMER_AUTH_ERROR_CODES.INVALID_CREDENTIALS }),
    /could not sign you in/
  );
});

test("3 · registration creates a directory customer that can immediately sign in", () => {
  const store = freshStore();

  const { customer } = registerCustomer(store, {
    name: "Test Patnaik",
    email: "test.patnaik@example.com",
    phone: "+91 90000 11111",
    password: "new-customer-pass",
  });
  assert.match(customer.id, /^CUST-/);
  assert.equal(customer.tier, "Swarnova Classic");
  assert.ok(!("password" in customer));

  /* The same credentials now authenticate — and the Admin book sees the customer. */
  const session = authenticateCustomer(
    store,
    { identifier: "test.patnaik@example.com", password: "new-customer-pass" }
  );
  assert.equal(session.customer.id, customer.id);
  assert.equal(listAdminCustomers(store, { search: "test.patnaik" }).length, 1);

  /* A fresh profile resolves with derived defaults, never null. */
  const profile = getCustomerProfile(store, customer.id);
  assert.equal(profile.name, "Test Patnaik");
  assert.equal(profile.email, "test.patnaik@example.com");
});

test("4 · duplicate emails, duplicate phones and weak payloads are refused", () => {
  const store = freshStore();
  const payload = {
    name: "Duplicate Me",
    email: "duplicate.me@example.com",
    phone: "+91 90000 22222",
    password: "duplicate-pass",
  };
  registerCustomer(store, payload);

  /* Email uniqueness is case-insensitive; phone uniqueness ignores formatting. */
  throwsWithCode(
    () => registerCustomer(store, { ...payload, email: "DUPLICATE.ME@EXAMPLE.COM", phone: "+91 90000 33333" }),
    CUSTOMER_AUTH_CODES.EMAIL_TAKEN
  );
  throwsWithCode(
    () => registerCustomer(store, { ...payload, email: "other@example.com", phone: "+919000022222" }),
    CUSTOMER_AUTH_CODES.PHONE_TAKEN
  );
  throwsWithCode(
    () => registerCustomer(store, { ...payload, email: AADYA_EMAIL, phone: "+91 90000 44444" }),
    CUSTOMER_AUTH_CODES.EMAIL_TAKEN
  );
  throwsWithCode(
    () => registerCustomer(store, { ...payload, email: "fresh@example.com", phone: "+91 90000 55555", password: "short" }),
    CUSTOMER_AUTH_CODES.VALIDATION_ERROR
  );
  throwsWithCode(
    () => registerCustomer(store, { ...payload, email: "not-an-email", phone: "+91 90000 66666" }),
    CUSTOMER_AUTH_CODES.VALIDATION_ERROR
  );
  throwsWithCode(
    () => registerCustomer(store, { ...payload, email: "x@example.com", phone: "abc" }),
    CUSTOMER_AUTH_CODES.VALIDATION_ERROR
  );
});

test("5 · a reset request always succeeds but only issues a token for a real account", () => {
  const store = freshStore();

  const known = requestCustomerPasswordReset(store, AADYA_EMAIL);
  assert.equal(known.requested, true);
  assert.ok(known.devReference);
  assert.equal(store.customerResetTokens[known.devReference].customerId, AADYA);

  /* Unknown identifiers resolve identically — existence is never disclosed. */
  const unknown = requestCustomerPasswordReset(store, "ghost@swarnova.in");
  assert.deepEqual(unknown, { requested: true, devReference: null });
});

test("6 · a reset token is single-use, sets the new password and rejects garbage", () => {
  const store = freshStore();
  const { devReference } = requestCustomerPasswordReset(store, AADYA_EMAIL);

  const done = resetCustomerPassword(store, { token: devReference, password: "brand-new-pass" });
  assert.deepEqual(done, { reset: true });

  /* The new password works; the old one stops. */
  authenticateCustomer(store, { identifier: AADYA_EMAIL, password: "brand-new-pass" });
  throwsWithCode(
    () => authenticateCustomer(store, { identifier: AADYA_EMAIL, password: PASSWORD }),
    CUSTOMER_AUTH_CODES.INVALID_CREDENTIALS
  );

  /* Reuse and garbage both fail alike. */
  throwsWithCode(
    () => resetCustomerPassword(store, { token: devReference, password: "another-pass" }),
    CUSTOMER_AUTH_CODES.RESET_FAILURE
  );
  throwsWithCode(
    () => resetCustomerPassword(store, { token: "SWN-RST-NOPE-0000", password: "another-pass" }),
    CUSTOMER_AUTH_CODES.RESET_FAILURE
  );

  /* A weak replacement password is refused and the token stays consumable. */
  const second = requestCustomerPasswordReset(store, AADYA_EMAIL);
  throwsWithCode(
    () => resetCustomerPassword(store, { token: second.devReference, password: "short" }),
    CUSTOMER_AUTH_CODES.VALIDATION_ERROR
  );
  resetCustomerPassword(store, { token: second.devReference, password: "second-new-pass" });
  authenticateCustomer(store, { identifier: AADYA_EMAIL, password: "second-new-pass" });
});

test("7 · the provider resolves the current customer from its session", async () => {
  const provider = freshProvider();

  const signedOut = await provider.getCurrentCustomer();
  assert.deepEqual(signedOut, { authenticated: false, customer: null });

  const login = await customerAuthService.login(provider, {
    identifier: AADYA_EMAIL,
    password: PASSWORD,
  });
  assert.equal(login.authenticated, true);
  assert.equal(login.customer.id, AADYA);

  const current = await provider.getCurrentCustomer();
  assert.equal(current.authenticated, true);
  assert.equal(current.customer.id, AADYA);
  assert.ok(!("password" in current.customer));

  /* Registration signs straight in too. */
  freshProvider();
  const joined = await customerAuthService.register(provider, {
    name: "Session Test",
    email: "session.test@example.com",
    phone: "+91 90000 77777",
    password: "session-pass",
  });
  assert.equal(joined.authenticated, true);
  const currentJoined = await provider.getCurrentCustomer();
  assert.equal(currentJoined.customer.id, joined.customer.id);
});

test("8 · logout clears the session and the provider forgets the customer", async () => {
  const provider = freshProvider();
  await customerAuthService.login(provider, { identifier: AADYA_EMAIL, password: PASSWORD });
  assert.equal((await provider.getCurrentCustomer()).authenticated, true);

  const result = await customerAuthService.logout(provider);
  assert.deepEqual(result, { authenticated: false });
  assert.deepEqual(await provider.getCurrentCustomer(), {
    authenticated: false,
    customer: null,
  });

  /* Account reads now reject as an expired session — never as guest data. */
  await rejectsWithCode(() => provider.getCustomerProfile(), CUSTOMER_AUTH_CODES.SESSION_EXPIRED);
  await rejectsWithCode(() => provider.getOrders(), CUSTOMER_AUTH_CODES.SESSION_EXPIRED);
});

/* ------------------------------------------------------------------------- */
/* 9 · the route boundary                                                     */
/* ------------------------------------------------------------------------- */

test("9 · guests bounce to /login with their destination preserved; members pass; return-to stays same-origin", () => {
  assert.equal(CUSTOMER_LOGIN_PATH, "/login");
  assert.equal(CUSTOMER_HOME_PATH, "/account");
  assert.equal(
    loginPathWithReturnTo("/account/orders"),
    "/login?returnTo=%2Faccount%2Forders"
  );
  assert.equal(loginPathWithReturnTo(null), "/login");

  /* Open redirects fall back to the account instead of leaving the origin. */
  assert.equal(safeReturnTo("/account/wishlist"), "/account/wishlist");
  assert.equal(safeReturnTo("//evil.example.com"), "/account");
  assert.equal(safeReturnTo("https://evil.example.com"), "/account");
  assert.equal(safeReturnTo(null), "/account");
  assert.equal(withReturnTo("/register", "/account/orders"), "/register?returnTo=%2Faccount%2Forders");
  assert.equal(withReturnTo("/register", null), "/register");

  const marker = "ACCOUNT-MARKER";
  const signedOut = renderCustomerGate(h(RequireCustomer, null, h("p", null, marker)), {
    session: null,
  });
  assert.ok(!signedOut.includes(marker), "a guest must not see the account");

  const session = {
    customer: { id: AADYA, name: "Aadya Sharma", email: AADYA_EMAIL },
  };
  const signedIn = renderCustomerGate(h(RequireCustomer, null, h("p", null, marker)), {
    session,
  });
  assert.ok(signedIn.includes(marker), "a member must see the account");

  /* Guest-only routes invert the gate: members bounce, guests see the form. */
  const guestSees = renderCustomerGate(h(GuestOnly, null, h("p", null, marker)), {
    session: null,
    path: "/login",
  });
  assert.ok(guestSees.includes(marker));
  const memberBounces = renderCustomerGate(h(GuestOnly, null, h("p", null, marker)), {
    session,
    path: "/login",
  });
  assert.ok(!memberBounces.includes(marker));
});

/* ------------------------------------------------------------------------- */
/* 10–12 · customer data isolation                                            */
/* ------------------------------------------------------------------------- */

test("10 · Customer A cannot read Customer B's orders — by id or by order number", () => {
  const store = freshStore();

  const mine = listCustomerOrders(store, AADYA);
  assert.ok(mine.length > 0);
  assert.ok(mine.every((order) => order.customerId === AADYA));

  const theirs = listCustomerOrders(store, RITIKA);
  assert.ok(theirs.length > 0);
  for (const order of theirs) {
    assert.equal(getCustomerOrder(store, AADYA, order.id), null);
    assert.equal(getCustomerOrder(store, AADYA, order.orderNumber), null);
  }

  /* …while their own order resolves by either key. */
  assert.equal(getCustomerOrder(store, RITIKA, theirs[0].id).id, theirs[0].id);
  assert.equal(
    getCustomerOrder(store, RITIKA, theirs[0].orderNumber).id,
    theirs[0].id
  );

  /* An unknown customer id is an expired session, never an empty book. */
  throwsWithCode(() => listCustomerOrders(store, "CUST-00000"), CUSTOMER_AUTH_CODES.SESSION_EXPIRED);
});

test("11 · Customer A cannot read Customer B's profile or addresses", () => {
  const store = freshStore();

  const mine = listCustomerAddresses(store, AADYA);
  assert.ok(mine.length > 0);
  assert.equal(listCustomerAddresses(store, RITIKA).length, 0);

  const added = addCustomerAddress(store, RITIKA, { ...VALID_ADDRESS });
  assert.equal(listCustomerAddresses(store, RITIKA).length, 1);
  /* …and A's book is untouched by B's write. */
  assert.equal(listCustomerAddresses(store, AADYA).length, mine.length);
  assert.ok(!listCustomerAddresses(store, AADYA).some((item) => item.id === added.id));

  /* Profiles are scoped too — and defaults stay the caller's own. */
  assert.equal(getCustomerProfile(store, AADYA).id, AADYA);
  assert.equal(getCustomerProfile(store, RITIKA).id, RITIKA);
  updateCustomerProfile(store, AADYA, { name: "Aadya Sharma (Edited)" });
  assert.equal(getCustomerProfile(store, RITIKA).name, "Ritika Sengupta");
});

test("12 · Customer A cannot modify Customer B's addresses, defaults or profile", () => {
  const store = freshStore();
  const theirs = addCustomerAddress(store, RITIKA, { ...VALID_ADDRESS });
  const before = listCustomerAddresses(store, RITIKA);

  /* Updates, deletes and default-switches against a foreign id fail alike. */
  throwsWithCode(
    () => updateCustomerAddress(store, AADYA, { ...VALID_ADDRESS, id: theirs.id }),
    CUSTOMER_AUTH_CODES.NOT_FOUND
  );
  throwsWithCode(
    () => deleteCustomerAddress(store, AADYA, theirs.id),
    CUSTOMER_AUTH_CODES.NOT_FOUND
  );
  throwsWithCode(
    () => setDefaultCustomerAddress(store, AADYA, theirs.id),
    CUSTOMER_AUTH_CODES.NOT_FOUND
  );
  assert.deepEqual(listCustomerAddresses(store, RITIKA), before);

  /* …while the owner can run the full lifecycle on the same record. */
  updateCustomerAddress(store, RITIKA, { ...VALID_ADDRESS, id: theirs.id, city: "Howrah" });
  assert.equal(listCustomerAddresses(store, RITIKA)[0].city, "Howrah");
  setDefaultCustomerAddress(store, RITIKA, theirs.id);
  assert.equal(listCustomerAddresses(store, RITIKA)[0].isDefault, true);
  deleteCustomerAddress(store, RITIKA, theirs.id);
  assert.equal(listCustomerAddresses(store, RITIKA).length, 0);
});

/* ------------------------------------------------------------------------- */
/* 13–15 · owner-partitioned client collections                               */
/* ------------------------------------------------------------------------- */

test("13–15 · wishlist, bag, designs and try-ons partition by owner with one guest adoption", () => {
  const restore = installStorageShim();
  try {
    /* Partitions key by owner — guest and every customer differ. */
    assert.equal(ownerIdFor(null), GUEST_OWNER_ID);
    assert.equal(ownerIdFor({ id: AADYA }), AADYA);
    const keyA = ownerStorageKey("wishlist", AADYA);
    const keyB = ownerStorageKey("wishlist", RITIKA);
    const keyGuest = ownerStorageKey("wishlist", GUEST_OWNER_ID);
    assert.ok(keyA !== keyB && keyA !== keyGuest && keyB !== keyGuest);

    /* What A saves is invisible to B and to the guest. */
    saveOwnerState("wishlist", AADYA, ["JWL-001", "JWL-002"]);
    saveOwnerState("saved-designs", AADYA, [{ saveId: "DES-1" }]);
    saveOwnerState("saved-try-ons", AADYA, [{ saveId: "TRY-1" }]);
    assert.deepEqual(loadOwnerState("wishlist", AADYA, []), ["JWL-001", "JWL-002"]);
    assert.deepEqual(loadOwnerState("wishlist", RITIKA, []), []);
    assert.deepEqual(loadOwnerState("wishlist", GUEST_OWNER_ID, []), []);
    assert.deepEqual(loadOwnerState("saved-designs", RITIKA, []), []);
    assert.deepEqual(loadOwnerState("saved-try-ons", RITIKA, []), []);
    assert.deepEqual(loadOwnerState("wishlist", AADYA, null), ["JWL-001", "JWL-002"]);

    const isEmptyList = (value) => !Array.isArray(value) || value.length === 0;

    /* A guest collection moves into a fresh account once… */
    const adopted = resolveOwnerValue({
      previousOwnerId: GUEST_OWNER_ID,
      previousValue: ["JWL-009"],
      storedValue: [],
      isEmpty: isEmptyList,
    });
    assert.deepEqual(adopted, { value: ["JWL-009"], moved: true });

    /* …but never overwrites an account that already has its own. */
    const kept = resolveOwnerValue({
      previousOwnerId: GUEST_OWNER_ID,
      previousValue: ["JWL-009"],
      storedValue: ["JWL-001"],
      isEmpty: isEmptyList,
    });
    assert.deepEqual(kept, { value: ["JWL-001"], moved: false });

    /* Signing out simply loads the guest partition back. */
    const signedOut = resolveOwnerValue({
      previousOwnerId: AADYA,
      previousValue: ["JWL-001"],
      storedValue: [],
      isEmpty: isEmptyList,
    });
    assert.deepEqual(signedOut, { value: [], moved: false });

    /* The wishlist's Set semantics obey the same rule. */
    const setEmpty = (value) => !(value instanceof Set) || value.size === 0;
    const setAdopted = resolveOwnerValue({
      previousOwnerId: GUEST_OWNER_ID,
      previousValue: new Set(["JWL-004"]),
      storedValue: new Set(),
      isEmpty: setEmpty,
    });
    assert.equal(setAdopted.moved, true);
    assert.ok(setAdopted.value.has("JWL-004"));
  } finally {
    restore();
  }
});

/* ------------------------------------------------------------------------- */
/* 16 + 21 · identity separation and privilege escalation                     */
/* ------------------------------------------------------------------------- */

test("16 · customer identity carries no staff role, capability or permission", () => {
  const store = freshStore();
  const { customer } = authenticateCustomer(store, { identifier: AADYA_EMAIL, password: PASSWORD });

  for (const field of ["role", "roles", "permissions", "capabilities", "password"]) {
    assert.ok(!(field in customer), `customer session must not carry ${field}`);
  }
  assert.deepEqual(
    Object.keys(customer).sort(),
    ["city", "email", "id", "memberSince", "name", "phone", "state", "status", "tier"]
  );

  /* Staff and customer registries reject each other's credentials. */
  assert.throws(() =>
    authenticateStaff(store, { email: AADYA_EMAIL, password: PASSWORD })
  );
  assert.throws(() =>
    authenticateCustomer(store, { identifier: "superadmin@swarnova.in", password: PASSWORD })
  );
  assert.equal(findCustomerByIdentifier(store, "superadmin@swarnova.in"), null);

  /* The business books never serialize the credential. */
  const adminView = toAdminCustomer(store, store.customers[0]);
  assert.ok(!("password" in adminView));
  const branchView = listEmployeeCustomers(
    store,
    { id: "EMP-001", role: ROLES.EMPLOYEE, label: "Meera Das — Employee" }
  );
  assert.ok(branchView.every((entry) => !("password" in entry)));
});

test("21 · no privilege escalation: customer ids hold no staff scope and no staff door opens for them", () => {
  const store = freshStore();

  /* A customer id resolves no staff scope and no customer scope for staff ids. */
  assert.throws(() =>
    resolveStaffScope(store, { id: AADYA, role: ROLES.CUSTOMER, label: "Aadya — Customer" })
  );
  throwsWithCode(() => resolveCustomerScope(store, "EMP-001"), CUSTOMER_AUTH_CODES.SESSION_EXPIRED);
  throwsWithCode(() => resolveCustomerScope(store, null), CUSTOMER_AUTH_CODES.SESSION_EXPIRED);

  /* A customer session can never satisfy a staff RoleBoundary: the boundary
     reads the staff context, which customer auth never touches. */
  const marker = "ADMIN-MARKER";
  const html = renderToStaticMarkup(
    h(
      MemoryRouter,
      { initialEntries: ["/admin"] },
      h(
        CustomerAuthProvider,
        { initialSession: { customer: { id: AADYA, name: "Aadya Sharma" } } },
        h(RoleBoundary, { role: ROLES.ADMIN }, h("p", null, marker))
      )
    )
  );
  assert.ok(!html.includes(marker));
});

/* ------------------------------------------------------------------------- */
/* 17–20 · staff and console regressions                                      */
/* ------------------------------------------------------------------------- */

test("17 · staff login still resolves every role to its own console claims", () => {
  const store = freshStore();

  const superAdmin = authenticateStaff(store, { email: "superadmin@swarnova.in", password: "Swarnova@123" });
  assert.equal(superAdmin.role, ROLES.SUPER_ADMIN);
  assert.deepEqual(superAdmin.permissions, ["*"]);

  const admin = authenticateStaff(store, { email: "arpita.mohanty@swarnova.in", password: "Swarnova@123" });
  assert.equal(admin.role, ROLES.ADMIN);
  assert.ok(can(admin.permissions, CAPABILITIES.ORDERS_MANAGE));
  assert.ok(can(admin.permissions, CAPABILITIES.STAFF_MANAGE));

  const employee = authenticateStaff(store, { email: "meera.das@swarnova.in", password: "Swarnova@123" });
  assert.equal(employee.role, ROLES.EMPLOYEE);
  assert.ok(employee.permissions.length > 0);
});

test("18 · Super Admin keeps the platform overview and the audit trail", () => {
  const store = freshStore();
  const platform = platformOverview(store);
  assert.ok(platform.products.total > 0);
  assert.ok(platform.storefront.status);
  assert.ok(Array.isArray(listAuditLogs(store, {})));
});

test("19 · Admin keeps the overview, the order book and the reports", () => {
  const store = freshStore();
  const overview = adminOverview(store);
  assert.ok(overview.business.openOrders > 0);
  assert.ok(overview.business.activeBranches > 0);
  assert.ok(listAdminOrders(store, {}).length > 0);
  const reports = adminReports(store);
  assert.equal(reports.salesByBranch.length, store.branches.length);
});

test("20 · Employee keeps their branch-scoped overview", () => {
  const store = freshStore();
  const employee = store.employees.find((item) => item.id === "EMP-001");
  const overview = employeeOverview(store, {
    id: employee.id,
    role: ROLES.EMPLOYEE,
    label: `${employee.name} — Employee`,
  });
  assert.ok(overview.branch);
  assert.ok(overview.today);
});

/* ------------------------------------------------------------------------- */
/* 22 · the provider boundary holds                                           */
/* ------------------------------------------------------------------------- */

test("22 · no mock import leaks outside the provider boundary and its tests", () => {
  const srcDir = join(dirname(fileURLToPath(import.meta.url)), "..");
  const offenders = [];

  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
        continue;
      }
      if (!/\.(js|jsx|mjs)$/.test(entry)) continue;
      const relative = full.slice(srcDir.length + 1);
      /* The boundary itself, the fixtures, and the suites that exercise them. */
      if (
        relative.startsWith("mock/") ||
        relative.startsWith("services/providers/") ||
        relative.startsWith("__tests__/")
      ) {
        continue;
      }
      const source = readFileSync(full, "utf8");
      if (
        /(mock\/data|mock\/assets)/.test(source) ||
        /from\s+["']@\/mock\//.test(source)
      ) {
        offenders.push(relative);
      }
    }
  };
  walk(srcDir);

  assert.deepEqual(offenders, []);
});
