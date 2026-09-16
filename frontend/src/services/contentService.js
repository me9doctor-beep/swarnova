/**
 * Content services — marketing/editorial data.
 * Flow: hooks → services → provider (mock today, API tomorrow).
 */
export const contentService = {
  getSite(provider) {
    return provider.getSite();
  },
  getHomepage(provider) {
    return provider.getHomepage();
  },
  getAiStudio(provider) {
    return provider.getAiStudio();
  },
  getGoldRateBoard(provider) {
    return provider.getGoldRateBoard();
  },
  getActiveCampaign(provider) {
    return provider.getActiveCampaign();
  },
};

export default contentService;
