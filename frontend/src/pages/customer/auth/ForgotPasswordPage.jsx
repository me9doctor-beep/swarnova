import { useState } from "react";
import { Link } from "react-router-dom";
import AuthAlert from "../../../components/auth/AuthAlert.jsx";
import AuthShell from "../../../components/auth/AuthShell.jsx";
import DemoAccessBox from "../../../components/auth/DemoAccessBox.jsx";
import Button from "../../../components/ui/Button.jsx";
import Input from "../../../components/ui/Input.jsx";
import { usePasswordReset } from "../../../features/customer-auth/usePasswordReset.js";
import { translateCustomerAuthError } from "../../../features/customer-auth/customerAuthErrors.js";
import {
  CUSTOMER_LOGIN_PATH,
  CUSTOMER_RESET_PASSWORD_PATH,
} from "../../../features/customer-auth/customerRoutes.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { validateResetRequest } from "./authValidation.js";

/**
 * FORGOT PASSWORD — `/forgot-password`.
 *
 * One identifier, one provider action. The response never discloses whether
 * an account exists for the details — exactly as the API will behave — and
 * the mock's reset reference surfaces only inside the development-only
 * disclosure, never as a pretended email.
 */
export default function ForgotPasswordPage() {
  useDocumentTitle("Forgot Password — Swarnova");
  const { requestReset, busy, error, clearError } = usePasswordReset();

  const [identifier, setIdentifier] = useState("");
  const [fieldError, setFieldError] = useState(undefined);
  const [requested, setRequested] = useState(null);

  const submit = async (event) => {
    event.preventDefault();
    const next = validateResetRequest({ identifier });
    setFieldError(next.identifier);
    if (Object.keys(next).length > 0) return;
    try {
      const result = await requestReset(identifier);
      setRequested(result);
    } catch {
      /* `error` renders the translated provider message below. */
    }
  };

  if (requested) {
    return (
      <AuthShell
        eyebrow="The Client Salon"
        title="Check your inbox"
        lede="If an account exists for these details, reset instructions are on their way."
        footer={
          requested.devReference ? (
            <DemoAccessBox summary="Development reference">
              <p>
                While authentication runs on mock data, the provider issued
                this reset reference instead of sending an email. A real
                email provider replaces this in a later phase.
              </p>
              <p>
                <code className="text-text-primary">
                  {requested.devReference}
                </code>
              </p>
              <p>
                <Link
                  to={`${CUSTOMER_RESET_PASSWORD_PATH}?token=${encodeURIComponent(requested.devReference)}`}
                  className="font-medium text-brand-primary underline-offset-4 hover:text-brand-accent-strong hover:underline"
                >
                  Continue with this reference
                </Link>
              </p>
            </DemoAccessBox>
          ) : null
        }
      >
        <div className="space-y-4">
          <AuthAlert tone="success">
            Reset requested. The link arrives by email or SMS and can be used
            once — if nothing arrives, check the details and try again.
          </AuthAlert>
          <Button href={CUSTOMER_LOGIN_PATH} variant="outline" className="w-full">
            Return to Sign In
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="The Client Salon"
      title="Forgot password"
      lede="Enter the email or phone number on your account — we will send a reset link."
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Input
          label="Email or phone number"
          type="text"
          autoComplete="username"
          required
          value={identifier}
          onChange={(event) => {
            setIdentifier(event.target.value);
            setFieldError(undefined);
            if (error) clearError();
          }}
          error={fieldError}
          placeholder="you@example.com"
        />

        {error ? (
          <AuthAlert>{translateCustomerAuthError(error)}</AuthAlert>
        ) : null}

        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Sending…" : "Send Reset Link"}
        </Button>
      </form>

      <div className="mt-6 border-t border-border-subtle pt-6 text-center">
        <p className="font-sans text-body-sm text-text-secondary">
          Remembered it?{" "}
          <Link
            to={CUSTOMER_LOGIN_PATH}
            className="font-medium text-brand-primary underline-offset-4 hover:text-brand-accent-strong hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
