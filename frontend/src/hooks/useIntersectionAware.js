import { useEffect, useRef, useState } from "react";

/**
 * useIntersectionAware — tracks whether an element is visible in the viewport.
 *
 * Returns [ref, isIntersecting]. Used by cinematic media to pause video
 * decoding when the film is scrolled well off-screen, keeping the main
 * thread quiet for sections the customer is actually reading.
 *
 * Threshold is intentionally generous (0.1) so we resume decoding slightly
 * before the customer arrives; rootMargin keeps the off-screen pause honest
 * rather than aggressively cutting out mid-scroll.
 */
export function useIntersectionAware(options = {}) {
  const ref = useRef(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setIsIntersecting(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: "100px 0px",
        ...options,
      }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return [ref, isIntersecting];
}

export default useIntersectionAware;
