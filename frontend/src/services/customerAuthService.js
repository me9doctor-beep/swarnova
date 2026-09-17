/**
 * CUSTOMER AUTHENTICATION SERVICE (Phase 11)
 * -----------------------------------------------------------------------------
 * The ONE customer sign-in boundary — login, registration, session, logout
 * and the password-reset contract. Credentials and payloads go in; the
 * provider resolves them against the canonical customer registry and
 * returns a session shaped exactly like the future backend's response:
 *
 *   { authenticated: true, customer: { id, name, email, phone, status, … } }
 *
 * Flow: AuthPage → useCustomerLogin / useCustomerRegister / usePasswordReset
 *       → customerAuthService → DataProvider → Mock Provider (store).
 *
 * Customer identity is a separate domain from staff RBAC: this service never
 * issues roles, permissions or capabilities, and no staff surface consumes it.
 * Frontend session handling is UX only; the backend is the only authority.
 */
export const customerAuthService = {
  /** Resolve email-or-phone + password to a customer session. */
  login(provider, credentials = {}) {
    return provider.authenticateCustomer({
      identifier: String(credentials.identifier ?? credentials.email ?? "").trim(),
      password: String(credentials.password ?? ""),
    });
  },

  /** Create a customer account and sign straight in. */
  register(provider, payload = {}) {
    return provider.registerCustomer({
      name: String(payload.name ?? "").trim(),
      email: String(payload.email ?? "").trim(),
      phone: String(payload.phone ?? "").trim(),
      password: String(payload.password ?? ""),
    });
  },

  /** Resolve the current session — `{ authenticated, customer }`. */
  getCurrentCustomer(provider) {
    return provider.getCurrentCustomer();
  },

  /** Clear the customer session. */
  logout(provider) {
    return provider.logoutCustomer();
  },

  /**
   * Request a password reset for an email or phone number. Always resolves
   * `{ requested: true }` — the response never discloses whether an account
   * exists, exactly as the API will.
   */
  requestPasswordReset(provider, identifier) {
    return provider.requestCustomerPasswordReset(String(identifier ?? "").trim());
  },

  /** Consume a reset token with a new password. */
  resetPassword(provider, payload = {}) {
    return provider.resetCustomerPassword({
      token: String(payload.token ?? "").trim(),
      password: String(payload.password ?? ""),
    });
  },

  /**
   * Initiate Google OAuth flow for a customer (Phase 13.5).
   * Hands { returnTo } to the provider. The provider/backend initiates the
   * authorization redirect or returns the redirect URL.
   */
  initiateGoogleOAuth(provider, options = {}) {
    if (!provider?.initiateCustomerGoogleOAuth) {
      const error = new Error("Google sign-in is not supported by this provider.");
      error.code = "PROVIDER_UNAVAILABLE";
      return Promise.reject(error);
    }
    return provider.initiateCustomerGoogleOAuth({
      returnTo: String(options.returnTo ?? "").trim() || "/account",
    });
  },

  /**
   * Complete Google OAuth flow upon return/callback from Google/backend.
   * Hands payload (e.g. { code, token, error, returnTo }) to the provider to
   * establish the customer session.
   */
  completeGoogleOAuth(provider, payload = {}) {
    if (!provider?.completeCustomerGoogleOAuth) {
      const error = new Error("Google sign-in is not supported by this provider.");
      error.code = "PROVIDER_UNAVAILABLE";
      return Promise.reject(error);
    }
    return provider.completeCustomerGoogleOAuth(payload);
  },
};

export default customerAuthService;
