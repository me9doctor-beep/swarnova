import { useCallback, useState } from "react";
import { useDataProvider } from "../../services/providers/DataProvider.jsx";
import { customerAuthService } from "../../services/customerAuthService.js";

/**
 * CUSTOMER PASSWORD RESET FLOW (Phase 11)
 * -----------------------------------------------------------------------------
 * One hook drives both halves of the reset contract:
 *
 *   const { requestReset, confirmReset, busy, error, clearError } = usePasswordReset();
 *   await requestReset(identifier);            // → { requested: true }
 *   await confirmReset({ token, password });   // → { reset: true }
 *
 * The token stays opaque — the hook hands it to the provider untouched and
 * never validates it client-side. The backend (the mock store today) is the
 * only authority on whether a token is valid.
 */
export function usePasswordReset() {
  const provider = useDataProvider();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const clearError = useCallback(() => setError(null), []);

  const requestReset = useCallback(
    async (identifier) => {
      setBusy(true);
      setError(null);
      try {
        return await customerAuthService.requestPasswordReset(provider, identifier);
      } catch (caught) {
        setError(caught);
        throw caught;
      } finally {
        setBusy(false);
      }
    },
    [provider]
  );

  const confirmReset = useCallback(
    async (payload) => {
      setBusy(true);
      setError(null);
      try {
        return await customerAuthService.resetPassword(provider, payload);
      } catch (caught) {
        setError(caught);
        throw caught;
      } finally {
        setBusy(false);
      }
    },
    [provider]
  );

  return { requestReset, confirmReset, busy, error, clearError };
}

export default usePasswordReset;
