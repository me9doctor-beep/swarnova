import { useLayoutEffect } from "react";
import { Outlet, ScrollRestoration, useLocation, useNavigationType } from "react-router-dom";

/**
 * GLOBAL SCROLL RESTORATION — one place for every experience.
 *
 * Mounted as the data-router root so layouts and pages never own route-reset
 * scrolling. PUSH/REPLACE land at 0; POP leaves history restoration to
 * React Router; a hash never forces the top (homepage sections and in-page
 * anchors keep working). Window and known overflow containers are reset
 * together, because console shells may scroll a dedicated main pane.
 */
const OVERFLOW_SELECTORS = ["#main", "#console-main", "[data-scroll-container]"];

/**
 * Decide what a location change should do to scroll.
 *
 *   hash     — any meaningful hash: land on the anchor (never force top)
 *   restore  — browser Back/Forward without a hash: keep history position
 *   top      — PUSH/REPLACE to a new path or query: destination starts at 0
 */
export function resolveScrollAction({ hash, navigationType }) {
  if (hash && hash.length > 1) return "hash";
  if (navigationType === "POP") return "restore";
  return "top";
}

function resetScrollContainers() {
  window.scrollTo(0, 0);
  const { scrollingElement, documentElement, body } = document;
  if (scrollingElement) scrollingElement.scrollTop = 0;
  if (documentElement) documentElement.scrollTop = 0;
  if (body) body.scrollTop = 0;

  for (const selector of OVERFLOW_SELECTORS) {
    document.querySelectorAll(selector).forEach((node) => {
      node.scrollTop = 0;
      node.scrollLeft = 0;
    });
  }
}

export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation();
  const navigationType = useNavigationType();

  useLayoutEffect(() => {
    if (hash) {
      const id = decodeURIComponent(hash.slice(1));
      const target = id ? document.getElementById(id) : null;
      if (target) {
        target.scrollIntoView({ behavior: "auto", block: "start" });
      }
      return undefined;
    }

    /* Back/forward: keep the saved window position. Overflow panes still
       reset so a nested console scroller cannot strand the next view. */
    if (navigationType === "POP") {
      return undefined;
    }

    resetScrollContainers();
    return undefined;
  }, [pathname, search, hash, navigationType]);

  return (
    <>
      <ScrollRestoration />
      <Outlet />
    </>
  );
}
