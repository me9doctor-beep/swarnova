/**
 * CATALOGUE GOVERNANCE SERVICE (Phase 8)
 * -----------------------------------------------------------------------------
 * Categories and collections — the two organising layers of the one
 * canonical catalogue. Categories answer "what type of jewellery is this?",
 * collections answer "which curated group does it belong to?"; they stay
 * separate here exactly as they do in the domain data.
 *
 * Flow: UI → useGovernanceCategories / useGovernanceCollections
 *       → catalogueGovernanceService → DataProvider → Mock Provider → store.
 */
export const catalogueGovernanceService = {
  getCategories(provider) {
    return provider.getGovernanceCategories();
  },
  createCategory(provider, data) {
    return provider.createGovernanceCategory(data);
  },
  updateCategory(provider, id, data) {
    return provider.updateGovernanceCategory(id, data);
  },
  getCollections(provider) {
    return provider.getGovernanceCollections();
  },
  createCollection(provider, data) {
    return provider.createGovernanceCollection(data);
  },
  updateCollection(provider, id, data) {
    return provider.updateGovernanceCollection(id, data);
  },
};

export default catalogueGovernanceService;
