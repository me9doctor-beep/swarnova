import { useCallback } from "react";
import { useAuth } from "./useAuth.js";
import { can } from "./permissions.js";

/**
 * Capability checks for the signed-in session — the reusable RBAC boundary
 * every console page and action uses instead of comparing raw role strings.
 *
 *   const { can: canDo, role } = useCapability();
 *   if (canDo(CAPABILITIES.INVENTORY_MANAGE)) { … }
 *
 * Frontend checks stay a UX convenience: hiding an action never replaces the
 * backend refusing the call.
 */
export function useCapability() {
  const { permissions, role, isAuthenticated } = useAuth();

  const check = useCallback(
    (required) => can(permissions, required),
    [permissions]
  );

  return {
    permissions,
    role,
    isAuthenticated,
    /** True when the session holds the given key(s) — "*" holds everything. */
    can: check,
  };
}

export default useCapability;
