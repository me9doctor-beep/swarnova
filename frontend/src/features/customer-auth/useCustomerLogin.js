import { useCallback, useState } from "react";
import { useDataProvider } from "../../services/providers/DataProvider.jsx";
import { customerAuthService } from "../../services/customerAuthService.js";
import { useCustomerAuth } from "./useCustomerAuth.js";

/**
 * CUSTOMER LOGIN FLOW (Phase 11)
 * -----------------------------------------------------------------------------
 * One hook drives customer sign-in, mirroring the staff `useStaffLogin` shape:
 *
 *   const { login, busy, error, clearError } = useCustomerLogin();
 *   const session = await login({ identifier, password });
 *   // the session is installed on the customer context and returned —
 *   // the login page performs the return-to redirect.
 *
 * Provider failures surface as `error` (with a stable `error.code` the page
 * translates via `translateCustomerAuthError`) and re-throw so the caller
 * can stop.
 */
export function useCustomerLogin() {
  const provider = useDataProvider();
  const { signIn } = useCustomerAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const clearError = useCallback(() => setError(null), []);

  const login = useCallback(
    async (credentials) => {
      setBusy(true);
      setError(null);
      try {
        const session = await customerAuthService.login(provider, credentials);
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

export default useCustomerLogin;
