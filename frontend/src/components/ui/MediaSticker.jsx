import PropTypes from "prop-types";
import { cn } from "../../utils/cn.js";

/* Where the sticker sits inside the film's frame. The delivered films carry a
   small Google AI star mark in one corner; the sticker covers that corner so
   the mark is not visible. Every delivered film uses the same placement, so
   the default is set once and only over-ridden per placement if a future
   delivery moves the mark. */
const CORNERS = {
  "bottom-right": "bottom-1 right-1 sm:bottom-3 sm:right-4",
  "bottom-left": "bottom-1 left-1 sm:bottom-3 sm:left-4",
  "top-right": "top-1 right-1 sm:top-3 sm:right-4",
  "top-left": "top-1 left-1 sm:top-3 sm:left-4",
};

const SIZES = {
  /* Atelier film — the frame is a 16:9 box in the page, so the seal is sized
     against that frame rather than the viewport. */
  sm: { box: "h-14 w-14 sm:h-20 sm:w-20", label: "text-[5px] tracking-[0.14em] sm:text-[7px] sm:tracking-[0.2em]" },
  /* Full-bleed hero — the film is far larger than the viewport on most
     screens, and is cropped. */
  lg: { box: "h-20 w-20 sm:h-24 sm:w-24 lg:h-28 lg:w-28", label: "text-[6.5px] tracking-[0.18em] lg:text-[8px]" },
};

/**
 * MEDIA STICKER — the house seal over a film's corner.
 *
 * A die-cut sticker (paper ring, champagne-gold disc, the Swarnova faceted
 * mark and the wordmark) pinned to one corner of a film. It is decorative:
 * `aria-hidden`, no pointer events, no motion — so it never intercepts a tap
 * meant for the tap-to-play affordance or the copy beneath, and it costs
 * nothing on the playback path.
 *
 * The sticker must be placed inside the film's own frame, not the section's
 * box: the hero crops its film, so a sticker pinned to the section would drift
 * away from the mark it is covering (and collide with the copy). `.hero__sticker-film`
 * gives the hero that frame; the atelier film's 16:9 box is already exactly
 * its film's frame.
 */
export default function MediaSticker({ corner = "bottom-right", size = "sm", label = "Swarnova", className }) {
  const scale = SIZES[size] ?? SIZES.sm;

  return (
    <div
      aria-hidden="true"
      data-media-sticker={corner}
      className={cn(
        "media-sticker pointer-events-none absolute z-[2] select-none",
        CORNERS[corner] ?? CORNERS["bottom-right"],
        className
      )}
    >
      <span
        className={cn(
          "media-sticker__seal flex flex-col items-center justify-center gap-[3px] rounded-full",
          scale.box
        )}
      >
        <svg viewBox="0 0 40 40" fill="none" aria-hidden="true" className="h-[38%] w-[38%] shrink-0 text-wine-deep">
          <path
            d="M11 5h18l7 10-16 20L4 15l7-10Z"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinejoin="round"
          />
          <path
            d="M4 15h32M14 5l-3.5 10L20 35M26 5l3.5 10L20 35M14 5h12"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
            opacity="0.75"
          />
        </svg>
        {label ? (
          <span className={cn("font-sans font-semibold uppercase leading-none text-wine-deep", scale.label)}>
            {label}
          </span>
        ) : null}
      </span>
    </div>
  );
}

MediaSticker.propTypes = {
  /** Corner of the film's frame the sticker covers. */
  corner: PropTypes.oneOf(Object.keys(CORNERS)),
  size: PropTypes.oneOf(Object.keys(SIZES)),
  /** Wordmark under the mark. Pass `null` for a plain seal. */
  label: PropTypes.string,
  className: PropTypes.string,
};
