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

import StaffLoginPage from "../pages/staff/StaffLoginPage.jsx";
import AdminDashboardPage from "../pages/admin/dashboard/AdminDashboardPage.jsx";
import AdminProductsPage from "../pages/admin/products/AdminProductsPage.jsx";
import AdminProductDetailPage from "../pages/admin/products/AdminProductDetailPage.jsx";
import AdminOrdersPage from "../pages/admin/orders/AdminOrdersPage.jsx";
import AdminOrderDetailPage from "../pages/admin/orders/AdminOrderDetailPage.jsx";
import AdminCustomersPage from "../pages/admin/customers/AdminCustomersPage.jsx";
import AdminCustomerDetailPage from "../pages/admin/customers/AdminCustomerDetailPage.jsx";
import AdminInventoryPage from "../pages/admin/inventory/AdminInventoryPage.jsx";
import AdminHomepagePage from "../pages/admin/content/AdminHomepagePage.jsx";
import AdminCampaignsPage from "../pages/admin/content/AdminCampaignsPage.jsx";
import AdminCollectionsPage from "../pages/admin/content/AdminCollectionsPage.jsx";
import AdminBranchesPage from "../pages/admin/organization/AdminBranchesPage.jsx";
import AdminEmployeesPage from "../pages/admin/organization/AdminEmployeesPage.jsx";
import AdminReportsPage from "../pages/admin/reports/AdminReportsPage.jsx";
import SuperAdminDashboardPage from "../pages/super-admin/dashboard/SuperAdminDashboardPage.jsx";
import GovernanceProductsPage from "../pages/super-admin/products/ProductsPage.jsx";
import GovernanceProductDetailPage from "../pages/super-admin/products/ProductDetailPage.jsx";
import GovernanceProductEditorPage from "../pages/super-admin/products/ProductEditorPage.jsx";
import MediaLibraryPage from "../pages/super-admin/media/MediaLibraryPage.jsx";
import CategoriesPage from "../pages/super-admin/catalogue/CategoriesPage.jsx";
import CollectionsGovernancePage from "../pages/super-admin/catalogue/CollectionsPage.jsx";
import HomepagePage from "../pages/super-admin/content/HomepagePage.jsx";
import CampaignsPage from "../pages/super-admin/content/CampaignsPage.jsx";
import AiTryOnGovernancePage from "../pages/super-admin/platform/AiTryOnGovernancePage.jsx";
import GoldRatePage from "../pages/super-admin/platform/GoldRatePage.jsx";
import BranchesPage from "../pages/super-admin/organization/BranchesPage.jsx";
import AdminsPage from "../pages/super-admin/organization/AdminsPage.jsx";
import EmployeesPage from "../pages/super-admin/organization/EmployeesPage.jsx";
import RolesPage from "../pages/super-admin/governance/RolesPage.jsx";
import AuditLogsPage from "../pages/super-admin/governance/AuditLogsPage.jsx";
import SettingsPage from "../pages/super-admin/governance/SettingsPage.jsx";
import EmployeeDashboardPage from "../pages/employee/dashboard/EmployeeDashboardPage.jsx";
import NotFoundPage from "../pages/NotFoundPage.jsx";

import RoleBoundary from "../features/authentication/RoleBoundary.jsx";
import RequireCapability from "../features/authentication/RequireCapability.jsx";
import { ROLES, STAFF_LOGIN_PATH } from "../features/authentication/roles.js";
import { CAPABILITIES } from "../features/authentication/capabilities.js";

/**
 * ROUTE TABLE — all routes for all four experiences live here.
 *
 * Structure: one route group per experience, each wrapped in its own layout and
 * (for the management experiences) in a RoleBoundary. Child routes are relative
 * and are added as their phases land — no route exists before its screen does.
 *
 *   Staff login   /staff/login  — ONE shared login for every staff role;
 *                 the account resolves the role and its console:
 *                 SUPER_ADMIN → /super-admin · ADMIN → /admin ·
 *                 EMPLOYEE → /employee
 *
 *   Customer      /            /collections  /collections/:slug
 *                 /category/:slug  /products  /product/:id  /ai-studio
 *                 /virtual-try-on  /cart
 *                 /account     /account/profile  /account/wishlist
 *                 /account/saved-designs  /account/saved-try-ons
 *                 /account/addresses  /account/orders  /account/orders/:id
 *                 (planned: /stores  /checkout)
 *   Admin         /admin       business operations dashboard
 *                 /admin/products[/:id]  /admin/orders[/:id]
 *                 /admin/customers[/:id] /admin/inventory
 *                 /admin/homepage  /admin/campaigns  /admin/collections
 *                 /admin/branches  /admin/employees  /admin/reports
 *   Super Admin   /super-admin               command centre
 *                 /super-admin/products[/new|/:id|/:id/edit]
 *                 /super-admin/media         /super-admin/categories
 *                 /super-admin/collections   /super-admin/homepage
 *                 /super-admin/campaigns     /super-admin/ai-try-on
 *                 /super-admin/gold-rate     /super-admin/branches
 *                 /super-admin/admins        /super-admin/employees
 *                 /super-admin/roles         /super-admin/audit-logs
 *                 /super-admin/settings
 *   Employee      /employee    /employee/sales   /employee/customers
 *                 /employee/inventory
 */
export const routeTree = [
  {
    path: STAFF_LOGIN_PATH,
    element: <StaffLoginPage />,
  },
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
      {
        path: "products",
        element: (
          <RequireCapability capability={CAPABILITIES.CATALOGUE_VIEW}>
            <AdminProductsPage />
          </RequireCapability>
        ),
        handle: { crumb: "Products" },
      },
      {
        path: "products/:id",
        element: (
          <RequireCapability capability={CAPABILITIES.CATALOGUE_VIEW}>
            <AdminProductDetailPage />
          </RequireCapability>
        ),
        handle: { crumb: "Product" },
      },
      {
        path: "orders",
        element: (
          <RequireCapability capability={CAPABILITIES.ORDERS_VIEW}>
            <AdminOrdersPage />
          </RequireCapability>
        ),
        handle: { crumb: "Orders" },
      },
      {
        path: "orders/:id",
        element: (
          <RequireCapability capability={CAPABILITIES.ORDERS_VIEW}>
            <AdminOrderDetailPage />
          </RequireCapability>
        ),
        handle: { crumb: "Order" },
      },
      {
        path: "customers",
        element: (
          <RequireCapability capability={CAPABILITIES.ORDERS_VIEW}>
            <AdminCustomersPage />
          </RequireCapability>
        ),
        handle: { crumb: "Customers" },
      },
      {
        path: "customers/:id",
        element: (
          <RequireCapability capability={CAPABILITIES.ORDERS_VIEW}>
            <AdminCustomerDetailPage />
          </RequireCapability>
        ),
        handle: { crumb: "Customer" },
      },
      {
        path: "inventory",
        element: (
          <RequireCapability capability={CAPABILITIES.INVENTORY_VIEW}>
            <AdminInventoryPage />
          </RequireCapability>
        ),
        handle: { crumb: "Inventory" },
      },
      {
        path: "homepage",
        element: (
          <RequireCapability capability={CAPABILITIES.CONTENT_VIEW}>
            <AdminHomepagePage />
          </RequireCapability>
        ),
        handle: { crumb: "Homepage" },
      },
      {
        path: "campaigns",
        element: (
          <RequireCapability capability={CAPABILITIES.CONTENT_VIEW}>
            <AdminCampaignsPage />
          </RequireCapability>
        ),
        handle: { crumb: "Campaigns" },
      },
      {
        path: "collections",
        element: (
          <RequireCapability capability={CAPABILITIES.CONTENT_VIEW}>
            <AdminCollectionsPage />
          </RequireCapability>
        ),
        handle: { crumb: "Collections" },
      },
      {
        path: "branches",
        element: (
          <RequireCapability capability={CAPABILITIES.BRANCHES_VIEW}>
            <AdminBranchesPage />
          </RequireCapability>
        ),
        handle: { crumb: "Branches" },
      },
      {
        path: "employees",
        element: (
          <RequireCapability capability={CAPABILITIES.STAFF_MANAGE}>
            <AdminEmployeesPage />
          </RequireCapability>
        ),
        handle: { crumb: "Employees" },
      },
      {
        path: "reports",
        element: (
          <RequireCapability capability={CAPABILITIES.REPORTS_VIEW}>
            <AdminReportsPage />
          </RequireCapability>
        ),
        handle: { crumb: "Reports" },
      },
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
      { path: "products", element: <GovernanceProductsPage />, handle: { crumb: "Products" } },
      { path: "products/new", element: <GovernanceProductEditorPage />, handle: { crumb: "New Product" } },
      { path: "products/:id", element: <GovernanceProductDetailPage />, handle: { crumb: "Product" } },
      { path: "products/:id/edit", element: <GovernanceProductEditorPage />, handle: { crumb: "Edit Product" } },
      { path: "media", element: <MediaLibraryPage />, handle: { crumb: "Media" } },
      { path: "categories", element: <CategoriesPage />, handle: { crumb: "Categories" } },
      { path: "collections", element: <CollectionsGovernancePage />, handle: { crumb: "Collections" } },
      { path: "homepage", element: <HomepagePage />, handle: { crumb: "Homepage" } },
      { path: "campaigns", element: <CampaignsPage />, handle: { crumb: "Campaigns" } },
      { path: "ai-try-on", element: <AiTryOnGovernancePage />, handle: { crumb: "AI & Try-On" } },
      { path: "gold-rate", element: <GoldRatePage />, handle: { crumb: "Gold Rate" } },
      { path: "branches", element: <BranchesPage />, handle: { crumb: "Branches" } },
      { path: "admins", element: <AdminsPage />, handle: { crumb: "Admins" } },
      { path: "employees", element: <EmployeesPage />, handle: { crumb: "Employees" } },
      { path: "roles", element: <RolesPage />, handle: { crumb: "Roles & Permissions" } },
      { path: "audit-logs", element: <AuditLogsPage />, handle: { crumb: "Audit Logs" } },
      { path: "settings", element: <SettingsPage />, handle: { crumb: "Settings" } },
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
