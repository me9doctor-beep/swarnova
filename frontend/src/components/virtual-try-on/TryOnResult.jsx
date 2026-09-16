import { useState } from "react";
import PropTypes from "prop-types";
import Badge from "../ui/Badge.jsx";
import { cn } from "../../utils/cn.js";

/**
 * VIRTUAL TRY-ON RESULT — the dressed portrait on the mirror, with the
 * lightweight compare the house prescribes: a two-way [Original] [Try-On]
 * toggle over the one frame, no comparison framework. The result's own
 * metadata — piece, lineage, readiness — sits quietly beneath.
 */
export default function TryOnResult({ copy, result }) {
  const [view, setView] = useState("try-on");

  const jewellery = result.source.jewellery;
  const showingOriginal = view === "original";
  const image = showingOriginal ? result.photo.image : result.image;

  const segment = (active) =>
    cn(
      "min-h-10 px-4 font-sans text-label font-medium uppercase tracking-[0.18em] transition-colors duration-200",
      active
        ? "bg-brand-primary text-text-inverse"
        : "bg-surface-primary text-text-secondary hover:text-brand-primary"
    );

  return (
    <figure>
      <div className="border border-brand-accent/30 bg-surface-primary p-2.5 sm:p-3">
        <img
          src={image.src}
          alt={image.alt ?? `${jewellery.name} try-on preview`}
          className="aspect-[3/4] w-full object-cover"
        />
      </div>

      <figcaption className="mt-3">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <span className="font-sans text-label uppercase tracking-[0.24em] text-text-muted">
            {showingOriginal ? copy.originalCaption : copy.tryOnCaption}
          </span>
          <div
            role="group"
            aria-label={copy.compareLabel}
            className="inline-flex border border-border-default"
          >
            <button
              type="button"
              aria-pressed={showingOriginal}
              onClick={() => setView("original")}
              className={segment(showingOriginal)}
            >
              {copy.original}
            </button>
            <button
              type="button"
              aria-pressed={!showingOriginal}
              onClick={() => setView("try-on")}
              className={segment(!showingOriginal)}
            >
              {copy.tryOn}
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className="font-serif text-h4 leading-snug text-text-primary">
            {jewellery.name}
          </p>
          <Badge variant="success" dot>
            {copy.ready}
          </Badge>
        </div>
        <p className="mt-1 text-body-sm text-text-secondary">
          {jewellery.purity} Gold
          {jewellery.category ? ` · ${jewellery.category}` : ""}
        </p>
      </figcaption>
    </figure>
  );
}

TryOnResult.propTypes = {
  /** The room copy model's `result` block. */
  copy: PropTypes.shape({
    ready: PropTypes.string.isRequired,
    original: PropTypes.string.isRequired,
    tryOn: PropTypes.string.isRequired,
    originalCaption: PropTypes.string.isRequired,
    tryOnCaption: PropTypes.string.isRequired,
    compareLabel: PropTypes.string.isRequired,
  }).isRequired,
  result: PropTypes.shape({
    id: PropTypes.string.isRequired,
    status: PropTypes.string,
    createdAt: PropTypes.string,
    image: PropTypes.shape({ src: PropTypes.string.isRequired, alt: PropTypes.string }).isRequired,
    photo: PropTypes.shape({
      image: PropTypes.shape({ src: PropTypes.string.isRequired, alt: PropTypes.string }).isRequired,
    }).isRequired,
    source: PropTypes.shape({
      sourceType: PropTypes.string.isRequired,
      sourceId: PropTypes.string.isRequired,
      jewellery: PropTypes.shape({
        name: PropTypes.string.isRequired,
        category: PropTypes.string,
        purity: PropTypes.string,
      }).isRequired,
    }).isRequired,
  }).isRequired,
};
