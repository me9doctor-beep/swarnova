import { Outlet } from "react-router-dom";
import PropTypes from "prop-types";
import ConsoleShell from "../../components/layout/ConsoleShell.jsx";
import { ROLES, roleLabel } from "../../features/authentication/roles.js";
import { useAuth } from "../../features/authentication/useAuth.js";
import { CONSOLE_CONFIG } from "./config.js";

/**
 * CONSOLE EXPERIENCE — resolves one management experience's configuration and
 * session, then renders the shared ConsoleShell around the route's page.
 *
 * Admin, Super Admin and Employee each keep their own layout file as the
 * route-level composition point; this keeps the wiring (config lookup, role
 * label, session) written once instead of three times.
 */
const EXPERIENCE_ROLES = [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.EMPLOYEE];

export default function ConsoleExperience({ role }) {
  const { user, signOut } = useAuth();
  const { label, homePath, navigation } = CONSOLE_CONFIG[role];

  return (
    <ConsoleShell
      experience={label}
      homePath={homePath}
      navigation={navigation}
      role={roleLabel(role)}
      user={user}
      onSignOut={signOut}
    >
      <Outlet />
    </ConsoleShell>
  );
}

ConsoleExperience.propTypes = {
  role: PropTypes.oneOf(EXPERIENCE_ROLES).isRequired,
};
