/**
 * Boutique / branch network services.
 */
export const storesService = {
  getBranches(provider, query) {
    return provider.getBranches(query);
  },
};

export default storesService;
