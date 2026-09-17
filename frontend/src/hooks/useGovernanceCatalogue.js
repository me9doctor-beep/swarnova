import { useCallback } from "react";
import { useDataProvider } from "../services/providers/DataProvider.jsx";
import { catalogueGovernanceService } from "../services/catalogueGovernanceService.js";
import { useAsync } from "./useAsync.js";

/** All categories — including disabled ones the storefront never shows. */
export function useGovernanceCategories() {
  const provider = useDataProvider();
  const task = useCallback(
    () => catalogueGovernanceService.getCategories(provider),
    [provider]
  );
  return useAsync(task, [provider]);
}

/** All curated collections. */
export function useGovernanceCollections() {
  const provider = useDataProvider();
  const task = useCallback(
    () => catalogueGovernanceService.getCollections(provider),
    [provider]
  );
  return useAsync(task, [provider]);
}

export default useGovernanceCategories;
