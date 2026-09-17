/**
 * CONTENT GOVERNANCE SERVICE (Phase 8)
 * -----------------------------------------------------------------------------
 * Structured content control over the EXISTING storefront homepage (section
 * visibility and ordering) and the campaign placements rendered inside it.
 * This governs the one homepage — it never builds a second one.
 *
 * Flow: UI → useGovernanceHomepage / useGovernanceCampaigns
 *       → contentGovernanceService → DataProvider → Mock Provider → store.
 */
export const contentGovernanceService = {
  getHomepage(provider) {
    return provider.getGovernanceHomepage();
  },
  updateSection(provider, id, patch, actor) {
    return provider.updateHomepageSection(id, patch, actor);
  },
  moveSection(provider, id, direction) {
    return provider.moveHomepageSection(id, direction);
  },
  getCampaigns(provider) {
    return provider.getGovernanceCampaigns();
  },
  updateCampaignStatus(provider, id, status, actor) {
    return provider.updateCampaignStatus(id, status, actor);
  },
};

export default contentGovernanceService;
