import { useCallback, useState } from "react";
import { useDataProvider } from "../../services/providers/DataProvider.jsx";
import { staffAuthService } from "../../services/staffAuthService.js";
import { useAuth } from "./useAuth.js";

/**
 * STAFF LOGIN FLOW (Phase 9)
 * -----------------------------------------------------------------------------
 * One hook drives the shared staff login for every staff role:
 *
 *   const { login, busy, error } = useStaffLogin();
 *   const session = await login({ email, password });
 *   // session.role decides the redirect — never a user choice.
 *
 * On success the session is installed through the existing AuthProvider and
 * returned to the caller (the login page performs the role-based redirect).
 * Provider failures surface as `error` and re-throw so the caller can stop.
 */
export function useStaffLogin() {
  const provider = useDataProvider();
  const { signIn } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const clearError = useCallback(() => setError(null), []);

  const login = useCallback(
    async (credentials) => {
      setBusy(true);
      setError(null);
      try {
        const session = await staffAuthService.authenticate(provider, credentials);
        signIn(session);
        return session;
      } catch (caught) {
        setError(caught);
        throw caught;
      } finally {
        setBusy(false);
      }
    },
    [provider, signIn]
  );

  return { login, busy, error, clearError };
}

export default useStaffLogin;
