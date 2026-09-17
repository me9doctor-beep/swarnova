import { useCallback, useRef, useState } from "react";

/**
 * CHECKOUT SESSION (Phase 12)
 * -----------------------------------------------------------------------------
 * The lightweight client half of checkout: an id for this visit's checkout,
 * plus the customer's selections as they move through the page. There is no
 * persistent mock "checkout database" — the selections live in this hook for
 * the life of the page, and everything that matters (address ownership,
 * methods, totals, stock) is re-resolved by the provider when the order is
 * actually placed.
 *
 * `checkoutId` doubles as the payload's `idempotencyKey`: it stays stable
 * across retries of the SAME checkout (a declined payment retried with the
 * same key can never silently duplicate an order against a real backend)
 * and a fresh visit to /checkout begins a new session with a new id.
 */
export function createCheckoutId() {
  const stamp = Date.now().toString(36).toUpperCase();
  const entropy = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `CHK-${stamp}-${entropy}`;
}

const INITIAL_SELECTION = {
  addressId: null,
  deliveryMethod: null,
  paymentMethod: null,
  paymentDetail: null,
};

export function useCheckoutSession() {
  const checkoutIdRef = useRef(null);
  if (!checkoutIdRef.current) {
    checkoutIdRef.current = createCheckoutId();
  }

  const [selection, setSelection] = useState(INITIAL_SELECTION);

  const patch = useCallback((next) => {
    setSelection((previous) => ({ ...previous, ...next }));
  }, []);

  const reset = useCallback(() => setSelection(INITIAL_SELECTION), []);

  return { checkoutId: checkoutIdRef.current, selection, patch, reset };
}

export default useCheckoutSession;
