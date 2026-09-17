/**
 * ADMIN OPERATIONS SERVICE (Phase 9)
 * -----------------------------------------------------------------------------
 * The business-operations boundary for the Admin / head-office console:
 * the business overview, the order book, the customer directory, branch
 * inventory, branch coordination and business reports.
 *
 * All rules live in the provider (the mock backend): the order lifecycle,
 * stock validation, RBAC enforcement. This service only forwards canonical
 * calls, keeping the UI provider-agnostic — a future API provider exposes
 * the same methods over HTTP.
 *
 * Mutations receive `actor` — the session's audit label ("Name — Role") —
 * so the canonical audit trail records who really acted.
 *
 * Flow: UI → hooks/useAdminOperations → adminOperationsService →
 *       DataProvider → Mock Provider → shared governance store.
 */
export const adminOperationsService = {
  getOverview(provider) {
    return provider.getAdminOverview();
  },

  /* Orders ------------------------------------------------------------- */
  getOrders(provider, query) {
    return provider.getAdminOrders(query);
  },
  getOrder(provider, id) {
    return provider.getAdminOrder(id);
  },
  updateOrderStatus(provider, id, status, actor) {
    return provider.updateAdminOrderStatus(id, status, actor);
  },

  /* Customers ---------------------------------------------------------- */
  getCustomers(provider, query) {
    return provider.getAdminCustomers(query);
  },
  getCustomer(provider, id) {
    return provider.getAdminCustomer(id);
  },

  /* Inventory ----------------------------------------------------------- */
  getInventory(provider, query) {
    return provider.getAdminInventory(query);
  },
  adjustInventory(provider, stockId, adjustment, actor) {
    return provider.adjustInventoryStock(stockId, adjustment, actor);
  },
  getMovements(provider, query) {
    return provider.getInventoryMovements(query);
  },

  /* Branches & reports --------------------------------------------------- */
  getBranchOperations(provider) {
    return provider.getBranchOperations();
  },
  getReports(provider) {
    return provider.getAdminReports();
  },
};

export default adminOperationsService;
