/**
 * CHECKOUT ERRORS (Phase 12)
 * -----------------------------------------------------------------------------
 * The provider rejects with `{ code, message }` — the mock's stand-in for an
 * API error envelope. This module translates `code` into the exact
 * customer-facing copy, so no technical backend detail ever reaches the
 * storefront. Unknown failures degrade to the provider's own safe message,
 * then to a generic house apology.
 */

/** Stable codes the provider rejects with (mirrors the mock store). */
export const CHECKOUT_ERROR_CODES = {
  SESSION_EXPIRED: "SESSION_EXPIRED",
  CART_EMPTY: "CART_EMPTY",
  PRODUCT_UNAVAILABLE: "PRODUCT_UNAVAILABLE",
  INVALID_QUANTITY: "INVALID_QUANTITY",
  PRICE_UNAVAILABLE: "PRICE_UNAVAILABLE",
  ADDRESS_REQUIRED: "ADDRESS_REQUIRED",
  ADDRESS_NOT_FOUND: "ADDRESS_NOT_FOUND",
  DELIVERY_METHOD_INVALID: "DELIVERY_METHOD_INVALID",
  PAYMENT_METHOD_INVALID: "PAYMENT_METHOD_INVALID",
  PAYMENT_INFO_REQUIRED: "PAYMENT_INFO_REQUIRED",
  OUT_OF_STOCK: "OUT_OF_STOCK",
  PAYMENT_DECLINED: "PAYMENT_DECLINED",
};

const FALLBACK =
  "We could not complete your checkout. Your bag is safe — please try again in a moment.";

const MESSAGES = {
  [CHECKOUT_ERROR_CODES.SESSION_EXPIRED]:
    "Your session has expired. Please sign in again to complete your checkout.",
  [CHECKOUT_ERROR_CODES.CART_EMPTY]:
    "Your shopping bag is empty. Add a piece before checking out.",
  [CHECKOUT_ERROR_CODES.PRODUCT_UNAVAILABLE]:
    "One of the pieces in your bag is no longer available. Please review your bag and continue without it.",
  [CHECKOUT_ERROR_CODES.INVALID_QUANTITY]:
    "Please review the quantities in your bag — one of them is not valid.",
  [CHECKOUT_ERROR_CODES.PRICE_UNAVAILABLE]:
    "A price for one of your pieces could not be confirmed. Please review your bag.",
  [CHECKOUT_ERROR_CODES.ADDRESS_REQUIRED]: "Choose a delivery address to continue.",
  [CHECKOUT_ERROR_CODES.ADDRESS_NOT_FOUND]:
    "We could not use that delivery address. Please choose one of your saved addresses.",
  [CHECKOUT_ERROR_CODES.DELIVERY_METHOD_INVALID]:
    "Choose one of the available delivery methods.",
  [CHECKOUT_ERROR_CODES.PAYMENT_METHOD_INVALID]:
    "Choose one of the available payment methods.",
  [CHECKOUT_ERROR_CODES.PAYMENT_INFO_REQUIRED]:
    "Add the payment detail your chosen method asks for, then place your order.",
  [CHECKOUT_ERROR_CODES.OUT_OF_STOCK]:
    "A piece in your bag is no longer available in the quantities requested. Please adjust your bag and try again.",
  [CHECKOUT_ERROR_CODES.PAYMENT_DECLINED]:
    "Your payment was declined. No order was created and nothing was charged — your bag is safe. Please try another payment method.",
};

/**
 * The display shape the checkout renders:
 *   { title, message } — the message is always customer-safe.
 */
export function translateCheckoutError(error) {
  const code = error?.code;
  const message = MESSAGES[code];
  if (message) {
    const titles = {
      [CHECKOUT_ERROR_CODES.PAYMENT_DECLINED]: "Payment declined",
      [CHECKOUT_ERROR_CODES.OUT_OF_STOCK]: "Pieces unavailable",
      [CHECKOUT_ERROR_CODES.ADDRESS_REQUIRED]: "Delivery address needed",
      [CHECKOUT_ERROR_CODES.ADDRESS_NOT_FOUND]: "Delivery address unavailable",
      [CHECKOUT_ERROR_CODES.PAYMENT_METHOD_INVALID]: "Payment method needed",
      [CHECKOUT_ERROR_CODES.PAYMENT_INFO_REQUIRED]: "Payment detail needed",
      [CHECKOUT_ERROR_CODES.DELIVERY_METHOD_INVALID]: "Delivery method needed",
      [CHECKOUT_ERROR_CODES.SESSION_EXPIRED]: "Session expired",
      [CHECKOUT_ERROR_CODES.CART_EMPTY]: "Your bag is empty",
      [CHECKOUT_ERROR_CODES.PRODUCT_UNAVAILABLE]: "Pieces unavailable",
      [CHECKOUT_ERROR_CODES.INVALID_QUANTITY]: "Quantity unavailable",
      [CHECKOUT_ERROR_CODES.PRICE_UNAVAILABLE]: "Price unavailable",
    };
    return { title: titles[code] ?? "Checkout incomplete", message };
  }
  return {
    title: "Checkout incomplete",
    message:
      (typeof error?.message === "string" && error.message.trim()) || FALLBACK,
  };
}

export default translateCheckoutError;
