import { useEffect } from "react";

/**
 * Locks background scrolling while an overlay (mobile menu, console sidebar
 * drawer) is open, and restores the previous value on close or unmount.
 */
export function useBodyScrollLock(locked) {
  useEffect(() => {
    if (!locked) return undefined;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [locked]);
}

export default useBodyScrollLock;
