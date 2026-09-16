/**
 * Catalogue services — categories, collections and products.
 */
export const catalogService = {
  getCategories(provider) {
    return provider.getCategories();
  },
  getCollections(provider) {
    return provider.getCollections();
  },
  getProducts(provider, query) {
    return provider.getProducts(query);
  },
};

export default catalogService;
