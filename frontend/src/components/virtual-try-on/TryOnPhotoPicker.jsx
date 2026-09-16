import { useRef } from "react";
import PropTypes from "prop-types";
import { Upload } from "lucide-react";
import Button from "../ui/Button.jsx";
import { cn } from "../../utils/cn.js";

/**
 * YOUR PHOTO — the mirror's intake. One accessible file input (browser APIs
 * only, no processing library) plus the room's curated sample portraits.
 * When a photograph already stands on the mirror the same block offers
 * Replace and Remove — never a second implementation.
 */
export default function TryOnPhotoPicker({
  copy,
  samples,
  photo,
  error,
  onSampleSelect,
  onFileSelect,
  onRemove,
}) {
  const inputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) onFileSelect(file);
    /* Re-selecting the same photograph must fire again. */
    event.target.value = "";
  };

  return (
    <div>
      <h2 className="font-sans text-label font-medium uppercase tracking-[0.24em] text-text-secondary">
        {copy.heading}
      </h2>

      {/* The file input stays focusable for keyboard users; the visible
          button simply opens the same dialog. */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        aria-label={copy.uploadLabel}
        className="sr-only"
        onChange={handleFileChange}
      />
      <Button
        variant="outline"
        className="mt-4 w-full"
        onClick={() => inputRef.current?.click()}
      >
        <Upload size={14} strokeWidth={1.6} aria-hidden="true" />
        {photo ? copy.replace : copy.uploadLabel}
      </Button>
      <p className="mt-2 text-center text-body-sm text-text-muted">{copy.uploadHint}</p>

      {photo && (
        <div className="mt-4 flex items-center justify-between gap-3 border border-border-default bg-surface-secondary px-4 py-3">
          <p className="min-w-0 text-body-sm text-text-secondary">
            <span className="mr-2 font-sans text-label uppercase tracking-[0.18em] text-text-muted">
              {copy.selected}
            </span>
            <span className="break-all">{photo.name}</span>
          </p>
          <button
            type="button"
            onClick={onRemove}
            className="shrink-0 py-1 font-sans text-label font-medium uppercase tracking-[0.18em] text-brand-primary transition-colors duration-200 hover:text-brand-accent-strong"
          >
            {copy.remove}
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 text-body-sm text-state-error">
          {error}
        </p>
      )}

      <div className="mt-7">
        <p className="text-body-sm text-text-secondary">{copy.samplesHeading}</p>
        <ul className="mt-3 grid grid-cols-3 gap-3">
          {samples.map((sample) => {
            const selected = photo?.origin === "sample" && photo.sampleId === sample.id;
            return (
              <li key={sample.id}>
                <button
                  type="button"
                  onClick={() => onSampleSelect(sample)}
                  aria-pressed={selected}
                  aria-label={`Use the sample portrait of ${sample.name}`}
                  className={cn(
                    "block w-full border bg-surface-primary transition-colors duration-200",
                    selected
                      ? "border-brand-primary"
                      : "border-border-default hover:border-brand-accent/45"
                  )}
                >
                  <img
                    src={sample.image.src}
                    alt={sample.image.alt}
                    loading="lazy"
                    className="aspect-[3/4] w-full object-cover"
                  />
                  <span
                    className={cn(
                      "block px-1 py-2 text-center font-sans text-label uppercase tracking-[0.18em]",
                      selected ? "text-brand-primary" : "text-text-secondary"
                    )}
                  >
                    {sample.name}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

TryOnPhotoPicker.propTypes = {
  /** The room copy model's `photo` block. */
  copy: PropTypes.shape({
    heading: PropTypes.string.isRequired,
    uploadLabel: PropTypes.string.isRequired,
    replace: PropTypes.string.isRequired,
    remove: PropTypes.string.isRequired,
    uploadHint: PropTypes.string.isRequired,
    selected: PropTypes.string.isRequired,
    samplesHeading: PropTypes.string.isRequired,
  }).isRequired,
  samples: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      image: PropTypes.shape({ src: PropTypes.string.isRequired }).isRequired,
    })
  ).isRequired,
  /** The photograph currently on the mirror, if any. */
  photo: PropTypes.shape({
    origin: PropTypes.string,
    sampleId: PropTypes.string,
    name: PropTypes.string,
  }),
  error: PropTypes.string,
  onSampleSelect: PropTypes.func.isRequired,
  onFileSelect: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
};
