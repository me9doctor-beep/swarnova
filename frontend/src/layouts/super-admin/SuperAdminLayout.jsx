import { Outlet } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";
import ConsoleShell from "../../components/layout/ConsoleShell.jsx";
import { ROLES, roleLabel } from "../../features/authentication/roles.js";
import { useAuth } from "../../features/authentication/useAuth.js";

/**
 * SUPER ADMIN LAYOUT — the enterprise command centre shell.
 *
 * Kept separate from AdminLayout because this experience will carry its own
 * navigation (users, roles, branches, platform settings) and its own permission
 * surface. Both render through the shared ConsoleShell primitives.
 *
 * Design direction: enterprise command centre. Route group: /super-admin/*
 */
const navigation = [
  { label: "Command Centre", to: "/super-admin", end: true, icon: LayoutDashboard },
];

export default function SuperAdminLayout() {
  const { isAuthenticated } = useAuth();

  return (
    <ConsoleShell
      experience="Super Admin"
      homePath="/super-admin"
      navLabel="Super admin navigation"
      items={navigation}
      meta={[
        { label: "Role", value: roleLabel(ROLES.SUPER_ADMIN) },
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
