import PropTypes from "prop-types";
import { Navigate, useSearchParams } from "react-router-dom";
import { useCustomerAuth } from "./useCustomerAuth.js";
import { safeReturnTo } from "./customerRoutes.js";

/**
 * GUEST-ONLY ROUTES (Phase 11)
 * -----------------------------------------------------------------------------
 * Wraps `/login` and `/register`: an already-authenticated customer never
 * starts a second session here — they land back where they were headed
 * (`?returnTo=…`, sanitised) or in their account. Guests see the form.
 *
 * While the session is still resolving the form renders rather than a
 * redirect, so there is no redirect loop and no flash of the wrong state.
 */
export default function GuestOnly({ children }) {
  const { isAuthenticated, isLoading } = useCustomerAuth();
  const [params] = useSearchParams();

  if (isLoading) {
    return (
      <div className="bg-surface-secondary/40 py-32" role="status" aria-live="polite">
        <p className="eyebrow eyebrow-light text-center">Preparing your salon</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={safeReturnTo(params.get("returnTo"))} replace />;
  }

  return children;
}

GuestOnly.propTypes = {
  children: PropTypes.node.isRequired,
};
