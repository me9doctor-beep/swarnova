import { useCallback } from "react";
import { useDataProvider } from "../services/providers/DataProvider.jsx";
import { platformGovernanceService } from "../services/platformGovernanceService.js";
import { useAsync } from "./useAsync.js";

/** The command-centre summary — computed from canonical state by the provider. */
export function usePlatformOverview() {
  const provider = useDataProvider();
  const task = useCallback(
    () => platformGovernanceService.getOverview(provider),
    [provider]
  );
  return useAsync(task, [provider]);
}

/** The small set of platform switches a Super Admin may change. */
export function usePlatformSettings() {
  const provider = useDataProvider();
  const task = useCallback(
    () => platformGovernanceService.getSettings(provider),
    [provider]
  );
  return useAsync(task, [provider]);
}

/** The audit trail for a query object ({ search, action, actor, limit }). */
export function useAuditLogs(query = {}) {
  const provider = useDataProvider();
  const key = JSON.stringify(query);
  const task = useCallback(
    () => platformGovernanceService.getAuditLogs(provider, query),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [provider, key]
  );
  return useAsync(task, [provider, key]);
}

export default usePlatformOverview;
