import { useCallback } from "react";
import { useDataProvider } from "../services/providers/DataProvider.jsx";
import { catalogService } from "../services/catalogService.js";
import { useAsync } from "./useAsync.js";

/**
 * Catalogue products for a query object, e.g.
 * `useProducts({ bestseller: true, limit: 4 })`.
 */
export function useProducts(query = {}) {
  const provider = useDataProvider();
  const key = JSON.stringify(query);
  const task = useCallback(
    () => catalogService.getProducts(provider, query),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [provider, key]
  );
  return useAsync(task, [provider, key]);
}
