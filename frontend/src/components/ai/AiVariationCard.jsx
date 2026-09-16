import PropTypes from "prop-types";
import { Diamond } from "lucide-react";
import { cn } from "../../utils/cn.js";

/**
 * One selectable concept plate — the original render or a numbered variation.
 * Selection swaps the studio's active preview; `aria-pressed` carries the
 * state for assistive technology.
 */
export default function AiVariationCard({ image, label, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "border bg-surface-primary text-left transition-colors duration-200",
        selected
          ? "border-brand-accent"
          : "border-border-default hover:border-brand-accent/45"
      )}
    >
      <span className="block overflow-hidden">
        <img
          src={image.src}
          alt={image.alt}
          loading="lazy"
          className="aspect-[4/3] w-full object-cover"
        />
      </span>
      <span
        className={cn(
          "flex items-center justify-between gap-2 px-3 py-2.5 font-sans text-label uppercase tracking-[0.18em]",
          selected ? "text-brand-accent-strong" : "text-text-secondary"
        )}
      >
        {label}
        {selected && (
          <Diamond
            size={10}
            strokeWidth={1.6}
            className="shrink-0 rotate-90 text-brand-accent"
            aria-hidden="true"
          />
        )}
      </span>
    </button>
  );
}

AiVariationCard.propTypes = {
  image: PropTypes.shape({
    src: PropTypes.string.isRequired,
    alt: PropTypes.string,
  }).isRequired,
  label: PropTypes.string.isRequired,
  selected: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
};
