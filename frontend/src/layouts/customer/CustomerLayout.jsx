import { Outlet } from "react-router-dom";
import Header from "../../components/layout/Header.jsx";
import Footer from "../../components/layout/Footer.jsx";

/**
 * CUSTOMER LAYOUT — the luxury storefront shell.
 *
 * Owns the storefront chrome once for every customer route: skip link, header,
 * main landmark and footer. Customer pages render their content through the
 * <Outlet /> and never repeat the header or footer themselves.
 *
 * Design direction: luxury editorial (white / ivory / champagne / wine).
 */
export default function CustomerLayout() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-wine focus:px-4 focus:py-2 focus:text-[11px] focus:uppercase focus:tracking-[0.2em] focus:text-cream"
      >
        Skip to main content
      </a>

      <Header />

      <main id="main">
        <Outlet />
      </main>

      <Footer />
    </>
  );
}
