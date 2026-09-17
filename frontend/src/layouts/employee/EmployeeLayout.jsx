import ConsoleExperience from "../console/ConsoleExperience.jsx";
import { ROLES } from "../../features/authentication/roles.js";
import { useAuth } from "../../features/authentication/useAuth.js";

/**
 * EMPLOYEE LAYOUT — the counter-side operational shell.
 *
 * The Employee experience optimises for speed at the counter (sales, customer
 * lookup, stock enquiry), so it keeps its own navigation and entry point in
 * `layouts/console/config.js` while sharing the ConsoleShell chrome with the
 * other two management experiences.
 *
 * The branch named next to the experience label comes from the session and is
 * DISPLAY ONLY — the provider resolves the employee's real scope from their
 * account on every call, so nothing rendered here can widen access.
 *
 * Design direction: fast operational. Route group: /employee/*
 */
export default function EmployeeLayout() {
  const { user } = useAuth();

  return (
    <ConsoleExperience
      role={ROLES.EMPLOYEE}
      contextLabel={user?.branchName ?? null}
    />
  );
}
