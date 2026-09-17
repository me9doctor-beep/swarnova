import { useCallback } from "react";
import { useDataProvider } from "../services/providers/DataProvider.jsx";
import { orderService } from "../services/orderService.js";
import { useAsync } from "./useAsync.js";

/**
 * Customer orders hook.
 * Fetches order history from the provider.
 */
export function useOrders() {
  const provider = useDataProvider();
  const task = useCallback(() => orderService.getOrders(provider), [provider]);
  const asyncState = useAsync(task, [provider]);

  return {
    ...asyncState,
    orders: asyncState.data ?? [],
  };
}

export default useOrders;
