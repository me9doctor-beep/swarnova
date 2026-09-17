import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthAlert from "../../../components/auth/AuthAlert.jsx";
import AuthShell from "../../../components/auth/AuthShell.jsx";
import GoogleSignInButton from "../../../components/auth/GoogleSignInButton.jsx";
import Button from "../../../components/ui/Button.jsx";
import Checkbox from "../../../components/ui/Checkbox.jsx";
import Input from "../../../components/ui/Input.jsx";
import { useCustomerRegister } from "../../../features/customer-auth/useCustomerRegister.js";
import { useCustomerGoogleAuth } from "../../../features/customer-auth/useCustomerGoogleAuth.js";
import { translateCustomerAuthError } from "../../../features/customer-auth/customerAuthErrors.js";
import {
  CUSTOMER_LOGIN_PATH,
  safeReturnTo,
  withReturnTo,
} from "../../../features/customer-auth/customerRoutes.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { validateRegistration } from "./authValidation.js";

/**
 * CUSTOMER REGISTRATION — `/register`.
 *
 * One quiet form — name, email, phone, password — and the new account signs
 * straight in, landing back where the customer was headed (`?returnTo=…`)
 * or in their account. No multi-step onboarding, no decoration.
 */
export default function CustomerRegisterPage() {
  useDocumentTitle("Create Account — Swarnova");
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const returnTo = safeReturnTo(params.get("returnTo"));
  const { register, busy: registerBusy, error: registerError, clearError: clearRegisterError } = useCustomerRegister();
  const {
    initiateGoogleAuth,
    isRedirecting,
    error: googleError,
    clearError: clearGoogleError,
  } = useCustomerGoogleAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    acceptedTerms: false,
  });
  const [errors, setErrors] = useState({});

  const update = (field) => (event) => {
    const value =
      field === "acceptedTerms" ? event.target.checked : event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    if (registerError) clearRegisterError();
    if (googleError) clearGoogleError();
  };

  const submit = async (event) => {
    event.preventDefault();
    const next = validateRegistration(form);
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    try {
      await register(form);
      navigate(returnTo, { replace: true });
    } catch {
      /* `registerError` renders the translated provider message below. */
    }
  };

  const handleGoogleSignUp = async () => {
    if (registerError) clearRegisterError();
    try {
      await initiateGoogleAuth({ returnTo });
    } catch {
      /* `googleError` renders below. */
    }
  };

  const activeError = registerError || googleError;
  const busy = registerBusy || isRedirecting;

  return (
    <AuthShell
      eyebrow="The Client Salon"
      title="Create your account"
      lede="One identity for your wishlist, orders and private atelier pieces."
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Input
          label="Full name"
          type="text"
          autoComplete="name"
          required
          value={form.name}
          onChange={update("name")}
          error={errors.name}
          placeholder="Your full name"
        />
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={update("email")}
          error={errors.email}
          placeholder="you@example.com"
        />
        <Input
          label="Phone number"
          type="tel"
          autoComplete="tel"
          required
          value={form.phone}
          onChange={update("phone")}
          error={errors.phone}
          placeholder="+91 98765 43210"
        />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          value={form.password}
          onChange={update("password")}
          error={errors.password}
          hint="At least 8 characters."
          placeholder="Choose a password"
        />
        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          required
          value={form.confirmPassword}
          onChange={update("confirmPassword")}
          error={errors.confirmPassword}
          placeholder="Repeat your password"
        />

        <div>
          <Checkbox
            label="I accept the Swarnova terms of service and privacy notice."
            checked={form.acceptedTerms}
            onChange={update("acceptedTerms")}
            aria-invalid={errors.acceptedTerms ? true : undefined}
            aria-describedby={errors.acceptedTerms ? "register-terms-error" : undefined}
          />
          {errors.acceptedTerms ? (
            <p
              id="register-terms-error"
              className="mt-1.5 font-sans text-caption text-state-error"
            >
              {errors.acceptedTerms}
            </p>
          ) : null}
        </div>

        {activeError ? (
          <AuthAlert>{translateCustomerAuthError(activeError)}</AuthAlert>
        ) : null}

        <Button type="submit" className="w-full" disabled={busy}>
          {registerBusy ? "Creating account…" : "Create Account"}
        </Button>
      </form>

      <GoogleSignInButton
        onClick={handleGoogleSignUp}
        busy={isRedirecting}
        disabled={busy}
        label="Sign up with Google"
      />

      <div className="mt-6 border-t border-border-subtle pt-6 text-center">
        <p className="font-sans text-body-sm text-text-secondary">
          Already a client?{" "}
          <Link
            to={withReturnTo(CUSTOMER_LOGIN_PATH, params.get("returnTo"))}
            className="font-medium text-brand-primary underline-offset-4 hover:text-brand-accent-strong hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
