/**
 * Boutique / branch network services.
 * Flow: hooks → services → provider (mock today, API tomorrow).
 */
export const branchesService = {
  getBranches(provider, query) {
    return provider.getBranches(query);
  },
};

export default branchesService;
