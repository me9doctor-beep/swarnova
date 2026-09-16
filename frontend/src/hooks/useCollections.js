import { useCallback } from "react";
import { useDataProvider } from "../services/providers/DataProvider.jsx";
import { catalogService } from "../services/catalogService.js";
import { useAsync } from "./useAsync.js";

/** Curated collections — the editorial grouping layer above categories. */
export function useCollections() {
  const provider = useDataProvider();
  const task = useCallback(() => catalogService.getCollections(provider), [provider]);
  return useAsync(task, [provider]);
}

export default useCollections;
