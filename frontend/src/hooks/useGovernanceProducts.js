import { useCallback } from "react";
import { useDataProvider } from "../services/providers/DataProvider.jsx";
import { productGovernanceService } from "../services/governanceService.js";
import { useAsync } from "./useAsync.js";

/**
 * Governance products for a query object — the full lifecycle view (every
 * status, not only published), each record carrying provider-computed
 * `readiness` and valid `actions`.
 */
export function useGovernanceProducts(query = {}) {
  const provider = useDataProvider();
  const key = JSON.stringify(query);
  const task = useCallback(
    () => productGovernanceService.getProducts(provider, query),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [provider, key]
  );
  return useAsync(task, [provider, key]);
}

/** One product in the governance view, or `null` when unknown. */
export function useGovernanceProduct(id) {
  const provider = useDataProvider();
  const task = useCallback(
    () => productGovernanceService.getProduct(provider, id),
    [provider, id]
  );
  return useAsync(task, [provider, id]);
}

export default useGovernanceProducts;
