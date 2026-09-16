import ConsoleExperience from "../console/ConsoleExperience.jsx";
import { ROLES } from "../../features/authentication/roles.js";

/**
 * ADMIN LAYOUT — the operational workspace shell for the Admin experience.
 *
 * Admin owns its navigation, brand label and home route in
 * `layouts/console/config.js`; the chrome is the shared ConsoleShell, so this
 * file stays a thin composition point where Admin-only providers and route
 * structure can be added without touching the other experiences.
 *
 * Design direction: premium enterprise. Route group: /admin/*
 */
export default function AdminLayout() {
  return <ConsoleExperience role={ROLES.ADMIN} />;
}
