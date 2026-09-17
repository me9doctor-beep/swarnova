import { useCallback } from "react";
import { useDataProvider } from "../services/providers/DataProvider.jsx";
import { adminOperationsService } from "../services/adminOperationsService.js";
import { organizationGovernanceService } from "../services/organizationGovernanceService.js";
import { useAsync } from "./useAsync.js";

/**
 * ADMIN OPERATIONS HOOKS (Phase 9)
 * -----------------------------------------------------------------------------
 * One hook per Admin business surface. All of them follow the house flow —
 * UI → hook → service → DataProvider → provider — and none of them touch
 * mock data directly.
 */

/** The business overview — what needs attention today. */
export function useAdminOverview() {
  const provider = useDataProvider();
  const task = useCallback(
    () => adminOperationsService.getOverview(provider),
    [provider]
  );
  return useAsync(task, [provider]);
}

/** The order book for a query object ({ search, status, branchId }). */
export function useAdminOrders(query = {}) {
  const provider = useDataProvider();
  const key = JSON.stringify(query);
  const task = useCallback(
    () => adminOperationsService.getOrders(provider, query),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [provider, key]
  );
  return useAsync(task, [provider, key]);
}

/** One order by id or order number, or `null` when unknown. */
export function useAdminOrder(id) {
  const provider = useDataProvider();
  const task = useCallback(
    () => (id ? adminOperationsService.getOrder(provider, id) : Promise.resolve(null)),
    [provider, id]
  );
  return useAsync(task, [provider, id]);
}

/** The customer directory for a query object ({ search }). */
export function useAdminCustomers(query = {}) {
  const provider = useDataProvider();
  const key = JSON.stringify(query);
  const task = useCallback(
    () => adminOperationsService.getCustomers(provider, query),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [provider, key]
  );
  return useAsync(task, [provider, key]);
}

/** One customer with their order history, or `null` when unknown. */
export function useAdminCustomer(id) {
  const provider = useDataProvider();
  const task = useCallback(
    () => (id ? adminOperationsService.getCustomer(provider, id) : Promise.resolve(null)),
    [provider, id]
  );
  return useAsync(task, [provider, id]);
}

/** Branch inventory for a query ({ branchId, productId, stock, search }). */
export function useAdminInventory(query = {}) {
  const provider = useDataProvider();
  const key = JSON.stringify(query);
  const task = useCallback(
    () => adminOperationsService.getInventory(provider, query),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [provider, key]
  );
  return useAsync(task, [provider, key]);
}

/** Stock movement history for a query ({ stockId, limit }). */
export function useInventoryMovements(query = {}) {
  const provider = useDataProvider();
  const key = JSON.stringify(query);
  const task = useCallback(
    () => adminOperationsService.getMovements(provider, query),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [provider, key]
  );
  return useAsync(task, [provider, key]);
}

/** The operational branch view — people, stock and open orders per branch. */
export function useBranchOperations() {
  const provider = useDataProvider();
  const task = useCallback(
    () => adminOperationsService.getBranchOperations(provider),
    [provider]
  );
  return useAsync(task, [provider]);
}

/** Business reports — computed by the provider from canonical state. */
export function useAdminReports() {
  const provider = useDataProvider();
  const task = useCallback(
    () => adminOperationsService.getReports(provider),
    [provider]
  );
  return useAsync(task, [provider]);
}

/** The reusable capability profiles employees are hired into. */
export function useCapabilityProfiles() {
  const provider = useDataProvider();
  const task = useCallback(
    () => organizationGovernanceService.getCapabilityProfiles(provider),
    [provider]
  );
  return useAsync(task, [provider]);
}

/** The canonical employee directory (shared with Super Admin oversight). */
export function useAdminEmployees() {
  const provider = useDataProvider();
  const task = useCallback(
    () => organizationGovernanceService.getEmployees(provider),
    [provider]
  );
  return useAsync(task, [provider]);
}
