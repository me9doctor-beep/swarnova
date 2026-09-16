import ConsoleExperience from "../console/ConsoleExperience.jsx";
import { ROLES } from "../../features/authentication/roles.js";

/**
 * SUPER ADMIN LAYOUT — the enterprise command centre shell.
 *
 * Kept separate from AdminLayout because this experience carries its own
 * navigation (users, roles, branches, platform settings) and its own permission
 * surface — both configured in `layouts/console/config.js`. The chrome itself
 * is the shared ConsoleShell.
 *
 * Design direction: enterprise command centre. Route group: /super-admin/*
 */
export default function SuperAdminLayout() {
  return <ConsoleExperience role={ROLES.SUPER_ADMIN} />;
}
