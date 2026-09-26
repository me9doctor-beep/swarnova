import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { cn } from "../../utils/cn.js";

/**
 * PRODUCT GALLERY — one large plate with a thumbnail selector beneath it.
 *
 * Phase 14.4: a restrained crossfade when a new plate is chosen, plus a
 * very subtle zoom on plate hover. The jewellery stays the dominant
 * subject — no rotation, no 3D spin, no parallax.
 *
 * The selector renders only when a piece carries more than one image — the
 * catalogue currently ships a single still per piece, and a strip holding
 * one thumbnail would be furniture rather than a control.
 */
export default function ProductGallery({ images, name, className }) {
  const [selected, setSelected] = useState(0);
  const [fadeKey, setFadeKey] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  /* Clamped rather than assumed: the gallery outlives a route change, so a
     piece with fewer plates than the last one must still resolve. */
  const index = Math.min(selected, images.length - 1);
  const image = images[index];

  /* Trigger the crossfade each time the plate changes. */
  useEffect(() => {
    setFadeKey((k) => k + 1);
  }, [index]);

  if (!image) return null;

  return (
    <div className={className}>
      <div
        className={cn(
          "group relative overflow-hidden border border-border-default bg-surface-secondary",
          zoomed && "cursor-zoom-out"
        )}
        onMouseEnter={() => setZoomed(true)}
        onMouseLeave={() => setZoomed(false)}
      >
        <img
          key={fadeKey}
          src={image.src}
          alt={image.alt ?? name}
          className="motion-fade aspect-[4/5] w-full object-cover transition-transform duration-[var(--motion-cinematic)] ease-[var(--ease-standard)] group-hover:scale-[1.04]"
          loading="eager"
          style={zoomed ? { transformOrigin: "center center" } : undefined}
        />
      </div>

      {images.length > 1 && (
        <ul className="mt-4 flex flex-wrap gap-3">
          {images.map((item, position) => (
            <li key={`${item.src}-${position}`}>
              <button
                type="button"
                onClick={() => setSelected(position)}
                aria-current={position === index}
                aria-label={`Show image ${position + 1} of ${images.length}: ${item.alt ?? name}`}
                className={cn(
                  "block w-20 border transition-[border-color,opacity] duration-[var(--motion-standard)] sm:w-24",
                  position === index
                    ? "border-brand-accent opacity-100"
                    : "border-border-default opacity-70 hover:border-brand-accent/45 hover:opacity-100"
                )}
              >
                <img
                  src={item.src}
                  alt=""
                  loading="lazy"
                  className="aspect-square w-full object-cover transition-opacity duration-[var(--motion-standard)]"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

ProductGallery.propTypes = {
  images: PropTypes.arrayOf(
    PropTypes.shape({ src: PropTypes.string, alt: PropTypes.string })
  ).isRequired,
  /** Fallback alt text when a plate carries none. */
  name: PropTypes.string.isRequired,
  className: PropTypes.string,
};
