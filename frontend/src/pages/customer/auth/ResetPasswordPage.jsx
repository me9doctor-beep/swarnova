import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AuthAlert from "../../../components/auth/AuthAlert.jsx";
import AuthShell from "../../../components/auth/AuthShell.jsx";
import Button from "../../../components/ui/Button.jsx";
import Input from "../../../components/ui/Input.jsx";
import { usePasswordReset } from "../../../features/customer-auth/usePasswordReset.js";
import { translateCustomerAuthError } from "../../../features/customer-auth/customerAuthErrors.js";
import {
  CUSTOMER_FORGOT_PASSWORD_PATH,
  CUSTOMER_LOGIN_PATH,
} from "../../../features/customer-auth/customerRoutes.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { validateResetConfirm } from "./authValidation.js";

/**
 * RESET PASSWORD — `/reset-password?token=…`.
 *
 * Consumes the reset reference the provider issued — from the link when the
 * customer follows one, or pasted by hand. The reference stays opaque: it is
 * never validated or trusted in the UI, only handed to the provider, which
 * is the authority on whether it is valid — exactly as the backend will be.
 */
export default function ResetPasswordPage() {
  useDocumentTitle("Reset Password — Swarnova");
  const [params] = useSearchParams();
  const { confirmReset, busy, error, clearError } = usePasswordReset();

  const [form, setForm] = useState({
    token: params.get("token") ?? "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(false);

  useEffect(() => {
    const tokenParam = params.get("token");
    if (tokenParam) {
      setForm((prev) => (prev.token !== tokenParam ? { ...prev, token: tokenParam } : prev));
    }
  }, [params]);

  const update = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    if (error) clearError();
  };

  const submit = async (event) => {
    event.preventDefault();
    const next = validateResetConfirm(form);
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    try {
      await confirmReset(form);
      setDone(true);
    } catch {
      /* `error` renders the translated provider message below. */
    }
  };

  if (done) {
    return (
      <AuthShell
        eyebrow="The Client Salon"
        title="Password reset"
        lede="Your new password is set — welcome back to your salon."
      >
        <div className="space-y-4">
          <AuthAlert tone="success">
            Your password has been reset. Sign in with your new password to
            continue.
          </AuthAlert>
          <Button href={CUSTOMER_LOGIN_PATH} className="w-full">
            Sign In
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="The Client Salon"
      title="Choose a new password"
      lede="Your reset reference arrives with your link — it can be used once."
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Input
          label="Reset reference"
          type="text"
          autoComplete="off"
          required
          value={form.token}
          onChange={update("token")}
          error={errors.token}
          placeholder="From your reset link"
        />
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          required
          value={form.password}
          onChange={update("password")}
          error={errors.password}
          hint="At least 8 characters."
          placeholder="Choose a new password"
        />
        <Input
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          required
          value={form.confirmPassword}
          onChange={update("confirmPassword")}
          error={errors.confirmPassword}
          placeholder="Repeat your new password"
        />

        {error ? (
          <AuthAlert>{translateCustomerAuthError(error)}</AuthAlert>
        ) : null}

        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Resetting…" : "Reset Password"}
        </Button>
      </form>

      <div className="mt-6 border-t border-border-subtle pt-6 text-center">
        <p className="font-sans text-body-sm text-text-secondary">
          Link expired?{" "}
          <Link
            to={CUSTOMER_FORGOT_PASSWORD_PATH}
            className="font-medium text-brand-primary underline-offset-4 hover:text-brand-accent-strong hover:underline"
          >
            Request a new one
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
