/**
 * CUSTOMER AUTH FORM VALIDATION (Phase 11)
 * ----------------------------------------------------------------------------
 * Pure, UI-side validators for the four auth forms. They catch the mistakes
 * a customer can fix before a round trip (empty fields, malformed email,
 * mismatched confirmation, unticked consent) — the provider remains the
 * authority on credentials, uniqueness and tokens, and its rejections
 * render through `translateCustomerAuthError`, never through these.
 */

export const CUSTOMER_PASSWORD_MIN_LENGTH = 8;

export function isEmailLike(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? "").trim());
}

export function isPhoneLike(value) {
  return /^[+\d][\d\s-]{7,}$/.test(String(value ?? "").trim());
}

const isBlank = (value) => String(value ?? "").trim().length === 0;

/** Sign-in takes one identifier — email or phone — plus the password. */
export function validateLogin({ identifier, password }) {
  const errors = {};
  if (isBlank(identifier)) {
    errors.identifier = "Enter your email address or phone number.";
  }
  if (isBlank(password)) {
    errors.password = "Enter your password.";
  }
  return errors;
}

export function validateRegistration({
  name,
  email,
  phone,
  password,
  confirmPassword,
  acceptedTerms,
}) {
  const errors = {};
  if (isBlank(name) || String(name).trim().length < 2) {
    errors.name = "Enter your full name.";
  }
  if (isBlank(email)) {
    errors.email = "Enter your email address.";
  } else if (!isEmailLike(email)) {
    errors.email = "Enter a valid email address.";
  }
  if (isBlank(phone)) {
    errors.phone = "Enter your phone number.";
  } else if (!isPhoneLike(phone)) {
    errors.phone = "Enter a valid phone number.";
  }
  if (isBlank(password)) {
    errors.password = "Choose a password.";
  } else if (String(password).length < CUSTOMER_PASSWORD_MIN_LENGTH) {
    errors.password = `Use at least ${CUSTOMER_PASSWORD_MIN_LENGTH} characters.`;
  }
  if (isBlank(confirmPassword)) {
    errors.confirmPassword = "Confirm your password.";
  } else if (confirmPassword !== password) {
    errors.confirmPassword = "Passwords do not match.";
  }
  if (!acceptedTerms) {
    errors.acceptedTerms = "Please accept the terms to create your account.";
  }
  return errors;
}

export function validateResetRequest({ identifier }) {
  const errors = {};
  if (isBlank(identifier)) {
    errors.identifier = "Enter your email address or phone number.";
  }
  return errors;
}

export function validateResetConfirm({ token, password, confirmPassword }) {
  const errors = {};
  if (isBlank(token)) {
    errors.token = "Enter the reset reference from your link.";
  }
  if (isBlank(password)) {
    errors.password = "Choose a new password.";
  } else if (String(password).length < CUSTOMER_PASSWORD_MIN_LENGTH) {
    errors.password = `Use at least ${CUSTOMER_PASSWORD_MIN_LENGTH} characters.`;
  }
  if (isBlank(confirmPassword)) {
    errors.confirmPassword = "Confirm your new password.";
  } else if (confirmPassword !== password) {
    errors.confirmPassword = "Passwords do not match.";
  }
  return errors;
}
