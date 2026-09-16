import { useCallback } from "react";
import { useDataProvider } from "../services/providers/DataProvider.jsx";
import { branchesService } from "../services/branchesService.js";
import { useAsync } from "./useAsync.js";

/** Boutique / branch network for a query object, e.g. `{ featured: true }`. */
export function useBranches(query = {}) {
  const provider = useDataProvider();
  const key = JSON.stringify(query);
  const task = useCallback(
    () => branchesService.getBranches(provider, query),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [provider, key]
  );
  return useAsync(task, [provider, key]);
}
