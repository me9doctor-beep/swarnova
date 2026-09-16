import { useCallback } from "react";
import { useDataProvider } from "../data/DataProvider.jsx";
import { storesService } from "../services/storesService.js";
import { useAsync } from "./useAsync.js";

export function useBranches(query = {}) {
  const provider = useDataProvider();
  const key = JSON.stringify(query);
  const task = useCallback(
    () => storesService.getBranches(provider, query),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [provider, key]
  );
  return useAsync(task, [provider, key]);
}
