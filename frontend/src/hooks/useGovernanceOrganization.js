import { useCallback } from "react";
import { useDataProvider } from "../services/providers/DataProvider.jsx";
import { organizationGovernanceService } from "../services/organizationGovernanceService.js";
import { useAsync } from "./useAsync.js";

/** The branch network with resolved admin + employee counts. */
export function useGovernanceBranches() {
  const provider = useDataProvider();
  const task = useCallback(
    () => organizationGovernanceService.getBranches(provider),
    [provider]
  );
  return useAsync(task, [provider]);
}

/** The administrator directory with resolved scope names. */
export function useGovernanceAdmins() {
  const provider = useDataProvider();
  const task = useCallback(
    () => organizationGovernanceService.getAdmins(provider),
    [provider]
  );
  return useAsync(task, [provider]);
}

/** Platform-wide employee visibility with resolved branch names. */
export function useGovernanceEmployees() {
  const provider = useDataProvider();
  const task = useCallback(
    () => organizationGovernanceService.getEmployees(provider),
    [provider]
  );
  return useAsync(task, [provider]);
}

export default useGovernanceBranches;
