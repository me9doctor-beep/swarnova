import { useCallback, useState } from "react";
import { useDataProvider } from "../../services/providers/DataProvider.jsx";
import { customerAuthService } from "../../services/customerAuthService.js";
import { useCustomerAuth } from "./useCustomerAuth.js";

/**
 * CUSTOMER REGISTRATION FLOW (Phase 11)
 * -----------------------------------------------------------------------------
 * One hook drives customer sign-up, mirroring the `useCustomerLogin` shape:
 *
 *   const { register, busy, error, clearError } = useCustomerRegister();
 *   const session = await register({ name, email, phone, password });
 *   // a successful registration signs straight in — the register page
 *   // performs the return-to redirect.
 */
export function useCustomerRegister() {
  const provider = useDataProvider();
  const { signIn } = useCustomerAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const clearError = useCallback(() => setError(null), []);

  const register = useCallback(
    async (payload) => {
      setBusy(true);
      setError(null);
      try {
        const session = await customerAuthService.register(provider, payload);
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

  return { register, busy, error, clearError };
}

export default useCustomerRegister;
