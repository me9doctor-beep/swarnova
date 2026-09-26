/**
 * PRODUCT MEDIA SERVICE — Phase 14.4B
 * -----------------------------------------------------------------------------
 * Pure resolution of a catalogue piece's media contract. Products are fetched
 * through the normal chain (ProductCard → useProducts → catalogService →
 * DataProvider → mock provider → mock data); this module only interprets the
 * media fields on the records that arrive, so a future commerce API / DAM can
 * return the same structure without a ProductCard change.
 *
 * Resolved contract (always present after `withProductMedia`):
 *
 *   media: {
 *     primary:     { src, alt } | null   // the canonical front still
 *     hoverFrames: [{ src, alt }, …]     // optional additional camera angles
 *   }
 *
 * Sources, in order of precedence:
 *
 *   · `media.primary` when a backend supplies it, else `images[0]` — the
 *     canonical still the rest of the storefront (gallery, try-on, orders)
 *     already reads, so the primary is never stored twice.
 *   · `media.hoverFrames` — the photographs of the SAME piece from other
 *     camera positions, in viewing order (slight left → slight right →
 *     detail). Frames may be `{ src, alt }` records or bare URL strings.
 *
 * Invalid entries (no src), and any frame repeating the primary, are dropped.
 * `hoverFrames` is never mandatory: missing / null / [] all resolve to [] and
 * the card stays a single, static still.
 *
 * No React, no DOM: everything here is unit-testable under `node --test`.
 */

const hasText = (value) => typeof value === "string" && value.trim().length > 0;

/** One image reference → `{ src, alt }`, or null when it carries no source. */
export function normalizeMediaFrame(frame) {
  if (hasText(frame)) return { src: frame, alt: "" };
  if (!frame || typeof frame !== "object" || !hasText(frame.src)) return null;
  return { src: frame.src, alt: hasText(frame.alt) ? frame.alt : "" };
}

/** Resolve `{ primary, hoverFrames }` for a product record (never throws). */
export function resolveProductMedia(product) {
  const primary =
    normalizeMediaFrame(product?.media?.primary) ??
    normalizeMediaFrame(product?.images?.[0]) ??
    null;

  const raw = Array.isArray(product?.media?.hoverFrames) ? product.media.hoverFrames : [];
  const seen = new Set(primary ? [primary.src] : []);
  const hoverFrames = [];
  for (const entry of raw) {
    const frame = normalizeMediaFrame(entry);
    if (!frame || seen.has(frame.src)) continue;
    seen.add(frame.src);
    hoverFrames.push(frame);
  }

  return { primary, hoverFrames };
}

/** The product with its resolved `media` contract attached. Idempotent. */
export function withProductMedia(product) {
  if (!product || typeof product !== "object") return product;
  return { ...product, media: resolveProductMedia(product) };
}

/**
 * The product detail gallery's plates: the piece's own images followed by
 * any hover-angle photographs not already among them. The gallery keeps its
 * own selector logic; this only decides which stills it is given.
 */
export function productGalleryImages(product) {
  const images = (product?.images ?? []).map(normalizeMediaFrame).filter(Boolean);
  const seen = new Set(images.map((image) => image.src));
  const { hoverFrames } = product?.media ?? resolveProductMedia(product);
  for (const frame of hoverFrames ?? []) {
    if (seen.has(frame.src)) continue;
    seen.add(frame.src);
    images.push(frame);
  }
  return images;
}

export const productMediaService = {
  normalizeMediaFrame,
  resolveProductMedia,
  withProductMedia,
  productGalleryImages,
};

export default productMediaService;
