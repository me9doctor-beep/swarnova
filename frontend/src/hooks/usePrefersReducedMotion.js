import { useEffect, useState } from "react";

/**
 * usePrefersReducedMotion — returns true when the customer has asked the OS
 * for reduced motion. SSR-safe (defaults to false). Used by the hero, brand
 * film, AI atelier and try-on reveal to disable decorative animation while
 * preserving all content and functional state changes.
 */
const QUERY = "(prefers-reduced-motion: reduce)";

/* Read synchronously on first render so a reduced-motion visitor never gets a
   single autoplaying frame before the effect below runs (Phase 14.4A). */
function readReduced() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(QUERY).matches;
}

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(readReduced);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mql = window.matchMedia(QUERY);
    const update = () => setReduced(mql.matches);
    update();

    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", update);
      return () => mql.removeEventListener("change", update);
    }
    if (typeof mql.addListener === "function") {
      mql.addListener(update);
      return () => mql.removeListener(update);
    }
    return undefined;
  }, []);

  return reduced;
}

export default usePrefersReducedMotion;
