/**
 * EMPLOYEE OPERATIONS SERVICE (Phase 10)
 * -----------------------------------------------------------------------------
 * The branch-operations boundary for the Employee console: the counter
 * dashboard, the branch order book, the branch customer book, catalogue
 * lookup, branch inventory, branch operations, branch reports and the
 * employee's own profile.
 *
 * Every method forwards the session ACTOR (`{ id, role, label }`) as its
 * first argument. That is the whole authorization story of this phase: the
 * provider resolves the employee's branch and capabilities from that
 * identity, validates any branch named in a query against it, and refuses
 * anything outside it. A `?branchId=` in a URL is a request to check, never a
 * grant — the service layer never invents scope of its own.
 *
 * Mutations carry the actor too, so the canonical audit trail records the
 * real employee, the branch the action happened in and, where the business
 * requires it, the written reason.
 *
 * Flow: UI → hooks/useEmployeeOperations → employeeOperationsService →
 *       DataProvider → Mock Provider → shared canonical store.
 */
export const employeeOperationsService = {
  /* Dashboard ------------------------------------------------------------ */
  getOverview(provider, actor) {
    return provider.getEmployeeOverview(actor);
  },

  /* Orders --------------------------------------------------------------- */
  getOrders(provider, actor, query) {
    return provider.getEmployeeOrders(actor, query);
  },
  getOrder(provider, actor, id) {
    return provider.getEmployeeOrder(actor, id);
  },
  updateOrderStatus(provider, actor, id, status) {
    return provider.updateEmployeeOrderStatus(actor, id, status);
  },

  /* Customers ------------------------------------------------------------ */
  getCustomers(provider, actor, query) {
    return provider.getEmployeeCustomers(actor, query);
  },
  getCustomer(provider, actor, id) {
    return provider.getEmployeeCustomer(actor, id);
  },

  /* Catalogue ------------------------------------------------------------ */
  getCatalogue(provider, actor, query) {
    return provider.getEmployeeCatalogue(actor, query);
  },
  getProduct(provider, actor, id) {
    return provider.getEmployeeProduct(actor, id);
  },
  getCategories(provider, actor) {
    return provider.getEmployeeCategories(actor);
  },

  /* Inventory ------------------------------------------------------------ */
  getInventory(provider, actor, query) {
    return provider.getEmployeeInventory(actor, query);
  },
  adjustInventory(provider, actor, stockId, adjustment) {
    return provider.adjustEmployeeInventory(actor, stockId, adjustment);
  },
  getMovements(provider, actor, query) {
    return provider.getEmployeeInventoryMovements(actor, query);
  },

  /* Branch operations, reports, profile ----------------------------------- */
  getBranchOperations(provider, actor) {
    return provider.getEmployeeBranchOperations(actor);
  },
  getReports(provider, actor) {
    return provider.getEmployeeReports(actor);
  },
  getProfile(provider, actor) {
    return provider.getEmployeeProfile(actor);
  },
  updateProfile(provider, actor, patch) {
    return provider.updateEmployeeProfile(actor, patch);
  },
};

export default employeeOperationsService;
