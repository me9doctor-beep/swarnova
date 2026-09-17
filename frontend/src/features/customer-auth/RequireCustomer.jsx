import PropTypes from "prop-types";
import { Navigate, useLocation } from "react-router-dom";
import { useCustomerAuth } from "./useCustomerAuth.js";
import { loginPathWithReturnTo } from "./customerRoutes.js";

/**
 * CUSTOMER ROUTE GUARD (Phase 11)
 * -----------------------------------------------------------------------------
 * The frontend boundary for `/account/*` — the customer-side twin of the
 * staff `RoleBoundary`, reading the customer session instead of the staff
 * session:
 *
 *   session resolving   → a quiet static status (no flash-redirect while a
 *                         stored session re-resolves after a refresh)
 *   guest               → /login?returnTo=<intended destination>, so a
 *                         successful sign-in lands back where the customer
 *                         was headed
 *   authenticated       → the account renders
 *
 * This remains a navigation/UX boundary only — the provider re-resolves
 * ownership from its own session on every call, which is the real
 * enforcement, exactly as the backend will be.
 */
export default function RequireCustomer({ children }) {
  const { isAuthenticated, isLoading } = useCustomerAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="bg-surface-secondary/40 py-32" role="status" aria-live="polite">
        <p className="eyebrow eyebrow-light text-center">Preparing your salon</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={loginPathWithReturnTo(location.pathname + location.search)}
        replace
      />
    );
  }

  return children;
}

RequireCustomer.propTypes = {
  children: PropTypes.node.isRequired,
};
