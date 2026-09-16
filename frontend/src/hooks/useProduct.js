import { useCallback } from "react";
import { useDataProvider } from "../services/providers/DataProvider.jsx";
import { catalogService } from "../services/catalogService.js";
import { useAsync } from "./useAsync.js";

/**
 * A single catalogue piece by id — the product detail screen's one query.
 * Resolves to `null` when the id is not in the catalogue, so the screen can
 * render its not-found state from the same async result.
 */
export function useProduct(id) {
  const provider = useDataProvider();
  const task = useCallback(() => catalogService.getProduct(provider, id), [provider, id]);
  return useAsync(task, [provider, id]);
}
