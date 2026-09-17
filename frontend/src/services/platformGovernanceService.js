/**
 * PLATFORM GOVERNANCE SERVICE (Phase 8)
 * -----------------------------------------------------------------------------
 * The control plane itself: command-centre overview, gold-rate board,
 * platform settings, feature availability (AI Studio / Virtual Try-On) and
 * the audit trail. No infrastructure configuration ever crosses this
 * boundary — only the switches a platform administrator understands.
 *
 * Flow: UI → usePlatformOverview / usePlatformSettings / useAuditLogs …
 *       → platformGovernanceService → DataProvider → Mock Provider → store.
 */
export const platformGovernanceService = {
  getOverview(provider) {
    return provider.getPlatformOverview();
  },
  getSettings(provider) {
    return provider.getPlatformSettings();
  },
  updateSettings(provider, patch) {
    return provider.updatePlatformSettings(patch);
  },
  getGoldRateBoard(provider) {
    return provider.getGoldRateBoard();
  },
  updateGoldRates(provider, rates) {
    return provider.updateGoldRates(rates);
  },
  getAuditLogs(provider, query) {
    return provider.getAuditLogs(query);
  },
};

export default platformGovernanceService;
