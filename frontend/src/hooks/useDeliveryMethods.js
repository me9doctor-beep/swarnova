import { useCallback } from "react";
import { useDataProvider } from "../services/providers/DataProvider.jsx";
import { checkoutService } from "../services/checkoutService.js";
import { useAsync } from "./useAsync.js";

/**
 * DELIVERY METHODS HOOK (Phase 12)
 * -----------------------------------------------------------------------------
 * The canonical delivery surface, fetched through the commerce boundary.
 * The checkout renders whatever the provider offers — nothing delivery
 * shaped is ever invented in the UI.
 */
export function useDeliveryMethods() {
  const provider = useDataProvider();
  const task = useCallback(() => checkoutService.getDeliveryMethods(provider), [provider]);
  const asyncState = useAsync(task, [provider]);

  return {
    ...asyncState,
    deliveryMethods: asyncState.data ?? [],
  };
}

export default useDeliveryMethods;
