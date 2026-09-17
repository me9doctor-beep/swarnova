import { useCallback } from "react";
import { useDataProvider } from "../services/providers/DataProvider.jsx";
import { contentGovernanceService } from "../services/contentGovernanceService.js";
import { useAsync } from "./useAsync.js";

/**
 * The governance view of the storefront homepage: every section in order,
 * including hidden ones, with the visibility + ordering controls the
 * provider allows.
 */
export function useGovernanceHomepage() {
  const provider = useDataProvider();
  const task = useCallback(
    () => contentGovernanceService.getHomepage(provider),
    [provider]
  );
  return useAsync(task, [provider]);
}

/** All campaigns, annotated with which one is currently live. */
export function useGovernanceCampaigns() {
  const provider = useDataProvider();
  const task = useCallback(
    () => contentGovernanceService.getCampaigns(provider),
    [provider]
  );
  return useAsync(task, [provider]);
}

export default useGovernanceHomepage;
