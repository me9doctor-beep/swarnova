import ConsoleExperience from "../console/ConsoleExperience.jsx";
import { ROLES } from "../../features/authentication/roles.js";

/**
 * EMPLOYEE LAYOUT — the counter-side operational shell.
 *
 * The Employee experience optimises for speed at the counter (sales, customer
 * lookup, stock enquiry), so it keeps its own navigation and entry point in
 * `layouts/console/config.js` while sharing the ConsoleShell chrome.
 *
 * Design direction: fast operational. Route group: /employee/*
 */
export default function EmployeeLayout() {
  return <ConsoleExperience role={ROLES.EMPLOYEE} />;
}
