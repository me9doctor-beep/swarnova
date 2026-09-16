import { useContext } from "react";
import { AuthContext } from "./AuthProvider.jsx";

/**
 * Access the current session.
 *
 *   const { user, role, permissions, isAuthenticated } = useAuth();
 *
 * Combine with `can()` from `permissions.js` to gate UI:
 *   const allowed = can(permissions, PERMISSIONS.PRODUCT_CREATE);
 */
export function useAuth() {
  return useContext(AuthContext);
}

export default useAuth;
