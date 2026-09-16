import { useCallback } from "react";
import { useDataProvider } from "../data/DataProvider.jsx";
import { catalogService } from "../services/catalogService.js";
import { useAsync } from "./useAsync.js";

export function useCategories() {
  const provider = useDataProvider();
  const task = useCallback(() => catalogService.getCategories(provider), [provider]);
  return useAsync(task, [provider]);
}

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
