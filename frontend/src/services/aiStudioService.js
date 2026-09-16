/**
 * AI Jewellery Studio services — the dedicated /ai-studio experience.
 * Flow: hooks → services → provider (mock today, AI-backed API tomorrow).
 *
 * The marketing section keeps its existing home in `contentService.getAiStudio`;
 * generation lives here because it is the studio's own contract:
 *
 *   generateDesign(request)          → concept
 *   createVariations(provider, id)   → { id, images }   (plates after the original)
 *   refineDesign(request)            → refined concept
 */
export const aiStudioService = {
  getAtelier(provider) {
    return provider.getAiAtelier();
  },
  generateDesign(provider, request) {
    return provider.generateAiDesign(request);
  },
  createVariations(provider, conceptId) {
    return provider.createAiVariations(conceptId);
  },
  refineDesign(provider, request) {
    return provider.refineAiDesign(request);
  },
};

export default aiStudioService;
