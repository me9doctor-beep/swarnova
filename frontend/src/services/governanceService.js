/**
 * PRODUCT GOVERNANCE SERVICE (Phase 8)
 * -----------------------------------------------------------------------------
 * The product lifecycle boundary between Super Admin hooks and the data
 * provider. All transition validation happens in the provider (the mock
 * backend); this service forwards the canonical calls and keeps the UI
 * provider-agnostic.
 *
 * Flow: UI → useGovernanceProducts / useGovernanceProduct / useProductActions
 *       → productGovernanceService → DataProvider → Mock Provider → store.
 */
export const productGovernanceService = {
  getProducts(provider, query) {
    return provider.getGovernanceProducts(query);
  },
  getProduct(provider, id) {
    return provider.getGovernanceProduct(id);
  },
  createProduct(provider, data) {
    return provider.createGovernanceProduct(data);
  },
  updateProduct(provider, id, data) {
    return provider.updateGovernanceProduct(id, data);
  },
  /** One method for every lifecycle move: submit | approve | reject | publish. */
  transition(provider, id, action, payload = {}) {
    return provider.transitionGovernanceProduct(id, action, payload);
  },
};

export default productGovernanceService;
