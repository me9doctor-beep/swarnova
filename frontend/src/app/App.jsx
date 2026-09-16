import { RouterProvider } from "react-router-dom";
import AppProviders from "./providers.jsx";
import router from "./router.jsx";

/**
 * Application root: cross-cutting providers wrap the router, and the router
 * owns every screen. Layouts are resolved by the router, pages render inside
 * them, and no page imports the storefront chrome directly.
 */
export default function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
