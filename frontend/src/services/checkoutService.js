import { calculateTotals } from "./pricingService.js";

/**
 * CHECKOUT SERVICES (Phase 12)
 * -----------------------------------------------------------------------------
 * The domain boundary of the commerce journey: the presentation layer maps
 * its state through the helpers below and calls the service; the service
 * hands clean domain payloads to the DataProvider — never React state,
 * rendered strings or UI objects. Replacing the mock provider with the API
 * provider changes nothing here.
 *
 *   UI → Page → Hook → checkoutService → DataProvider → provider
 *
 *   getSummary(provider, items)     the validated quote for the current bag
 *   getDeliveryMethods(provider)    canonical delivery surface
 *   getPaymentMethods(provider)     canonical payment surface
 *   placeOrder(provider, payload)   the ONE order-creating domain operation
 *
 * The totals themselves are computed in ONE place (`pricingService.js`) by
 * the provider behind this boundary — the UI only displays results.
 */

/**
 * Shopping-bag lines → checkout lines. Only the product id and the
 * quantity cross the boundary — everything else (name, price, imagery,
 * stock) is re-resolved from the canonical catalogue by the provider, so a
 * stale client snapshot can never price an order.
 */
export function toCheckoutItems(cartItems = []) {
  if (!Array.isArray(cartItems)) return [];
  return cartItems
    .map((item) => ({
      id: String(item?.id ?? item?.product?.id ?? "").trim(),
      quantity: Number(item?.quantity),
    }))
    .filter((item) => item.id && Number.isInteger(item.quantity) && item.quantity > 0);
}

/** A stable signature of the checkout lines, for quote refresh effects. */
export function checkoutItemsSignature(cartItems = []) {
  return toCheckoutItems(cartItems)
    .map((item) => `${item.id}:${item.quantity}`)
    .join("|");
}

/**
 * UI checkout state → the backend-ready payload. Exactly the fields a
 * future `POST /checkout/orders` accepts — a session-resolved customer is
 * implied by the provider session, never sent as a claim:
 *
 *   { idempotencyKey, items, addressId, deliveryMethod,
 *     paymentMethod, paymentDetail }
 */
export function buildCheckoutPayload({
  checkoutId,
  items = [],
  addressId,
  deliveryMethod,
  paymentMethod,
  paymentDetail,
} = {}) {
  return {
    idempotencyKey: checkoutId,
    items: toCheckoutItems(items),
    addressId: addressId ?? null,
    deliveryMethod: deliveryMethod ?? null,
    paymentMethod: paymentMethod ?? null,
    paymentDetail: paymentMethod && paymentDetail ? { ...paymentDetail } : null,
  };
}

/**
 * Client-safe shape check for the one payment detail checkout may ask for —
 * a UPI handle (never a credential). This mirrors the provider's own
 * enforcement; it exists only so the form can show an early inline error.
 */
export function isValidUpiId(value) {
  return /^[\w.\-]{2,64}@[a-zA-Z]{2,32}$/.test(String(value ?? "").trim());
}

export const checkoutService = {
  /** The validated quote: lines, fulfilment branch, totals and issues. */
  getSummary(provider, items) {
    return provider.getCheckoutSummary(items);
  },

  getDeliveryMethods(provider) {
    return provider.getDeliveryMethods();
  },

  getPaymentMethods(provider) {
    return provider.getPaymentMethods();
  },

  /**
   * Place the order. Resolves `{ order, payment }` on success; rejects with
   * a coded checkout error (`CHECKOUT_CODES` — see the provider boundary)
   * for every business rejection: empty bag, unavailable piece, foreign
   * address, invalid method, missing stock, declined payment. A replayed
   * idempotency key resolves with the original order and `replay: true`.
   */
  placeOrder(provider, payload) {
    return provider.placeOrder(payload);
  },

  /** Display helper — the canonical totals for a delivery charge. */
  calculateTotals,
};

export default checkoutService;
