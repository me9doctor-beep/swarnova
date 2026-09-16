import PropTypes from "prop-types";
import { cn } from "../../utils/cn.js";

/**
 * SKIP LINK — the first tab stop of every experience. Visually hidden until it
 * takes focus, then a wine button that jumps past the chrome to the page's
 * `<main>` landmark. Shared so the storefront and the consoles behave
 * identically for keyboard users.
 */
export default function SkipLink({ href = "#main", children = "Skip to main content", className }) {
  return (
    <a
      href={href}
      className={cn(
        "sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-wine focus:px-4 focus:py-2 focus:text-[11px] focus:uppercase focus:tracking-[0.2em] focus:text-cream",
        className
      )}
    >
      {children}
    </a>
  );
}

SkipLink.propTypes = {
  /** Id of the main landmark to jump to. */
  href: PropTypes.string,
  children: PropTypes.node,
  className: PropTypes.string,
};
