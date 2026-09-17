import { useCallback } from "react";
import { useDataProvider } from "../services/providers/DataProvider.jsx";
import { mediaGovernanceService } from "../services/mediaGovernanceService.js";
import { useAsync } from "./useAsync.js";

/**
 * The canonical media library for a query object. Every entry carries
 * provider-derived `usage` (where the asset is referenced) and its computed
 * `status` ("in-use" | "unused").
 */
export function useMediaLibrary(query = {}) {
  const provider = useDataProvider();
  const key = JSON.stringify(query);
  const task = useCallback(
    () => mediaGovernanceService.getLibrary(provider, query),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [provider, key]
  );
  return useAsync(task, [provider, key]);
}

export default useMediaLibrary;
