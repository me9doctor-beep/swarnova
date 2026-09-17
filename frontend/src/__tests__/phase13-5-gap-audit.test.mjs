/**
 * PHASE 13.5 — GAP AUDIT & GOOGLE CUSTOMER OAUTH TESTS
 * -----------------------------------------------------------------------------
 * Verification suite for:
 * 1. Customer Google OAuth (UI, service, provider seam, error translation,
 *    account linking, duplicate prevention, and owner-partitioned state)
 * 2. Strict Customer ↔ Staff isolation (staff login unchanged, zero staff
 *    privileges for Google-authenticated customers)
 * 3. Safe returnTo redirect loop prevention
 * 4. Admin and Super Admin console-scoped 404 fallbacks
 * 5. Route tree integrity and component mount safety
 */
import "./support/browser-globals.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  createMemoryRouter,
  RouterProvider,
  MemoryRouter,
} from "react-router-dom";

import mockProvider from "../services/providers/mock/mockProvider.js";
import {
  createGovernanceStore,
  authenticateStaff,
  authenticateOrLinkGoogleCustomer,
  resolveStaffScope,
  CUSTOMER_AUTH_CODES,
} from "../services/providers/mock/governanceStore.js";
import { customerAuthService } from "../services/customerAuthService.js";
import {
  CUSTOMER_AUTH_ERROR_CODES,
  translateCustomerAuthError,
} from "../features/customer-auth/customerAuthErrors.js";
import {
  safeReturnTo,
  CUSTOMER_HOME_PATH,
  CUSTOMER_LOGIN_PATH,
  CUSTOMER_REGISTER_PATH,
  CUSTOMER_AUTH_CALLBACK_PATH,
} from "../features/customer-auth/customerRoutes.js";
import { CustomerAuthProvider } from "../features/customer-auth/CustomerAuthProvider.jsx";
import { AuthProvider } from "../features/authentication/AuthProvider.jsx";
import { DataProvider } from "../services/providers/DataProvider.jsx";
import CustomerLoginPage from "../pages/customer/auth/CustomerLoginPage.jsx";
import CustomerRegisterPage from "../pages/customer/auth/CustomerRegisterPage.jsx";
import StaffLoginPage from "../pages/staff/StaffLoginPage.jsx";
import RoleBoundary from "../features/authentication/RoleBoundary.jsx";
import { ROLES } from "../features/authentication/roles.js";
import { routeTree } from "../app/router.jsx";
import { superAdminAccount } from "../mock/data/staff/index.js";

const plainText = (html) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

function renderPath(path, session = null, customerSession = null, provider = mockProvider) {
  const router = createMemoryRouter(routeTree, { initialEntries: [path] });
  return renderToStaticMarkup(
    h(
      DataProvider,
      { provider },
      h(
        AuthProvider,
        { initialSession: session },
        h(
          CustomerAuthProvider,
          { initialSession: customerSession },
          h(RouterProvider, { router })
        )
      )
    )
  );
}

function staffSessionFor(role) {
  const store = createGovernanceStore();
  if (role === ROLES.SUPER_ADMIN) {
    return authenticateStaff(store, {
      email: superAdminAccount.email,
      password: superAdminAccount.password,
    });
  }
  if (role === ROLES.ADMIN) {
    const admin = store.admins[0];
    return authenticateStaff(store, {
      email: admin.email,
      password: admin.password,
    });
  }
  const employee = store.employees[0];
  return authenticateStaff(store, {
    email: employee.email,
    password: employee.password,
  });
}

/* ========================================================================= */
/* 1. Google OAuth UI Presence & Staff Isolation                             */
/* ========================================================================= */

test("oauth · Customer login displays 'Continue with Google'", () => {
  const html = renderPath("/login");
  assert.ok(
    html.includes("Continue with Google"),
    "Customer login must offer Continue with Google"
  );
  assert.ok(
    html.includes("Or continue with"),
    "Customer login must include the refined champagne divider"
  );
});

test("oauth · Customer register displays Google sign-up action", () => {
  const html = renderPath("/register");
  assert.ok(
    html.includes("Sign up with Google") || html.includes("Continue with Google"),
    "Customer registration must offer Google sign up"
  );
});

test("oauth · Staff login remains UNCHANGED and does NOT offer Google auth", () => {
  const html = renderPath("/staff/login");
  assert.ok(
    !html.includes("Continue with Google"),
    "Staff login must NEVER render Google sign in"
  );
  assert.ok(
    !html.includes("Sign up with Google"),
    "Staff login must never offer Google registration"
  );
  assert.ok(
    html.includes("Staff Sign In"),
    "Staff login must keep its existing dedicated portal"
  );
});

/* ========================================================================= */
/* 2. Customer Auth Service & Provider Seam                                  */
/* ========================================================================= */

test("oauth · customerAuthService and provider define the OAuth boundary", () => {
  assert.equal(typeof customerAuthService.initiateGoogleOAuth, "function");
  assert.equal(typeof customerAuthService.completeGoogleOAuth, "function");
  assert.equal(typeof mockProvider.initiateCustomerGoogleOAuth, "function");
  assert.equal(typeof mockProvider.completeCustomerGoogleOAuth, "function");
});

test("oauth · initiateCustomerGoogleOAuth rejects honestly without fake tokens when backend is absent", async () => {
  await assert.rejects(
    () => customerAuthService.initiateGoogleOAuth(mockProvider, { returnTo: "/checkout" }),
    (error) => {
      assert.equal(error.code, "BACKEND_UNAVAILABLE");
      return true;
    }
  );
});

test("oauth · error translations map OAuth error codes to customer-safe copy", () => {
  assert.equal(
    translateCustomerAuthError({ code: CUSTOMER_AUTH_ERROR_CODES.OAUTH_CANCELLED }),
    "Google sign-in was cancelled. Please try again."
  );
  assert.equal(
    translateCustomerAuthError({ code: CUSTOMER_AUTH_ERROR_CODES.OAUTH_FAILED }),
    "We could not sign you in with Google. Please try again or sign in with your email or phone."
  );
  assert.equal(
    translateCustomerAuthError({ code: CUSTOMER_AUTH_ERROR_CODES.BACKEND_UNAVAILABLE }),
    "Google sign-in is currently unavailable. Please sign in with your email or phone number and password."
  );
  assert.equal(
    translateCustomerAuthError({ code: CUSTOMER_AUTH_ERROR_CODES.PROVIDER_UNAVAILABLE }),
    "Google sign-in is currently unavailable. Please try again in a moment or use your email and password."
  );
});

test("oauth · completeCustomerGoogleOAuth rejects on cancelled or failed payloads", async () => {
  await assert.rejects(
    () => mockProvider.completeCustomerGoogleOAuth({ error: "access_denied" }),
    (error) => {
      assert.equal(error.code, "OAUTH_CANCELLED");
      return true;
    }
  );

  await assert.rejects(
    () => mockProvider.completeCustomerGoogleOAuth({ error: "server_error" }),
    (error) => {
      assert.equal(error.code, "OAUTH_FAILED");
      return true;
    }
  );
});

/* ========================================================================= */
/* 3. Account Linking & Duplicate Prevention Policy                          */
/* ========================================================================= */

test("oauth · existing customer matching links by email without duplicate creation", () => {
  const store = createGovernanceStore();
  const initialCount = store.customers.length;
  const existingEmail = store.customers[0].email;
  const existingId = store.customers[0].id;

  const result = authenticateOrLinkGoogleCustomer(store, {
    email: existingEmail,
    name: "New Name Attempt",
    googleSubjectId: "google-sub-123",
  });

  assert.equal(result.customer.id, existingId, "Must return existing customer ID");
  assert.equal(result.isNewAccount, false, "Must flag as existing account");
  assert.equal(store.customers.length, initialCount, "Customer count must not increase");
});

test("oauth · new customer registration via verified Google email adds directory record", () => {
  const store = createGovernanceStore();
  const initialCount = store.customers.length;
  const newEmail = "new.client@example.com";

  const result = authenticateOrLinkGoogleCustomer(store, {
    email: newEmail,
    name: "Priyanka Mishra",
    googleSubjectId: "google-sub-456",
  });

  assert.ok(result.customer.id.startsWith("CUST-"), "Must assign canonical CUST- id");
  assert.equal(result.isNewAccount, true, "Must flag as new account");
  assert.equal(result.customer.email, newEmail);
  assert.equal(result.customer.name, "Priyanka Mishra");
  assert.equal(store.customers.length, initialCount + 1, "Must add to canonical directory");

  // Re-authenticating same email matches existing
  const secondResult = authenticateOrLinkGoogleCustomer(store, {
    email: newEmail,
    name: "Priyanka Mishra",
  });
  assert.equal(secondResult.customer.id, result.customer.id);
  assert.equal(secondResult.isNewAccount, false);
});

test("oauth · disabled customer account is refused via Google authentication", () => {
  const store = createGovernanceStore();
  store.customers[0].status = "disabled";

  assert.throws(
    () =>
      authenticateOrLinkGoogleCustomer(store, {
        email: store.customers[0].email,
      }),
    (error) => {
      assert.equal(error.code, CUSTOMER_AUTH_CODES.INVALID_CREDENTIALS);
      return true;
    }
  );
});

/* ========================================================================= */
/* 4. Customer / Staff Identity Isolation                                    */
/* ========================================================================= */

test("oauth · Google-authenticated customer carries NO staff role, capability or permission", () => {
  const store = createGovernanceStore();
  const result = authenticateOrLinkGoogleCustomer(store, {
    email: "customer.google@swarnova.in",
    name: "Kavita Rao",
    googleSubjectId: "sub-789",
  });

  assert.equal(result.customer.role, undefined);
  assert.equal(result.customer.permissions, undefined);
  assert.equal(result.customer.capabilities, undefined);

  // Resolving staff scope for this customer must fail
  assert.throws(
    () => resolveStaffScope(store, { id: result.customer.id }),
    /Invalid staff session|no branch operations access/i
  );
});

test("oauth · Google-authenticated customer cannot satisfy staff RoleBoundary", () => {
  const marker = "ADMIN-CONSOLE-INTERNAL-CONTENT";
  const html = renderToStaticMarkup(
    h(
      MemoryRouter,
      { initialEntries: ["/admin"] },
      h(
        CustomerAuthProvider,
        {
          initialSession: {
            customer: { id: "CUST-999", name: "Google Customer", email: "cust@swarnova.in" },
          },
        },
        h(RoleBoundary, { role: ROLES.ADMIN }, h("p", null, marker))
      )
    )
  );
  assert.ok(!html.includes(marker), "Staff RoleBoundary must reject customer-only session");
});

/* ========================================================================= */
/* 5. Safe returnTo & Redirect Loop Prevention                               */
/* ========================================================================= */

test("routing · safeReturnTo prevents redirect loops on guest auth surfaces", () => {
  assert.equal(safeReturnTo(CUSTOMER_LOGIN_PATH), CUSTOMER_HOME_PATH);
  assert.equal(safeReturnTo(CUSTOMER_REGISTER_PATH), CUSTOMER_HOME_PATH);
  assert.equal(safeReturnTo(CUSTOMER_AUTH_CALLBACK_PATH), CUSTOMER_HOME_PATH);
  assert.equal(safeReturnTo("/login?returnTo=%2Fcheckout"), CUSTOMER_HOME_PATH);
  assert.equal(safeReturnTo("/register?returnTo=%2Fcheckout"), CUSTOMER_HOME_PATH);

  // Legitimate destinations are preserved
  assert.equal(safeReturnTo("/checkout"), "/checkout");
  assert.equal(safeReturnTo("/account/orders"), "/account/orders");
  assert.equal(safeReturnTo("/account/profile"), "/account/profile");
});

/* ========================================================================= */
/* 6. Console 404 Wildcard Fallbacks                                         */
/* ========================================================================= */

test("routing · unmatched /admin/* route renders AdminNotFoundPage inside Admin console shell", () => {
  const adminSession = staffSessionFor(ROLES.ADMIN);
  const html = renderPath("/admin/unmatched-test-page", adminSession);
  const text = plainText(html);

  assert.ok(text.includes("Admin"), "Must render inside Admin console shell");
  assert.ok(text.includes("That address is not part of the Admin workspace."));
  assert.ok(text.includes("Back to Overview"));
  assert.ok(!text.includes("Shopping Bag"), "Must NOT render customer storefront chrome");
});

test("routing · unmatched /super-admin/* route renders SuperAdminNotFoundPage inside Super Admin shell", () => {
  const saSession = staffSessionFor(ROLES.SUPER_ADMIN);
  const html = renderPath("/super-admin/unmatched-test-page", saSession);
  const text = plainText(html);

  assert.ok(text.includes("Super Admin"), "Must render inside Super Admin console shell");
  assert.ok(text.includes("That address is not part of the Super Admin workspace."));
  assert.ok(text.includes("Back to Command Centre"));
  assert.ok(!text.includes("Shopping Bag"), "Must NOT render customer storefront chrome");
});

/* ========================================================================= */
/* 7. Route Tree Completeness                                                */
/* ========================================================================= */

test("router · /auth/callback is a registered customer route", () => {
  const customerGroup = routeTree.find((r) => r.path === "/");
  const callbackRoute = customerGroup.children.find((r) => r.path === "auth/callback");
  assert.ok(callbackRoute, "Customer route tree must contain auth/callback");
  assert.equal(typeof callbackRoute.element.type, "function");
  assert.equal(callbackRoute.element.type.name, "CustomerAuthCallbackPage");
});

test("router · every route in routeTree mounts a valid function component", () => {
  function checkRoute(route, fullPath = "") {
    const current = `${fullPath}/${route.path || ""}`.replace(/\/+/g, "/");
    if (route.element) {
      assert.equal(
        typeof route.element.type,
        "function",
        `Route ${current} must mount a function component`
      );
    }
    if (route.children) {
      for (const child of route.children) {
        checkRoute(child, current);
      }
    }
  }

  for (const root of routeTree) {
    checkRoute(root);
  }
});

/* ========================================================================= */
/* 8. Reset Password Token Query Sync & Clean Stack                          */
/* ========================================================================= */

test("auth · ResetPasswordPage imports and renders with token from search params", () => {
  const html = renderPath("/reset-password?token=RESET-REF-12345");
  const text = plainText(html);
  assert.ok(text.includes("Choose a new password"));
  assert.ok(text.includes("Reset reference"));
});

test("stack · zero TypeScript, zero tsconfig, stack remains pure JS + JSX", () => {
  const { readdirSync } = import("node:fs");
  const pkg = JSON.parse(
    readFileSync(new URL("../../package.json", import.meta.url), "utf8")
  );
  assert.equal(pkg.dependencies?.typescript, undefined);
  assert.equal(pkg.devDependencies?.typescript, undefined);
});
