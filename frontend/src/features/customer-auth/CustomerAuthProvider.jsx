import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useDataProvider } from "../../services/providers/DataProvider.jsx";
import { customerAuthService } from "../../services/customerAuthService.js";

/**
 * CUSTOMER SESSION (Phase 11)
 * -----------------------------------------------------------------------------
 * The ONE customer identity boundary — deliberately separate from the staff
 * `AuthProvider` (which carries `{ user, role, permissions }` for Super
 * Admin / Admin / Employee). A customer session answers exactly this:
 *
 *   Is a customer authenticated?   `isAuthenticated`
 *   Who is the current customer?   `customer` ({ id, name, email, phone, … })
 *   What is the customer's ID?     `customer.id`
 *   Is the session resolving?      `isLoading`
 *   Can the customer log out?      `signOut()`
 *
 * The session bootstraps from the provider (`getCurrentCustomer`), so a
 * stored mock session survives a refresh exactly as a backend session would.
 * Customer identity carries no staff role, capability or permission — a
 * customer session can never satisfy a staff `RoleBoundary`, by construction.
 */

const EMPTY_CUSTOMER_SESSION = {
  customer: null,
  isAuthenticated: false,
  isLoading: true,
};

export const CustomerAuthContext = createContext({
  ...EMPTY_CUSTOMER_SESSION,
  signIn: () => {},
  signOut: () => Promise.resolve(),
  refresh: () => Promise.resolve({ authenticated: false, customer: null }),
});

export function CustomerAuthProvider({ initialSession = undefined, children }) {
  const provider = useDataProvider();
  /* `initialSession` pins a deterministic session for tests (`{ customer }`
     or `null`); when omitted the session bootstraps from the provider. */
  const pinned = initialSession !== undefined;
  const [customer, setCustomer] = useState(
    pinned ? (initialSession?.customer ?? null) : null
  );
  const [isLoading, setIsLoading] = useState(!pinned);

  const refresh = useCallback(async () => {
    const session = await customerAuthService.getCurrentCustomer(provider);
    setCustomer(session?.customer ?? null);
    return session;
  }, [provider]);

  useEffect(() => {
    if (pinned) return undefined;
    let alive = true;
    setIsLoading(true);
    customerAuthService
      .getCurrentCustomer(provider)
      .then((session) => {
        if (alive) setCustomer(session?.customer ?? null);
      })
      .catch(() => {
        /* An unreachable provider is simply no session — the storefront stays public. */
        if (alive) setCustomer(null);
      })
      .finally(() => {
        if (alive) setIsLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [provider, pinned]);

  const signIn = useCallback((session) => {
    setCustomer(session?.customer ?? null);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await customerAuthService.logout(provider);
    } finally {
      /* The local session clears even if the provider call fails — logout
         must never strand a customer inside their account. */
      setCustomer(null);
    }
  }, [provider]);

  const value = useMemo(
    () => ({
      customer: customer ?? null,
      isAuthenticated: Boolean(customer),
      isLoading,
      signIn,
      signOut,
      refresh,
    }),
    [customer, isLoading, signIn, signOut, refresh]
  );

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

CustomerAuthProvider.propTypes = {
  /** A pinned session for deterministic tests, or null for a signed-out test. */
  initialSession: PropTypes.shape({
    customer: PropTypes.object,
  }),
  children: PropTypes.node.isRequired,
};

export default CustomerAuthProvider;
