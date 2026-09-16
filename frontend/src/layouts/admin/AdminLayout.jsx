import { Outlet } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";
import ConsoleShell from "../../components/layout/ConsoleShell.jsx";
import { ROLES, roleLabel } from "../../features/authentication/roles.js";
import { useAuth } from "../../features/authentication/useAuth.js";

/**
 * ADMIN LAYOUT — the operational workspace shell for the Admin experience.
 *
 * Admin and Super Admin intentionally keep separate navigation and permission
 * surfaces: this file owns Admin's. Modules are appended here as their phases
 * land — nothing is registered before its route exists.
 *
 * Design direction: premium enterprise. Route group: /admin/*
 */
const navigation = [
  { label: "Overview", to: "/admin", end: true, icon: LayoutDashboard },
];

export default function AdminLayout() {
  const { isAuthenticated } = useAuth();

  return (
    <ConsoleShell
      experience="Admin"
      homePath="/admin"
      navLabel="Admin navigation"
      items={navigation}
      meta={[
        { label: "Role", value: roleLabel(ROLES.ADMIN) },
        {
          label: "Session",
          value: isAuthenticated ? "Connected" : "Not Connected",
        },
      ]}
    >
      <Outlet />
    </ConsoleShell>
  );
}
