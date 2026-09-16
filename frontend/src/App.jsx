import { DataProvider } from "./data/DataProvider.jsx";
import { WishlistProvider } from "./state/WishlistContext.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import Header from "./components/layout/Header.jsx";
import Footer from "./components/layout/Footer.jsx";
import HomeSections from "./components/sections/HomeSections.jsx";

export default function App() {
  return (
    <ErrorBoundary variant="root">
      <DataProvider>
        <WishlistProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-wine focus:px-4 focus:py-2 focus:text-[11px] focus:uppercase focus:tracking-[0.2em] focus:text-cream"
          >
            Skip to main content
          </a>

          <Header />

          <main id="main">
            <span id="top" className="sr-only" aria-hidden="true" />
            <HomeSections />
          </main>

          <Footer />
        </WishlistProvider>
      </DataProvider>
    </ErrorBoundary>
  );
}
