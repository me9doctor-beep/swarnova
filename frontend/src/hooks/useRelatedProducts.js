import { useMemo } from "react";
import { useProducts } from "./useProducts.js";

/** Four pieces — one row of the catalogue grid at its widest. */
const RELATED_LIMIT = 4;

/**
 * Relevance of a catalogue piece against the one being viewed: same collection
 * counts for more than the same category, and everything else keeps the
 * provider's featured ordering (Array#sort is stable, so ties are not
 * reshuffled). No new data source — the rail is curated from the catalogue.
 */
function byRelevance(product) {
  return (item) =>
    (item.collectionId === product.collectionId ? 2 : 0) +
    (item.categoryId === product.categoryId ? 1 : 0);
}

/**
 * The "you may also like" rail for a product: a small curated set of the
 * closest pieces in the catalogue, the current product excluded. Returns the
 * usual async shape so the section can use AsyncBoundary like every other
 * data-driven block. Before a product resolves the set is simply empty.
 */
export function useRelatedProducts(product, limit = RELATED_LIMIT) {
  const { status, data, error, retry } = useProducts({});

  const related = useMemo(() => {
    if (!product || !data) return [];
    const score = byRelevance(product);
    return data
      .filter((item) => item.id !== product.id)
      .sort((a, b) => score(b) - score(a))
      .slice(0, limit);
  }, [data, product, limit]);

  return { status, data: related, error, retry };
}
