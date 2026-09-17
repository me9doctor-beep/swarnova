import PropTypes from "prop-types";
import { useAuth } from "./useAuth.js";
import { can } from "./permissions.js";
import AccessDenied from "./AccessDenied.jsx";

/**
 * CAPABILITY GATE — wraps a route element (or page section) that needs a
 * specific capability.
 *
 *   <RequireCapability capability={CAPABILITIES.INVENTORY_VIEW}>
 *     <AdminInventoryPage />
 *   </RequireCapability>
 *
 * Role boundaries decide which CONSOLE a user enters; capability gates
 * decide what they may do inside it. Super Admin (`"*"`) passes every gate.
 * A user who reaches a gate without the capability sees the proper Access
 * Denied state — restricted surfaces are never silently exposed.
 */
export default function RequireCapability({ capability, children }) {
  const { permissions } = useAuth();

  if (!can(permissions, capability)) {
    return <AccessDenied inline />;
  }

  return children;
}

RequireCapability.propTypes = {
  /** One permission key, or an array of keys that must all be held. */
  capability: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]).isRequired,
  children: PropTypes.node.isRequired,
};
