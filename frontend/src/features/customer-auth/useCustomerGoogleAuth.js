import { useCallback, useState } from "react";
import { useDataProvider } from "../../services/providers/DataProvider.jsx";
import { customerAuthService } from "../../services/customerAuthService.js";
import { useCustomerAuth } from "./useCustomerAuth.js";

/**
 * CUSTOMER GOOGLE OAUTH HOOK (Phase 13.5)
 * -----------------------------------------------------------------------------
 * Drives backend-mediated Google OAuth for customers only.
 *
 * Architecture seam:
 *   Customer Login UI
 *          ↓
 *   useCustomerGoogleAuth
 *          ↓
 *   customerAuthService
 *          ↓
 *   DataProvider
 *          ↓
 *   Future Backend OAuth Endpoint
 *          ↓
 *   Google OAuth
 *
 * Supported states:
 *   - idle
 *   - redirecting
 *   - loading (callback / token exchange)
 *   - success
 *   - error
 */
export function useCustomerGoogleAuth() {
  const provider = useDataProvider();
  const { signIn } = useCustomerAuth();
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

  const clearError = useCallback(() => {
    setError(null);
    setStatus("idle");
  }, []);

  const initiateGoogleAuth = useCallback(
    async ({ returnTo } = {}) => {
      setStatus("redirecting");
      setError(null);
      try {
        const response = await customerAuthService.initiateGoogleOAuth(provider, {
          returnTo,
        });
        if (response?.redirectUrl && typeof window !== "undefined") {
          window.location.assign(response.redirectUrl);
        }
        return response;
      } catch (caught) {
        setStatus("error");
        setError(caught);
        throw caught;
      }
    },
    [provider]
  );

  const completeGoogleAuth = useCallback(
    async (payload = {}) => {
      setStatus("loading");
      setError(null);
      try {
        const session = await customerAuthService.completeGoogleOAuth(
          provider,
          payload
        );
        signIn(session);
        setStatus("success");
        return session;
      } catch (caught) {
        setStatus("error");
        setError(caught);
        throw caught;
      }
    },
    [provider, signIn]
  );

  return {
    status,
    isIdle: status === "idle",
    isRedirecting: status === "redirecting",
    isLoading: status === "loading",
    isSuccess: status === "success",
    isError: status === "error",
    error,
    clearError,
    initiateGoogleAuth,
    completeGoogleAuth,
  };
}

export default useCustomerGoogleAuth;
