import PropTypes from "prop-types";
import { cn } from "../../utils/cn.js";

/**
 * Swarnova house lockup — a faceted diamond mark with a serif wordmark
 * and subtle parent-company attribution:
 *
 *   SWARNOVA
 *   by MediXO
 *
 * `tone="light"` is for wine/dark surfaces.
 */
export default function BrandMark({
  tone = "dark",
  className,
  compact = false,
  subWord = "by MediXO",
}) {
  const isLight = tone === "light";

  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <svg
        width={compact ? 26 : 34}
        height={compact ? 26 : 34}
        viewBox="0 0 40 40"
        fill="none"
        aria-hidden="true"
        className={cn("shrink-0", isLight ? "text-brand-accent-soft" : "text-brand-accent-strong")}
      >
        <path
          d="M11 5h18l7 10-16 20L4 15l7-10Z"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <path
          d="M4 15h32M14 5l-3.5 10L20 35M26 5l3.5 10L20 35M14 5h12"
          stroke="currentColor"
          strokeWidth="0.9"
          strokeLinejoin="round"
        />
      </svg>
      <span className="leading-none">
        <span
          className={cn(
            "block font-serif font-semibold tracking-[0.24em]",
            compact ? "text-[18px]" : "text-[22px]",
            isLight ? "text-text-inverse" : "text-text-primary"
          )}
        >
          SWARNOVA
        </span>
        {subWord && (
          <span
            className={cn(
              "mt-[4px] block font-sans font-medium tracking-[0.26em]",
              compact ? "text-[7.5px]" : "text-[8.5px]",
              isLight ? "text-brand-accent-soft/85" : "text-brand-accent-strong"
            )}
          >
            {subWord}
          </span>
        )}
      </span>
    </span>
  );
}

BrandMark.propTypes = {
  tone: PropTypes.oneOf(["dark", "light"]),
  className: PropTypes.string,
  compact: PropTypes.bool,
  subWord: PropTypes.string,
};
