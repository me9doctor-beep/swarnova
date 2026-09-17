import { useCallback } from "react";
import { useDataProvider } from "../services/providers/DataProvider.jsx";
import { catalogService } from "../services/catalogService.js";
import { useCart } from "../state/CartContext.jsx";

/**
 * CANONICAL BAG ADDITION
 * -----------------------------------------------------------------------------
 * `CartContext` stores whatever it is handed, and every surface that shows a
 * full product record (the catalogue cards, the product detail screen) hands it
 * the canonical piece straight away. Two journeys arrive at the bag with only
 * an id — the fitting room's "Add to Bag" and a saved try-on snapshot — and a
 * snapshot taken earlier in the visit is not authority: the catalogue may have
 * moved on, and a concept that was never a product must not become one here.
 *
 * This hook is that missing step: it re-resolves the id through the existing
 * product contract (`catalogService.getProduct` → provider → canonical store)
 * and puts THAT record in the bag. The provider only ever answers with a
 * published piece, so a retired or unpublished product resolves to `null` and
 * the caller says so instead of inventing a bag line.
 *
 *   const { addCanonical } = useAddProductToBag();
 *   const { added } = await addCanonical(product.id);
 */
export function useAddProductToBag() {
  const provider = useDataProvider();
  const { add } = useCart();

  const addCanonical = useCallback(
    async (productId, quantity = 1) => {
      if (!productId) return { added: false, product: null, reason: "missing-id" };
      const product = await catalogService.getProduct(provider, productId);
      /* Unpublished and unknown ids resolve to the same answer the rest of the
         storefront gets: there is nothing here to buy. */
      if (!product) return { added: false, product: null, reason: "unavailable" };
      add(product, quantity);
      return { added: true, product, reason: null };
    },
    [provider, add]
  );

  return { addCanonical };
}

export default useAddProductToBag;
