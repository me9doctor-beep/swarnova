import { useCallback, useMemo } from "react";
import { useDataProvider } from "../services/providers/DataProvider.jsx";
import {
  checkoutService,
  checkoutItemsSignature,
  toCheckoutItems,
} from "../services/checkoutService.js";
import { useAsync } from "./useAsync.js";

/**
 * CHECKOUT SUMMARY HOOK (Phase 12)
 * -----------------------------------------------------------------------------
 * The validated quote for the current shopping bag, fetched through the
 * commerce boundary: purchasable lines at canonical prices, the fulfilling
 * boutique, the ONE totals calculation and any blocking issues (stock,
 * availability). Refreshes whenever the bag's line signature changes —
 * quantities and pieces, not object identities.
 */
export function useCheckoutSummary(cartItems) {
  const provider = useDataProvider();

  /* Depend on the line signature, not the array identity, so a re-render
     with the same bag does not re-quote. */
  const signature = useMemo(
    () => checkoutItemsSignature(cartItems),
    [cartItems]
  );

  const task = useCallback(
    () => checkoutService.getSummary(provider, toCheckoutItems(cartItems)),
    // `cartItems` is deliberately read through `signature` above — the quote
    // refreshes when the bag's lines change, not on every re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [provider, signature]
  );

  const asyncState = useAsync(task, [provider, signature]);

  return {
    ...asyncState,
    summary: asyncState.data ?? null,
  };
}

export default useCheckoutSummary;
