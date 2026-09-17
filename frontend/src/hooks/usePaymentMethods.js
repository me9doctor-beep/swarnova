import { useCallback } from "react";
import { useDataProvider } from "../services/providers/DataProvider.jsx";
import { checkoutService } from "../services/checkoutService.js";
import { useAsync } from "./useAsync.js";

/**
 * PAYMENT METHODS HOOK (Phase 12)
 * -----------------------------------------------------------------------------
 * The canonical payment surface, fetched through the commerce boundary. The
 * UI never names a gateway and never sees payment credentials — it renders
 * the provider's client-safe methods and returns the chosen id.
 */
export function usePaymentMethods() {
  const provider = useDataProvider();
  const task = useCallback(() => checkoutService.getPaymentMethods(provider), [provider]);
  const asyncState = useAsync(task, [provider]);

  return {
    ...asyncState,
    paymentMethods: asyncState.data ?? [],
  };
}

export default usePaymentMethods;
