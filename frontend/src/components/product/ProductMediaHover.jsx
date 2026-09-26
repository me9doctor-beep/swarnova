import PropTypes from "prop-types";
import { cn } from "../../utils/cn.js";

/**
 * PRODUCT MEDIA HOVER — Phase 14.4B.
 *
 * The product card's image area: the canonical primary still and, for pieces
 * photographed from more than one camera position, a layer of those angles
 * that dissolves in on desktop hover — one piece, seen from different
 * perspectives. Pure presentation: the interaction comes from
 * `useProductMediaHover` (hand its result in as `hover`), so the card that
 * owns the hover area decides where pointer intent is read.
 *
 *   · The primary is always rendered, exactly as before, and is the only
 *     image exposed to assistive technology. The angle layer is decorative
 *     (`aria-hidden`, empty alts) — no duplicate announcements.
 *   · Angle layers mount only once the card is armed by a real mouse hover,
 *     so they cost nothing on catalogue load, on touch devices, or for
 *     reduced-motion visitors.
 *   · Visibility is driven by `data-engaged` / `data-shown` attributes the
 *     hook writes directly; the CSS in index.css (`.product-media-*`) turns
 *     them into ~700 ms opacity dissolves. No zoom, no parallax, no sparkle.
 *   · `className` (the card's hover treatment, e.g. its restrained zoom)
 *     lands on the primary <img> when there are no frames, and on the frame
 *     wrapper when there are, so every layer moves together.
 *   · Without frames the output is the original single <img>, unchanged.
 */
export default function ProductMediaHover({ primary, frames = [], name, hover, className }) {
  const primaryImage = (
    <img
      src={primary?.src}
      alt={primary?.alt || name}
      loading="lazy"
      className={cn("h-full w-full object-cover", !frames.length && className)}
    />
  );

  if (!frames.length) return primaryImage;

  return (
    <div
      className={cn("relative h-full w-full", className)}
      data-product-media-hover=""
    >
      {primaryImage}
      {hover?.armed && (
        <div ref={hover.layersRef} className="product-media-layers" aria-hidden="true">
          {frames.map((frame, index) => (
            <img
              key={`${frame.src}-${index}`}
              src={frame.src}
              alt=""
              decoding="async"
              draggable="false"
              className="product-media-frame"
              onLoad={() => hover.onFrameLoad(index)}
              onError={() => hover.onFrameError(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const frameShape = PropTypes.shape({ src: PropTypes.string, alt: PropTypes.string });

ProductMediaHover.propTypes = {
  /** The canonical still (`product.media.primary`). */
  primary: frameShape,
  /** Additional camera angles of the same piece (`product.media.hoverFrames`). */
  frames: PropTypes.arrayOf(frameShape),
  /** Fallback alt text when the primary carries none. */
  name: PropTypes.string.isRequired,
  /** The `useProductMediaHover` result driving the angle layer. */
  hover: PropTypes.shape({
    armed: PropTypes.bool,
    layersRef: PropTypes.func,
    onFrameLoad: PropTypes.func,
    onFrameError: PropTypes.func,
  }),
  className: PropTypes.string,
};
