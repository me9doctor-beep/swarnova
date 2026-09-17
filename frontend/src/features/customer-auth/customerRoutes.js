/**
 * CUSTOMER AUTH ROUTES (Phase 11)
 * ----------------------------------------------------------------------------
 * The single source of truth for the customer authentication surface:
 *
 *   PUBLIC                    /login  /register  /forgot-password  /reset-password
 *   AUTHENTICATED CUSTOMER    /account  /account/profile  /account/wishlist
 *                             /account/saved-designs  /account/saved-try-ons
 *                             /account/addresses  /account/orders  /account/orders/:id
 *
 * Staff (`/staff/login`, `/super-admin/*`, `/admin/*`, `/employee/*`) is a
 * separate audience with its own login and guards — never merged with this one.
 */

export const CUSTOMER_LOGIN_PATH = "/login";
export const CUSTOMER_REGISTER_PATH = "/register";
export const CUSTOMER_FORGOT_PASSWORD_PATH = "/forgot-password";
export const CUSTOMER_RESET_PASSWORD_PATH = "/reset-password";

/** Where an authenticated customer lands — sign-in, sign-up and gate bounces. */
export const CUSTOMER_HOME_PATH = "/account";

/**
 * Keep only same-origin absolute paths — `//evil`, `https:` and
 * `javascript:` fall back instead of becoming open redirects.
 */
export function safeReturnTo(value, fallback = CUSTOMER_HOME_PATH) {
  if (
    typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//")
  ) {
    return value;
  }
  return fallback;
}

/** `/login?returnTo=…` for a guarded destination; plain `/login` without one. */
export function loginPathWithReturnTo(returnTo) {
  const safe = safeReturnTo(returnTo, null);
  if (!safe) return CUSTOMER_LOGIN_PATH;
  return `${CUSTOMER_LOGIN_PATH}?returnTo=${encodeURIComponent(safe)}`;
}

/**
 * Carry a return destination across auth links (`/login` ↔ `/register`).
 * The account home is the default landing anyway, so it needs no param.
 */
export function withReturnTo(path, returnTo) {
  const safe = safeReturnTo(returnTo, null);
  if (!safe || safe === CUSTOMER_HOME_PATH) return path;
  return `${path}?returnTo=${encodeURIComponent(safe)}`;
}
