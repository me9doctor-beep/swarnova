import { createBrowserRouter } from "react-router-dom";

import CustomerLayout from "../layouts/customer/CustomerLayout.jsx";
import AdminLayout from "../layouts/admin/AdminLayout.jsx";
import SuperAdminLayout from "../layouts/super-admin/SuperAdminLayout.jsx";
import EmployeeLayout from "../layouts/employee/EmployeeLayout.jsx";

import HomePage from "../pages/customer/home/HomePage.jsx";
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
 *   Customer      /            /collections  /product/:id  /ai-studio
 *                 /virtual-try-on  /stores   /cart  /checkout  /account
 *   Admin         /admin       /admin/products   /admin/inventory
 *                 /admin/orders    /admin/customers
 *   Super Admin   /super-admin /super-admin/users /super-admin/roles
 *                 /super-admin/branches
 *   Employee      /employee    /employee/sales   /employee/customers
 *                 /employee/inventory
 *
 * The `/products`, `/inventory`, … children above are planned: only the routes
 * required to prove the layout architecture are registered in Phase 0.
 */
const router = createBrowserRouter([
  {
    path: "/",
    element: <CustomerLayout />,
    children: [
      { index: true, element: <HomePage /> },
      /* Future customer routes nest here: collections, product/:id, cart, … */
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
    children: [{ index: true, element: <AdminDashboardPage /> }],
  },
  {
    path: "/super-admin",
    element: (
      <RoleBoundary role={ROLES.SUPER_ADMIN}>
        <SuperAdminLayout />
      </RoleBoundary>
    ),
    children: [{ index: true, element: <SuperAdminDashboardPage /> }],
  },
  {
    path: "/employee",
    element: (
      <RoleBoundary role={ROLES.EMPLOYEE}>
        <EmployeeLayout />
      </RoleBoundary>
    ),
    children: [{ index: true, element: <EmployeeDashboardPage /> }],
  },
]);

export default router;
