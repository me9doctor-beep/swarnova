import { useCallback, useMemo } from "react";
import { useDataProvider } from "../services/providers/DataProvider.jsx";
import { employeeOperationsService } from "../services/employeeOperationsService.js";
import { useAuth } from "../features/authentication/useAuth.js";
import { actorLabel } from "../features/authentication/roles.js";
import { useAsync } from "./useAsync.js";

/**
 * EMPLOYEE OPERATIONS HOOKS (Phase 10)
 * -----------------------------------------------------------------------------
 * One hook per branch-operations surface. All of them follow the house flow —
 * UI → hook → service → DataProvider → provider — and none of them touch mock
 * data directly.
 *
 * `useEmployeeActor` is the single place the session becomes the actor object
 * the provider resolves scope from: identity and role only (`{ id, role,
 * label }`). It deliberately does NOT send capabilities or a branch — both are
 * re-resolved store-side, so nothing the browser holds can widen an
 * employee's reach.
 */
export function useEmployeeActor() {
  const { user, role } = useAuth();

  return useMemo(
    () => ({
      id: user?.id ?? null,
      role: role ?? null,
      label: actorLabel(user, role),
    }),
    [user, role]
  );
}

/** The branch dashboard — what needs doing at my boutique today. */
export function useEmployeeOverview() {
  const provider = useDataProvider();
  const actor = useEmployeeActor();
  const task = useCallback(
    () => employeeOperationsService.getOverview(provider, actor),
    [provider, actor]
  );
  return useAsync(task, [provider, actor]);
}

/** The branch order book for a query object ({ search, status }). */
export function useEmployeeOrders(query = {}) {
  const provider = useDataProvider();
  const actor = useEmployeeActor();
  const key = JSON.stringify(query);
  const task = useCallback(
    () => employeeOperationsService.getOrders(provider, actor, query),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [provider, actor, key]
  );
  return useAsync(task, [provider, actor, key]);
}

/** One branch order by id or order number, or `null` when unknown. */
export function useEmployeeOrder(id) {
  const provider = useDataProvider();
  const actor = useEmployeeActor();
  const task = useCallback(
    () => (id ? employeeOperationsService.getOrder(provider, actor, id) : Promise.resolve(null)),
    [provider, actor, id]
  );
  return useAsync(task, [provider, actor, id]);
}

/** The branch customer book for a query object ({ search }). */
export function useEmployeeCustomers(query = {}) {
  const provider = useDataProvider();
  const actor = useEmployeeActor();
  const key = JSON.stringify(query);
  const task = useCallback(
    () => employeeOperationsService.getCustomers(provider, actor, query),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [provider, actor, key]
  );
  return useAsync(task, [provider, actor, key]);
}

/** One customer with the orders this branch has fulfilled for them. */
export function useEmployeeCustomer(id) {
  const provider = useDataProvider();
  const actor = useEmployeeActor();
  const task = useCallback(
    () => (id ? employeeOperationsService.getCustomer(provider, actor, id) : Promise.resolve(null)),
    [provider, actor, id]
  );
  return useAsync(task, [provider, actor, id]);
}

/** Branch catalogue lookup for a query ({ search, categoryId, stock }). */
export function useEmployeeCatalogue(query = {}) {
  const provider = useDataProvider();
  const actor = useEmployeeActor();
  const key = JSON.stringify(query);
  const task = useCallback(
    () => employeeOperationsService.getCatalogue(provider, actor, query),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [provider, actor, key]
  );
  return useAsync(task, [provider, actor, key]);
}

/** One catalogue piece with its position in the employee's branch. */
export function useEmployeeProduct(id) {
  const provider = useDataProvider();
  const actor = useEmployeeActor();
  const task = useCallback(
    () => (id ? employeeOperationsService.getProduct(provider, actor, id) : Promise.resolve(null)),
    [provider, actor, id]
  );
  return useAsync(task, [provider, actor, id]);
}

/** The enabled catalogue categories, for lookup filters. */
export function useEmployeeCategories() {
  const provider = useDataProvider();
  const actor = useEmployeeActor();
  const task = useCallback(
    () => employeeOperationsService.getCategories(provider, actor),
    [provider, actor]
  );
  return useAsync(task, [provider, actor]);
}

/** Branch inventory for a query ({ search, productId, stock }). */
export function useEmployeeInventory(query = {}) {
  const provider = useDataProvider();
  const actor = useEmployeeActor();
  const key = JSON.stringify(query);
  const task = useCallback(
    () => employeeOperationsService.getInventory(provider, actor, query),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [provider, actor, key]
  );
  return useAsync(task, [provider, actor, key]);
}

/** Stock movement history for a query ({ stockId, limit }). */
export function useEmployeeInventoryMovements(query = {}) {
  const provider = useDataProvider();
  const actor = useEmployeeActor();
  const key = JSON.stringify(query);
  const task = useCallback(
    () => employeeOperationsService.getMovements(provider, actor, query),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [provider, actor, key]
  );
  return useAsync(task, [provider, actor, key]);
}

/** The branch's own operating picture — team, stock, orders, activity. */
export function useEmployeeBranchOperations() {
  const provider = useDataProvider();
  const actor = useEmployeeActor();
  const task = useCallback(
    () => employeeOperationsService.getBranchOperations(provider, actor),
    [provider, actor]
  );
  return useAsync(task, [provider, actor]);
}

/** Branch-scoped operational reporting (reports.view). */
export function useEmployeeReports() {
  const provider = useDataProvider();
  const actor = useEmployeeActor();
  const task = useCallback(
    () => employeeOperationsService.getReports(provider, actor),
    [provider, actor]
  );
  return useAsync(task, [provider, actor]);
}

/** The employee's own record. */
export function useEmployeeProfile() {
  const provider = useDataProvider();
  const actor = useEmployeeActor();
  const task = useCallback(
    () => employeeOperationsService.getProfile(provider, actor),
    [provider, actor]
  );
  return useAsync(task, [provider, actor]);
}

export default useEmployeeOverview;
