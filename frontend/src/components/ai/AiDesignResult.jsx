import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import Badge from "../ui/Badge.jsx";
import Eyebrow from "../ui/Eyebrow.jsx";
import AiRefinePrompt from "./AiRefinePrompt.jsx";
import AiStudioActions from "./AiStudioActions.jsx";
import AiVariationCard from "./AiVariationCard.jsx";
import { optionLabel } from "../../utils/optionLabel.js";

/**
 * The generated concept, presented as the studio's focal point: a framed
 * plate, the design's metadata and story, the action row, the refinement
 * form and — once the atelier has rendered them — the selectable variation
 * plates. All generation behaviour is handed up; this component only
 * composes and presents.
 */
export default function AiDesignResult({
  copy,
  concept,
  activePlate = 0,
  onPlateChange,
  busyAction,
  busyMessage,
  error,
  note,
  isSaved = false,
  tryOnHref,
  onRefine,
  onVary,
  onSave,
  onShare,
}) {
  const [refining, setRefining] = useState(false);

  /* A new concept closes any refinement conversation that preceded it. */
  useEffect(() => {
    setRefining(false);
  }, [concept.id]);

  const { result, context, refine: refineCopy } = copy;
  const plateIndex = Math.min(activePlate, concept.images.length - 1);
  const plate = concept.images[plateIndex] ?? concept.images[0];
  const plateLabel =
    plateIndex === 0
      ? result.originalPlate
      : `${result.variationPrefix} ${String(plateIndex).padStart(2, "0")}`;

  const details = [
    optionLabel(context.jewelleryTypes, concept.category),
    optionLabel(context.styles, concept.style),
    optionLabel(context.occasions, concept.occasion),
  ].filter(Boolean);

  const handleRefineSubmit = (feedback) => {
    setRefining(false);
    onRefine(feedback);
  };

  return (
    <div>
      <figure>
        <div className="border border-brand-accent/30 bg-surface-primary p-2.5 sm:p-3">
          <img
            src={plate.src}
            alt={plate.alt ?? concept.title}
            className="aspect-[4/3] w-full object-cover"
          />
        </div>
        <figcaption className="mt-3 font-sans text-label uppercase tracking-[0.24em] text-text-muted">
          {plateLabel}
        </figcaption>
      </figure>

      <div className="mt-7">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="brand">{concept.purity} Gold</Badge>
          {details.map((detail) => (
            <Badge key={detail} variant="neutral">
              {detail}
            </Badge>
          ))}
          <Badge variant="success" dot>
            {concept.status}
          </Badge>
        </div>
        <h3 className="mt-4 font-serif text-h2 leading-[1.2] text-text-primary">
          {concept.title}
        </h3>
      </div>

      {concept.promptSummary && (
        <blockquote className="mt-6 border-l border-brand-accent/40 pl-5">
          <p className="font-sans text-label uppercase tracking-[0.24em] text-text-muted">
            {result.yourWords}
          </p>
          <p className="mt-2 font-serif text-h4 italic leading-relaxed text-text-primary/85">
            &ldquo;{concept.promptSummary}&rdquo;
          </p>
        </blockquote>
      )}

      {concept.story && (
        <div className="mt-7">
          <Eyebrow>{result.storyHeading}</Eyebrow>
          <p className="mt-3 text-body-lg leading-relaxed text-text-secondary">
            {concept.story}
          </p>
        </div>
      )}

      <div className="mt-8">
        <AiStudioActions
          copy={copy}
          busyMessage={busyMessage}
          error={error}
          note={note}
          isSaved={isSaved}
          tryOnHref={tryOnHref}
          onOpenRefine={() => setRefining(true)}
          onVary={onVary}
          onSave={onSave}
          onShare={onShare}
        />
      </div>

      {refining && (
        <div className="mt-6">
          <AiRefinePrompt
            copy={refineCopy}
            busy={Boolean(busyAction)}
            onSubmit={handleRefineSubmit}
            onCancel={() => setRefining(false)}
          />
        </div>
      )}

      {concept.images.length > 1 && (
        <div className="mt-10">
          <h3 className="font-serif text-h3">{result.variationsHeading}</h3>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4">
            {concept.images.map((image, index) => (
              <AiVariationCard
                key={`${concept.id}-${index}`}
                image={image}
                label={
                  index === 0
                    ? result.originalPlate
                    : `${result.variationPrefix} ${String(index).padStart(2, "0")}`
                }
                selected={index === plateIndex}
                onSelect={() => onPlateChange(index)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

AiDesignResult.propTypes = {
  /** The atelier content model. */
  copy: PropTypes.shape({
    result: PropTypes.shape({
      yourWords: PropTypes.string.isRequired,
      storyHeading: PropTypes.string.isRequired,
      variationsHeading: PropTypes.string.isRequired,
      originalPlate: PropTypes.string.isRequired,
      variationPrefix: PropTypes.string.isRequired,
    }).isRequired,
    context: PropTypes.shape({
      jewelleryTypes: PropTypes.array,
      styles: PropTypes.array,
      occasions: PropTypes.array,
    }).isRequired,
    refine: PropTypes.object.isRequired,
  }).isRequired,
  concept: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    promptSummary: PropTypes.string,
    category: PropTypes.string,
    style: PropTypes.string,
    occasion: PropTypes.string,
    purity: PropTypes.string,
    status: PropTypes.string,
    story: PropTypes.string,
    images: PropTypes.arrayOf(PropTypes.object).isRequired,
  }).isRequired,
  activePlate: PropTypes.number,
  onPlateChange: PropTypes.func.isRequired,
  /** Which action is rendering (`create` / `refine` / `vary`) or null. */
  busyAction: PropTypes.string,
  busyMessage: PropTypes.string,
  error: PropTypes.shape({ message: PropTypes.string }),
  note: PropTypes.string,
  isSaved: PropTypes.bool,
  /** Where "Try It On" carries the concept — the shared fitting room. */
  tryOnHref: PropTypes.string,
  onRefine: PropTypes.func.isRequired,
  onVary: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onShare: PropTypes.func.isRequired,
};
