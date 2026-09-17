import { useCallback, useState } from "react";
import { useDataProvider } from "../services/providers/DataProvider.jsx";

/**
 * Generic mutation runner for console governance actions.
 *
 *   const { run, busy, error, clearError } = useGovernanceMutation();
 *   await run(productGovernanceService.transition, id, "approve");
 *
 * `run` always receives the provider first, calls the service function, and
 * surfaces mock-backend failures as local state (`error`) instead of throwing
 * an unhandled rejection — the catch also re-throws so callers can stop
 * follow-up work (navigating away, closing a dialog) on failure.
 */
export function useGovernanceMutation() {
  const provider = useDataProvider();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const clearError = useCallback(() => setError(null), []);

  const run = useCallback(
    async (invoke, ...args) => {
      setBusy(true);
      setError(null);
      try {
        return await invoke(provider, ...args);
      } catch (caught) {
        setError(caught);
        throw caught;
      } finally {
        setBusy(false);
      }
    },
    [provider]
  );

  return { run, busy, error, clearError };
}

export default useGovernanceMutation;
