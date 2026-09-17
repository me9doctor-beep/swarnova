import PropTypes from "prop-types";
import ErrorBoundary from "../components/ui/ErrorBoundary.jsx";
import { DataProvider } from "../services/providers/DataProvider.jsx";
import { AuthProvider } from "../features/authentication/AuthProvider.jsx";
import { WishlistProvider } from "../state/WishlistContext.jsx";
import { CartProvider } from "../state/CartContext.jsx";
import { SavedDesignsProvider } from "../state/SavedDesignsContext.jsx";
import { SavedTryOnsProvider } from "../state/SavedTryOnsContext.jsx";

/**
 * PROVIDER STACK — the composition root for cross-cutting concerns.
 *
 * Order matters:
 *   ErrorBoundary  catches render failures so no screen goes blank
 *   DataProvider   injects the data source (mock today, API later)
 *   AuthProvider   session { user, role, permissions }
 *   WishlistProvider  client-side customer state
 *   CartProvider   client-side shopping bag
 *   SavedDesignsProvider  client-side AI studio designs
 *   SavedTryOnsProvider   client-side virtual try-on snapshots
 *
 * Business state stays out of here: features add their own providers next to
 * their own code and are mounted from this file when their phase lands.
 */
export default function AppProviders({ children }) {
  return (
    <ErrorBoundary variant="root">
      <DataProvider>
        <AuthProvider>
          <WishlistProvider>
            <CartProvider>
              <SavedDesignsProvider>
                <SavedTryOnsProvider>{children}</SavedTryOnsProvider>
              </SavedDesignsProvider>
            </CartProvider>
          </WishlistProvider>
        </AuthProvider>
      </DataProvider>
    </ErrorBoundary>
  );
}

AppProviders.propTypes = {
  children: PropTypes.node.isRequired,
};
