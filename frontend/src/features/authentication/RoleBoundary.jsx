import PropTypes from "prop-types";
import { Navigate } from "react-router-dom";
import { useAuth } from "./useAuth.js";
import { ROLE_LIST } from "./roles.js";

/**
 * ROLE BOUNDARY — the frontend route guard for one application experience.
 *
 * While authentication is not yet connected there is no session, so every
 * experience stays reachable (this is what lets the four shells be verified).
 * As soon as a session exists the role is enforced: a signed-in user opening
 * another experience's route is returned to the storefront.
 *
 * This is a navigation/UX boundary only — it never replaces backend
 * authorization.
 */
export default function RoleBoundary({ role, children }) {
  const { isAuthenticated, role: currentRole } = useAuth();

  if (isAuthenticated && currentRole !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
}

RoleBoundary.propTypes = {
  role: PropTypes.oneOf(ROLE_LIST).isRequired,
  children: PropTypes.node.isRequired,
};
