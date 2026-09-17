/**
 * MEDIA GOVERNANCE SERVICE (Phase 8)
 * -----------------------------------------------------------------------------
 * The media library boundary: upload → library → attach → use. Usage
 * derivation and delete-safety live in the provider (the mock backend); the
 * service keeps components provider-agnostic.
 *
 * Flow: UI → useMediaLibrary / useMediaActions
 *       → mediaGovernanceService → DataProvider → Mock Provider → store.
 */
export const mediaGovernanceService = {
  getLibrary(provider, query) {
    return provider.getMediaLibrary(query);
  },
  upload(provider, file) {
    return provider.uploadMediaAsset(file);
  },
  attachToProduct(provider, mediaId, productId, slot) {
    return provider.attachMediaToProduct(mediaId, productId, slot);
  },
  remove(provider, id) {
    return provider.deleteMediaAsset(id);
  },
};

export default mediaGovernanceService;
