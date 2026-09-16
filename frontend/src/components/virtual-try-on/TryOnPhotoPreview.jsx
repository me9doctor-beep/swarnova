import PropTypes from "prop-types";
import { cn } from "../../utils/cn.js";

/**
 * THE MIRROR — the selected photograph, framed like a fitting-room plate.
 * While the room prepares a preview the frame keeps the photograph and a
 * quiet static status line takes the caption's place; no animation, in
 * keeping with the house.
 */
export default function TryOnPhotoPreview({ copy, photo, busy = false, busyMessage }) {
  return (
    <figure>
      <div
        className={cn(
          "border bg-surface-primary p-2.5 sm:p-3",
          busy ? "border-brand-accent/50" : "border-brand-accent/30"
        )}
      >
        <img
          src={photo.image.src}
          alt={photo.image.alt}
          className="aspect-[3/4] w-full object-cover"
        />
      </div>
      <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <span className="font-sans text-label uppercase tracking-[0.24em] text-text-muted">
          {copy.heading}
        </span>
        {busy && (
          <span role="status" className="eyebrow eyebrow-light">
            {busyMessage}
          </span>
        )}
      </figcaption>
    </figure>
  );
}

TryOnPhotoPreview.propTypes = {
  /** The room copy model's `photo` block (for the caption). */
  copy: PropTypes.shape({ heading: PropTypes.string.isRequired }).isRequired,
  photo: PropTypes.shape({
    image: PropTypes.shape({
      src: PropTypes.string.isRequired,
      alt: PropTypes.string,
    }).isRequired,
  }).isRequired,
  busy: PropTypes.bool,
  busyMessage: PropTypes.string,
};
