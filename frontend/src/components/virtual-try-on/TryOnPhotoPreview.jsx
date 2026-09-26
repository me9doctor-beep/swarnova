import PropTypes from "prop-types";
import { cn } from "../../utils/cn.js";

/**
 * THE MIRROR — the selected photograph, framed like a fitting-room plate.
 *
 * Phase 14.4: while the room prepares a preview the frame keeps the
 * photograph and overlays a quiet "preparing" veil rather than replacing
 * the image with a spinner. No AR gimmicks, no fake progress bars — a
 * subtle gold shimmer tells the customer the atelier is working.
 */
export default function TryOnPhotoPreview({ copy, photo, busy = false, busyMessage }) {
  return (
    <figure>
      <div
        className={cn(
          "relative overflow-hidden border bg-surface-primary p-2.5 sm:p-3 transition-colors duration-[var(--motion-standard)]",
          busy ? "border-brand-accent/50 motion-atelier-pulse" : "border-brand-accent/30"
        )}
      >
        <img
          src={photo.image.src}
          alt={photo.image.alt}
          className="aspect-[3/4] w-full object-cover"
        />
        {busy && (
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center bg-ink/10 backdrop-blur-[1px]"
            aria-hidden="true"
          >
            <div className="flex flex-col items-center gap-4 bg-ink/40 px-6 py-4 text-center">
              <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-brand-accent-soft/60" />
                <span className="h-[5px] w-[5px] rotate-45 border border-brand-accent-soft/70" />
                <span className="h-px w-8 bg-brand-accent-soft/60" />
              </div>
              <p className="eyebrow tracking-[0.3em] text-brand-accent-soft">
                {busyMessage}
              </p>
            </div>
          </div>
        )}
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
