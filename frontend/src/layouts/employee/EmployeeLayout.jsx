import { Outlet } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";
import ConsoleShell from "../../components/layout/ConsoleShell.jsx";
import { ROLES, roleLabel } from "../../features/authentication/roles.js";
import { useAuth } from "../../features/authentication/useAuth.js";

/**
 * EMPLOYEE LAYOUT — the counter-side operational shell.
 *
 * The Employee experience will optimise for speed at the counter (sales,
 * customers, stock lookup), which is why it keeps its own navigation here even
 * though it shares the ConsoleShell chrome.
 *
 * Design direction: fast operational. Route group: /employee/*
 */
const navigation = [
  { label: "Overview", to: "/employee", end: true, icon: LayoutDashboard },
];

export default function EmployeeLayout() {
  const { isAuthenticated } = useAuth();

  return (
    <ConsoleShell
      experience="Employee"
      homePath="/employee"
      navLabel="Employee navigation"
      items={navigation}
      meta={[
        { label: "Role", value: roleLabel(ROLES.EMPLOYEE) },
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
