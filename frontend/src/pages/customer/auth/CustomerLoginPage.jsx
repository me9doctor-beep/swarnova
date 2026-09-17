import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthAlert from "../../../components/auth/AuthAlert.jsx";
import AuthShell from "../../../components/auth/AuthShell.jsx";
import DemoAccessBox from "../../../components/auth/DemoAccessBox.jsx";
import Button from "../../../components/ui/Button.jsx";
import Input from "../../../components/ui/Input.jsx";
import { useCustomerLogin } from "../../../features/customer-auth/useCustomerLogin.js";
import { translateCustomerAuthError } from "../../../features/customer-auth/customerAuthErrors.js";
import {
  CUSTOMER_FORGOT_PASSWORD_PATH,
  CUSTOMER_REGISTER_PATH,
  safeReturnTo,
  withReturnTo,
} from "../../../features/customer-auth/customerRoutes.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { validateLogin } from "./authValidation.js";

/**
 * CUSTOMER SIGN IN — `/login`.
 *
 * The storefront's own gateway (staff signs in at `/staff/login`, a
 * separate audience with a separate session). A successful sign-in lands
 * back where the customer was headed (`?returnTo=…`) or in their account.
 */

/** Demo accounts surfaced until a real identity provider lands. */
const DEMO_ACCOUNTS = [
  { label: "Aadya Sharma · Swarnova Privé", email: "aadya.sharma@swarnova.in" },
  { label: "Ritika Sengupta · Swarnova Classic", email: "ritika.sengupta@gmail.com" },
];

export default function CustomerLoginPage() {
  useDocumentTitle("Sign In — Swarnova");
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const returnTo = safeReturnTo(params.get("returnTo"));
  const { login, busy, error, clearError } = useCustomerLogin();

  const [form, setForm] = useState({ identifier: "", password: "" });
  const [errors, setErrors] = useState({});

  const update = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    if (error) clearError();
  };

  const submit = async (event) => {
    event.preventDefault();
    const next = validateLogin(form);
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    try {
      await login(form);
      navigate(returnTo, { replace: true });
    } catch {
      /* `error` renders the translated provider message below. */
    }
  };

  return (
    <AuthShell
      eyebrow="The Client Salon"
      title="Welcome back"
      lede="Sign in to your wishlist, orders and private atelier pieces."
      footer={
        <DemoAccessBox>
          <p>
            While authentication runs on mock data, every account below signs
            in with the password{" "}
            <code className="text-text-primary">Swarnova@123</code>. A real
            identity provider replaces this in a later phase.
          </p>
          <ul className="space-y-2">
            {DEMO_ACCOUNTS.map((account) => (
              <li
                key={account.email}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5"
              >
                <span className="font-sans text-caption text-text-secondary">
                  {account.label}
                </span>
                <code className="font-sans text-caption text-text-primary">
                  {account.email}
                </code>
              </li>
            ))}
          </ul>
        </DemoAccessBox>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Input
          label="Email or phone number"
          type="text"
          autoComplete="username"
          required
          value={form.identifier}
          onChange={update("identifier")}
          error={errors.identifier}
          placeholder="you@example.com"
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={form.password}
          onChange={update("password")}
          error={errors.password}
          placeholder="Your password"
        />

        {error ? (
          <AuthAlert>{translateCustomerAuthError(error)}</AuthAlert>
        ) : null}

        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Signing in…" : "Sign In"}
        </Button>
      </form>

      <div className="mt-6 space-y-3 border-t border-border-subtle pt-6 text-center">
        <p className="font-sans text-body-sm text-text-secondary">
          <Link
            to={CUSTOMER_FORGOT_PASSWORD_PATH}
            className="text-brand-primary underline-offset-4 hover:text-brand-accent-strong hover:underline"
          >
            Forgot password?
          </Link>
        </p>
        <p className="font-sans text-body-sm text-text-secondary">
          Don&apos;t have an account?{" "}
          <Link
            to={withReturnTo(CUSTOMER_REGISTER_PATH, params.get("returnTo"))}
            className="font-medium text-brand-primary underline-offset-4 hover:text-brand-accent-strong hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
