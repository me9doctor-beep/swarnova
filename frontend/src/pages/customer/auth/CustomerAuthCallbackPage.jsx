import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthAlert from "../../../components/auth/AuthAlert.jsx";
import AuthShell from "../../../components/auth/AuthShell.jsx";
import Button from "../../../components/ui/Button.jsx";
import { useCustomerGoogleAuth } from "../../../features/customer-auth/useCustomerGoogleAuth.js";
import { translateCustomerAuthError } from "../../../features/customer-auth/customerAuthErrors.js";
import {
  CUSTOMER_LOGIN_PATH,
  loginPathWithReturnTo,
  safeReturnTo,
} from "../../../features/customer-auth/customerRoutes.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";

/**
 * GOOGLE OAUTH CALLBACK — `/auth/callback` (Phase 13.5).
 *
 * The frontend landing point following backend-mediated Google OAuth.
 *
 * Flow:
 *   Google Consent → Backend callback handler → Redirect to /auth/callback
 *   → CustomerAuthCallbackPage calls completeGoogleAuth → Session established
 *   → Navigates to returnTo (or /account).
 *
 * Error handling:
 *   - Cancelled / aborted auth: translated to customer-safe copy
 *   - Backend token exchange failures: surfaced cleanly
 *   - Return link preserves the intended returnTo destination.
 */
export default function CustomerAuthCallbackPage() {
  useDocumentTitle("Verifying Session — Swarnova");
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const returnTo = safeReturnTo(params.get("returnTo"));
  const { completeGoogleAuth, isLoading, isSuccess } = useCustomerGoogleAuth();

  const [callbackError, setCallbackError] = useState(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    let alive = true;

    const errorParam = params.get("error");
    if (errorParam) {
      if (!alive) return;
      setProcessing(false);
      setCallbackError({
        code:
          errorParam === "access_denied" || errorParam === "cancelled"
            ? "OAUTH_CANCELLED"
            : "OAUTH_FAILED",
        message: params.get("error_description") || undefined,
      });
      return;
    }

    const code = params.get("code");
    const token = params.get("token");
    const mock = params.get("mock");

    if (!code && !token && !mock) {
      /* If hit directly with no OAuth exchange parameters, return to sign in. */
      navigate(CUSTOMER_LOGIN_PATH, { replace: true });
      return;
    }

    /* Complete the backend token exchange */
    completeGoogleAuth({
      code,
      token,
      mock,
      returnTo,
    })
      .then(() => {
        if (alive) {
          setProcessing(false);
          navigate(returnTo, { replace: true });
        }
      })
      .catch((caught) => {
        if (alive) {
          setProcessing(false);
          setCallbackError(caught);
        }
      });

    return () => {
      alive = false;
    };
  }, [params, completeGoogleAuth, navigate, returnTo]);

  if (callbackError) {
    return (
      <AuthShell
        eyebrow="The Client Salon"
        title="Authentication Issue"
        lede="We could not complete your sign in with Google."
      >
        <div className="space-y-5">
          <AuthAlert tone="neutral">
            {translateCustomerAuthError(callbackError)}
          </AuthAlert>

          <Button
            href={loginPathWithReturnTo(returnTo)}
            className="w-full justify-center"
          >
            Return to Sign In
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="The Client Salon"
      title="Accessing Your Salon"
      lede="Verifying your Google identity credentials and preparing your private atelier…"
    >
      <div className="py-8 text-center" role="status" aria-live="polite">
        <p className="eyebrow eyebrow-light animate-pulse">
          Connecting your account
        </p>
      </div>
    </AuthShell>
  );
}
