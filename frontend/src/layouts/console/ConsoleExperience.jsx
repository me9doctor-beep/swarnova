import { useMemo } from "react";
import { Outlet } from "react-router-dom";
import PropTypes from "prop-types";
import ConsoleShell from "../../components/layout/ConsoleShell.jsx";
import { ROLES, roleLabel } from "../../features/authentication/roles.js";
import { useAuth } from "../../features/authentication/useAuth.js";
import { CONSOLE_CONFIG } from "./config.js";
import { filterNavigation } from "./navigation.js";

/**
 * CONSOLE EXPERIENCE — resolves one management experience's configuration and
 * session, then renders the shared ConsoleShell around the route's page.
 *
 * Admin, Super Admin and Employee each keep their own layout file as the
 * route-level composition point; this keeps the wiring (config lookup, role
 * label, session) written once instead of three times.
 *
 * Navigation is capability-filtered (Phase 9): an item declaring a
 * `capability` only renders for sessions that hold it, and groups left empty
 * disappear entirely. The account sees its own console — never someone
 * else's menus.
 *
 * `contextLabel` (Phase 10) is optional display context appended to the
 * experience label — the Employee console names its branch there, so a
 * counter account always knows which boutique it is working in. It is
 * presentation only: scope is resolved provider-side from the session.
 */
const EXPERIENCE_ROLES = [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.EMPLOYEE];

export default function ConsoleExperience({ role, contextLabel = null }) {
  const { user, permissions, signOut } = useAuth();
  const { label, homePath, navigation } = CONSOLE_CONFIG[role];

  const visibleNavigation = useMemo(
    () => filterNavigation(navigation, permissions),
    [navigation, permissions]
  );

  return (
    <ConsoleShell
      experience={contextLabel ? `${label} · ${contextLabel}` : label}
      homePath={homePath}
      navigation={visibleNavigation}
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
  /** Display-only context appended to the experience label (e.g. a branch). */
  contextLabel: PropTypes.string,
};
