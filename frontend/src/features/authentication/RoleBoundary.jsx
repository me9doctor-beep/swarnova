import PropTypes from "prop-types";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth.js";
import { ROLE_LIST, STAFF_LOGIN_PATH } from "./roles.js";
import AccessDenied from "./AccessDenied.jsx";

/**
 * ROLE BOUNDARY — the frontend route guard for one application experience.
 *
 * Phase 9 wiring: staff sign in through the ONE shared login at
 * `/staff/login`. From that point on:
 *
 *   no session          → redirected to the staff login
 *   wrong role          → proper Access Denied state (never a silent bounce
 *                          that hides why the door closed)
 *   matching role       → the experience renders
 *
 * This remains a navigation/UX boundary only — it never replaces backend
 * authorization, which is the sole authority on what an account may do.
 */
export default function RoleBoundary({ role, children }) {
  const { isAuthenticated, role: currentRole } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to={STAFF_LOGIN_PATH}
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (currentRole !== role) {
    return <AccessDenied />;
  }

  return children;
}

RoleBoundary.propTypes = {
  role: PropTypes.oneOf(ROLE_LIST).isRequired,
  children: PropTypes.node.isRequired,
};
