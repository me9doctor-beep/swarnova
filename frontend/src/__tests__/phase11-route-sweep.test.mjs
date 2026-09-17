/**
 * PHASE 11 — ROUTE SWEEP
 * -----------------------------------------------------------------------------
 * Every customer and auth route renders without throwing, signed out AND
 * signed in — the safety net for the guards and the provider stack. Static
 * rendering runs no effects, so async hooks rest in their loading states;
 * the sweep asserts structure, not data:
 *
 *   · public storefront routes render for guests
 *   · the four auth routes render their forms for guests
 *   · /account/* renders nothing private for guests (the RequireCustomer bounce)
 *   · /account/* renders the salon for members
 *   · /login and /register bounce members (the GuestOnly redirect)
 *   · the sweep table cannot drift from `app/router.jsx` unnoticed — the
 *     route-matrix check below reads the real router source
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import CustomerLayout from "../layouts/customer/CustomerLayout.jsx";
import HomePage from "../pages/customer/home/HomePage.jsx";
import CollectionsPage from "../pages/customer/catalogue/CollectionsPage.jsx";
import CatalogueDetailPage from "../pages/customer/catalogue/CatalogueDetailPage.jsx";
import ProductsPage from "../pages/customer/catalogue/ProductsPage.jsx";
import ProductDetailPage from "../pages/customer/product/ProductDetailPage.jsx";
import AiStudioPage from "../pages/customer/ai-studio/AiStudioPage.jsx";
import VirtualTryOnPage from "../pages/customer/virtual-try-on/VirtualTryOnPage.jsx";
import CartPage from "../pages/customer/cart/CartPage.jsx";
import CustomerLoginPage from "../pages/customer/auth/CustomerLoginPage.jsx";
import CustomerRegisterPage from "../pages/customer/auth/CustomerRegisterPage.jsx";
import ForgotPasswordPage from "../pages/customer/auth/ForgotPasswordPage.jsx";
import ResetPasswordPage from "../pages/customer/auth/ResetPasswordPage.jsx";
import AccountLayout from "../pages/customer/account/AccountLayout.jsx";
import AccountOverviewPage from "../pages/customer/account/AccountOverviewPage.jsx";
import ProfilePage from "../pages/customer/account/ProfilePage.jsx";
import WishlistPage from "../pages/customer/account/WishlistPage.jsx";
import SavedDesignsPage from "../pages/customer/account/SavedDesignsPage.jsx";
import SavedTryOnsPage from "../pages/customer/account/SavedTryOnsPage.jsx";
import AddressesPage from "../pages/customer/account/AddressesPage.jsx";
import OrdersPage from "../pages/customer/account/OrdersPage.jsx";
import OrderDetailPage from "../pages/customer/account/OrderDetailPage.jsx";
import StaffLoginPage from "../pages/staff/StaffLoginPage.jsx";
import AppProviders from "../app/providers.jsx";
import CustomerAuthProvider from "../features/customer-auth/CustomerAuthProvider.jsx";
import RequireCustomer from "../features/customer-auth/RequireCustomer.jsx";
import GuestOnly from "../features/customer-auth/GuestOnly.jsx";

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

/** The sweep table — mirrors the customer section of `app/router.jsx`. */
function SweepRoutes() {
  return h(
    Routes,
    null,
    h(Route, { path: "/staff/login", element: h(StaffLoginPage) }),
    h(
      Route,
      { path: "/", element: h(CustomerLayout) },
      h(Route, { index: true, element: h(HomePage) }),
      h(Route, { path: "collections", element: h(CollectionsPage) }),
      h(Route, { path: "collections/:slug", element: h(CatalogueDetailPage, { scope: "collection" }) }),
      h(Route, { path: "category/:slug", element: h(CatalogueDetailPage, { scope: "category" }) }),
      h(Route, { path: "products", element: h(ProductsPage) }),
      h(Route, { path: "product/:id", element: h(ProductDetailPage) }),
      h(Route, { path: "ai-studio", element: h(AiStudioPage) }),
      h(Route, { path: "virtual-try-on", element: h(VirtualTryOnPage) }),
      h(Route, { path: "cart", element: h(CartPage) }),
      h(Route, { path: "login", element: h(GuestOnly, null, h(CustomerLoginPage)) }),
      h(Route, { path: "register", element: h(GuestOnly, null, h(CustomerRegisterPage)) }),
      h(Route, { path: "forgot-password", element: h(ForgotPasswordPage) }),
      h(Route, { path: "reset-password", element: h(ResetPasswordPage) }),
      h(
        Route,
        { path: "account", element: h(RequireCustomer, null, h(AccountLayout)) },
        h(Route, { index: true, element: h(AccountOverviewPage) }),
        h(Route, { path: "profile", element: h(ProfilePage) }),
        h(Route, { path: "wishlist", element: h(WishlistPage) }),
        h(Route, { path: "saved-designs", element: h(SavedDesignsPage) }),
        h(Route, { path: "saved-try-ons", element: h(SavedTryOnsPage) }),
        h(Route, { path: "addresses", element: h(AddressesPage) }),
        h(Route, { path: "orders", element: h(OrdersPage) }),
        h(Route, { path: "orders/:id", element: h(OrderDetailPage) })
      )
    )
  );
}

/**
 * Render one path through the sweep table. The app providers wrap the
 * router exactly as production does; only the customer session is pinned
 * (signed-out `null` or the `MEMBER`) so the sweep is deterministic.
 */
function renderPath(path, session) {
  return renderToStaticMarkup(
    h(
      AppProviders,
      null,
      h(
        CustomerAuthProvider,
        { initialSession: session },
        h(MemoryRouter, { initialEntries: [path] }, h(SweepRoutes))
      )
    )
  );
}

const PUBLIC_STOREFRONT = [
  "/",
  "/collections",
  "/collections/heritage-gold",
  "/category/rings",
  "/products",
  "/product/JWL-001",
  "/ai-studio",
  "/virtual-try-on",
  "/cart",
];

const AUTH_ROUTES = [
  ["/login", "Welcome back"],
  ["/register", "Create your account"],
  ["/forgot-password", "Forgot password"],
  ["/reset-password", "Choose a new password"],
];

const ACCOUNT_ROUTES = [
  "/account",
  "/account/profile",
  "/account/wishlist",
  "/account/saved-designs",
  "/account/saved-try-ons",
  "/account/addresses",
  "/account/orders",
  "/account/orders/ORD-2026-9302",
];

test("sweep · the public storefront renders for guests", () => {
  for (const path of PUBLIC_STOREFRONT) {
    const html = renderPath(path, null);
    assert.ok(html.length > 0, `${path} renders`);
  }
});

test("sweep · the four auth routes render their forms for guests", () => {
  for (const [path, marker] of AUTH_ROUTES) {
    const html = renderPath(path, null);
    assert.ok(html.includes(marker), `${path} shows its form`);
  }
});

test("sweep · the staff login still renders its own separate surface", () => {
  const html = renderPath("/staff/login", null);
  assert.ok(html.includes("Staff Sign In"));
});

test("sweep · guests see no account content behind the customer guard", () => {
  for (const path of ACCOUNT_ROUTES) {
    const html = renderPath(path, null);
    assert.ok(!html.includes("My Swarnova"), `${path} bounces its masthead`);
    assert.ok(!html.includes("Order History"), `${path} exposes no orders`);
  }
});

test("sweep · members see the salon and bounce off the guest-only routes", () => {
  const account = renderPath("/account", MEMBER);
  assert.ok(account.includes("My Swarnova"));

  for (const path of ACCOUNT_ROUTES) {
    const html = renderPath(path, MEMBER);
    assert.ok(html.includes("My Swarnova"), `${path} renders for members`);
  }

  /* A signed-in member never starts a second session on /login or /register. */
  assert.ok(!renderPath("/login", MEMBER).includes("Welcome back"));
  assert.ok(!renderPath("/register", MEMBER).includes("Create your account"));
});

test("sweep · the route matrix in app/router.jsx carries the Phase 11 surface", () => {
  const srcDir = join(dirname(fileURLToPath(import.meta.url)), "..");
  const routerSource = readFileSync(join(srcDir, "app/router.jsx"), "utf8");

  /* Public auth surface with its guest-only gates… */
  for (const path of ["login", "register", "forgot-password", "reset-password"]) {
    assert.ok(routerSource.includes(`path: "${path}"`), `router carries /${path}`);
  }
  assert.ok(routerSource.includes("<GuestOnly>"), "login/register sit behind GuestOnly");

  /* …and the guarded account surface. */
  assert.ok(routerSource.includes("<RequireCustomer>"), "account sits behind RequireCustomer");
  for (const path of [
    "profile",
    "wishlist",
    "saved-designs",
    "saved-try-ons",
    "addresses",
    "orders",
    "orders/:id",
  ]) {
    assert.ok(routerSource.includes(`path: "${path}"`), `router carries /account/${path}`);
  }

  /* Staff keeps its own login and boundaries — untouched by customer auth. */
  assert.ok(routerSource.includes("STAFF_LOGIN_PATH"), "staff login path survives");
  assert.ok(routerSource.includes("<RoleBoundary"), "staff RoleBoundary survives");
});
