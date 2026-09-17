import { createBrowserRouter } from "react-router-dom";

import CustomerLayout from "../layouts/customer/CustomerLayout.jsx";
import AdminLayout from "../layouts/admin/AdminLayout.jsx";
import SuperAdminLayout from "../layouts/super-admin/SuperAdminLayout.jsx";
import EmployeeLayout from "../layouts/employee/EmployeeLayout.jsx";

import HomePage from "../pages/customer/home/HomePage.jsx";
import CollectionsPage from "../pages/customer/catalogue/CollectionsPage.jsx";
import CatalogueDetailPage from "../pages/customer/catalogue/CatalogueDetailPage.jsx";
import ProductsPage from "../pages/customer/catalogue/ProductsPage.jsx";
import ProductDetailPage from "../pages/customer/product/ProductDetailPage.jsx";
import AiStudioPage from "../pages/customer/ai-studio/AiStudioPage.jsx";
import VirtualTryOnPage from "../pages/customer/virtual-try-on/VirtualTryOnPage.jsx";
import CartPage from "../pages/customer/cart/CartPage.jsx";

import AccountLayout from "../pages/customer/account/AccountLayout.jsx";
import AccountOverviewPage from "../pages/customer/account/AccountOverviewPage.jsx";
import ProfilePage from "../pages/customer/account/ProfilePage.jsx";
import WishlistPage from "../pages/customer/account/WishlistPage.jsx";
import SavedDesignsPage from "../pages/customer/account/SavedDesignsPage.jsx";
import SavedTryOnsPage from "../pages/customer/account/SavedTryOnsPage.jsx";
import AddressesPage from "../pages/customer/account/AddressesPage.jsx";
import OrdersPage from "../pages/customer/account/OrdersPage.jsx";
import OrderDetailPage from "../pages/customer/account/OrderDetailPage.jsx";

import AdminDashboardPage from "../pages/admin/dashboard/AdminDashboardPage.jsx";
import SuperAdminDashboardPage from "../pages/super-admin/dashboard/SuperAdminDashboardPage.jsx";
import EmployeeDashboardPage from "../pages/employee/dashboard/EmployeeDashboardPage.jsx";
import NotFoundPage from "../pages/NotFoundPage.jsx";

import RoleBoundary from "../features/authentication/RoleBoundary.jsx";
import { ROLES } from "../features/authentication/roles.js";

/**
 * ROUTE TABLE — all routes for all four experiences live here.
 *
 * Structure: one route group per experience, each wrapped in its own layout and
 * (for the management experiences) in a RoleBoundary. Child routes are relative
 * and are added as their phases land — no route exists before its screen does.
 *
 *   Customer      /            /collections  /collections/:slug
 *                 /category/:slug  /products  /product/:id  /ai-studio
 *                 /virtual-try-on  /cart
 *                 /account     /account/profile  /account/wishlist
 *                 /account/saved-designs  /account/saved-try-ons
 *                 /account/addresses  /account/orders  /account/orders/:id
 *                 (planned: /stores  /checkout)
 *   Admin         /admin       /admin/products   /admin/inventory
 *                 /admin/orders    /admin/customers
 *   Super Admin   /super-admin /super-admin/users /super-admin/roles
 *                 /super-admin/branches
 *   Employee      /employee    /employee/sales   /employee/customers
 *                 /employee/inventory
 */
export const routeTree = [
  {
    path: "/",
    element: <CustomerLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "collections", element: <CollectionsPage /> },
      { path: "collections/:slug", element: <CatalogueDetailPage scope="collection" /> },
      { path: "category/:slug", element: <CatalogueDetailPage scope="category" /> },
      { path: "products", element: <ProductsPage /> },
      { path: "product/:id", element: <ProductDetailPage /> },
      { path: "ai-studio", element: <AiStudioPage /> },
      { path: "virtual-try-on", element: <VirtualTryOnPage /> },
      { path: "cart", element: <CartPage /> },
      {
        path: "account",
        element: <AccountLayout />,
        children: [
          { index: true, element: <AccountOverviewPage /> },
          { path: "profile", element: <ProfilePage /> },
          { path: "wishlist", element: <WishlistPage /> },
          { path: "saved-designs", element: <SavedDesignsPage /> },
          { path: "saved-try-ons", element: <SavedTryOnsPage /> },
          { path: "addresses", element: <AddressesPage /> },
          { path: "orders", element: <OrdersPage /> },
          { path: "orders/:id", element: <OrderDetailPage /> },
        ],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
  {
    path: "/admin",
    element: (
      <RoleBoundary role={ROLES.ADMIN}>
        <AdminLayout />
      </RoleBoundary>
    ),
    children: [
      { index: true, element: <AdminDashboardPage />, handle: { crumb: "Overview" } },
    ],
  },
  {
    path: "/super-admin",
    element: (
      <RoleBoundary role={ROLES.SUPER_ADMIN}>
        <SuperAdminLayout />
      </RoleBoundary>
    ),
    children: [
      {
        index: true,
        element: <SuperAdminDashboardPage />,
        handle: { crumb: "Command Centre" },
      },
    ],
  },
  {
    path: "/employee",
    element: (
      <RoleBoundary role={ROLES.EMPLOYEE}>
        <EmployeeLayout />
      </RoleBoundary>
    ),
    children: [
      { index: true, element: <EmployeeDashboardPage />, handle: { crumb: "Overview" } },
    ],
  },
];

const router = createBrowserRouter(routeTree);

export default router;
