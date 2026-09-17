/**
 * CUSTOMER AUTH ERRORS (Phase 11)
 * ----------------------------------------------------------------------------
 * The provider rejects with `{ code, message }` — the mock's stand-in for an
 * API error envelope. This module translates `code` into the exact
 * customer-facing copy, so no technical backend detail ever reaches the
 * storefront. Unknown failures degrade to the provider's own safe message,
 * then to a generic house apology.
 */

/** Stable codes the provider rejects with (mirrors the mock store). */
export const CUSTOMER_AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  EMAIL_TAKEN: "EMAIL_TAKEN",
  PHONE_TAKEN: "PHONE_TAKEN",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NETWORK_ERROR: "NETWORK_ERROR",
  SERVER_ERROR: "SERVER_ERROR",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  NOT_FOUND: "NOT_FOUND",
  RESET_FAILURE: "RESET_FAILURE",
  /* Phase 13.5: Google OAuth codes */
  OAUTH_CANCELLED: "OAUTH_CANCELLED",
  OAUTH_FAILED: "OAUTH_FAILED",
  OAUTH_ACCOUNT_CONFLICT: "OAUTH_ACCOUNT_CONFLICT",
  BACKEND_UNAVAILABLE: "BACKEND_UNAVAILABLE",
  PROVIDER_UNAVAILABLE: "PROVIDER_UNAVAILABLE",
};

const FALLBACK_MESSAGE =
  "Something went wrong on our side. Please try again in a moment.";

const MESSAGES = {
  [CUSTOMER_AUTH_ERROR_CODES.INVALID_CREDENTIALS]:
    "We could not sign you in with those details. Check your email or phone number and password, then try again.",
  [CUSTOMER_AUTH_ERROR_CODES.EMAIL_TAKEN]:
    "An account already exists with this email address. Try signing in instead.",
  [CUSTOMER_AUTH_ERROR_CODES.PHONE_TAKEN]:
    "An account already exists with this phone number. Try signing in instead.",
  [CUSTOMER_AUTH_ERROR_CODES.SESSION_EXPIRED]:
    "Your session has expired. Please sign in again.",
  [CUSTOMER_AUTH_ERROR_CODES.NOT_FOUND]:
    "We could not find what you were looking for.",
  [CUSTOMER_AUTH_ERROR_CODES.RESET_FAILURE]:
    "This reset link is invalid or has already been used. Request a new one to continue.",
  [CUSTOMER_AUTH_ERROR_CODES.NETWORK_ERROR]:
    "We could not reach Swarnova. Check your connection and try again.",
  [CUSTOMER_AUTH_ERROR_CODES.SERVER_ERROR]: FALLBACK_MESSAGE,
  [CUSTOMER_AUTH_ERROR_CODES.OAUTH_CANCELLED]:
    "Google sign-in was cancelled. Please try again.",
  [CUSTOMER_AUTH_ERROR_CODES.OAUTH_FAILED]:
    "We could not sign you in with Google. Please try again or sign in with your email or phone.",
  [CUSTOMER_AUTH_ERROR_CODES.OAUTH_ACCOUNT_CONFLICT]:
    "An account already exists with this email address. Please sign in with your password.",
  [CUSTOMER_AUTH_ERROR_CODES.BACKEND_UNAVAILABLE]:
    "Google sign-in is currently unavailable. Please sign in with your email or phone number and password.",
  [CUSTOMER_AUTH_ERROR_CODES.PROVIDER_UNAVAILABLE]:
    "Google sign-in is currently unavailable. Please try again in a moment or use your email and password.",
};

/**
 * Translate a provider rejection into customer-facing copy.
 * Validation failures keep the provider's specific message (it names the
 * field); everything coded maps to the house copy above.
 */
export function translateCustomerAuthError(error) {
  if (!error) return FALLBACK_MESSAGE;
  const code = error.code;
  if (code === CUSTOMER_AUTH_ERROR_CODES.VALIDATION_ERROR) {
    return (
      error.message || "Please review the highlighted fields and try again."
    );
  }
  if (code && MESSAGES[code]) return MESSAGES[code];
  /* A failed fetch surfaces as a TypeError — read it as a network failure. */
  if (error instanceof TypeError) return MESSAGES.NETWORK_ERROR;
  if (typeof error.message === "string" && error.message.trim()) {
    return error.message;
  }
  return FALLBACK_MESSAGE;
}

export default translateCustomerAuthError;
