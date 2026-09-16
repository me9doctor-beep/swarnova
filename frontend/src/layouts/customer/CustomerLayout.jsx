import { Outlet } from "react-router-dom";
import Header from "../../components/layout/Header.jsx";
import Footer from "../../components/layout/Footer.jsx";
import SkipLink from "../../components/ui/SkipLink.jsx";

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
      <SkipLink />

      <Header />

      <main id="main">
        <Outlet />
      </main>

      <Footer />
    </>
  );
}
