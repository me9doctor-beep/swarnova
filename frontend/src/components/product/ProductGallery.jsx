import { useState } from "react";
import PropTypes from "prop-types";
import { cn } from "../../utils/cn.js";

/**
 * PRODUCT GALLERY — one large plate with a thumbnail selector beneath it.
 *
 * Deliberately static: choosing an image replaces the plate. No carousel, no
 * transition, no gesture library. The plate shows the piece's own photography
 * at the editorial 4:5 ratio; thumbnails are real buttons, so the gallery is
 * operable by keyboard and always announces which plate is showing.
 *
 * The selector renders only when a piece carries more than one image — the
 * catalogue currently ships a single still per piece, and a strip holding one
 * thumbnail would be furniture rather than a control.
 */
export default function ProductGallery({ images, name, className }) {
  const [selected, setSelected] = useState(0);

  /* Clamped rather than assumed: the gallery outlives a route change, so a
     piece with fewer plates than the last one must still resolve. */
  const index = Math.min(selected, images.length - 1);
  const image = images[index];

  if (!image) return null;

  return (
    <div className={className}>
      <div className="border border-border-default bg-surface-secondary">
        <img
          src={image.src}
          alt={image.alt ?? name}
          className="aspect-[4/5] w-full object-cover"
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
                  "block w-20 border transition-colors duration-200 sm:w-24",
                  position === index
                    ? "border-brand-accent"
                    : "border-border-default hover:border-brand-accent/45"
                )}
              >
                <img
                  src={item.src}
                  alt=""
                  loading="lazy"
                  className="aspect-square w-full object-cover"
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
