import { withProductMedia } from "./productMediaService.js";

/**
 * Catalogue services — categories, collections and products.
 *
 * Products leave the service with their resolved media contract
 * (`media: { primary, hoverFrames }`, Phase 14.4B) so every card and screen
 * reads one shape, whichever provider answered.
 */
export const catalogService = {
  getCategories(provider) {
    return provider.getCategories();
  },
  getCollections(provider) {
    return provider.getCollections();
  },
  async getProducts(provider, query) {
    const list = await provider.getProducts(query);
    return Array.isArray(list) ? list.map(withProductMedia) : list;
  },
  async getProduct(provider, id) {
    const product = await provider.getProduct(id);
    return product ? withProductMedia(product) : product;
  },
};

export default catalogService;
