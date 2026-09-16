/**
 * VIRTUAL TRY-ON services — the shared digital fitting room at
 * `/virtual-try-on`. Flow: hooks → services → provider (mock today,
 * a real AI/virtual-try-on backend tomorrow).
 *
 * The same service backs both journeys into the room:
 *
 *   AI Studio generated design  →  ?design=<concept-id>  (sourceType "ai-design")
 *   Catalogue product           →  ?product=<product-id> (sourceType "product")
 *
 * Contract:
 *   getRoom(provider)                    → room copy + sample portraits
 *   getSource(provider, { sourceType, sourceId }) → source or null
 *   createTryOn(provider, request)       → try-on result
 *
 * `createTryOn(provider, { sourceType, sourceId, photo })` where `photo` is
 * `{ origin: "sample" | "upload", sampleId?, name?, image: { src, alt } }`.
 * A future API provider swaps the mock render for an upload + inference call
 * one-to-one; hooks and components never change.
 */
export const virtualTryOnService = {
  getRoom(provider) {
    return provider.getTryOnRoom();
  },
  getSource(provider, source) {
    return provider.getTryOnSource(source);
  },
  createTryOn(provider, request) {
    return provider.createTryOn(request);
  },
};

export default virtualTryOnService;
