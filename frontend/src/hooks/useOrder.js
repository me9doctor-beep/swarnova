import { useCallback } from "react";
import { useDataProvider } from "../services/providers/DataProvider.jsx";
import { orderService } from "../services/orderService.js";
import { useAsync } from "./useAsync.js";

/**
 * Single customer order hook by order id or orderNumber.
 */
export function useOrder(id) {
  const provider = useDataProvider();
  const task = useCallback(
    () => (id ? orderService.getOrder(provider, id) : Promise.resolve(null)),
    [provider, id]
  );
  const asyncState = useAsync(task, [provider, id]);

  return {
    ...asyncState,
    order: asyncState.data,
  };
}

export default useOrder;
