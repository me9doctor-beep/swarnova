import PropTypes from "prop-types";
import Badge from "../ui/Badge.jsx";
import Button from "../ui/Button.jsx";
import Price from "../ui/Price.jsx";

/**
 * SELECTED JEWELLERY — the piece the room is dressing: a quiet plate, the
 * name and the lineage, a badge naming where it came from (the AI Studio or
 * the catalogue) and the single Change Jewellery affordance that opens the
 * shared catalogue rail. Both journeys into the room render this one card.
 */
export default function TryOnJewelleryCard({
  copy,
  jewellery,
  sourceType,
  changing = false,
  onChangeRequest,
}) {
  const image = jewellery.images?.[0];
  const fromStudio = sourceType === "ai-design";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-sans text-label font-medium uppercase tracking-[0.24em] text-text-secondary">
          {copy.heading}
        </h2>
        <Badge variant={fromStudio ? "brand" : "neutral"}>
          {fromStudio ? copy.fromStudio : copy.fromCatalogue}
        </Badge>
      </div>

      <div className="mt-5 flex items-start gap-5">
        <div className="w-24 shrink-0 border border-border-default bg-surface-secondary sm:w-28">
          <img
            src={image?.src}
            alt={image?.alt ?? jewellery.name}
            className="aspect-square w-full object-cover"
          />
        </div>
        <div className="min-w-0">
          <h3 className="font-serif text-h4 leading-snug text-text-primary">
            {jewellery.name}
          </h3>
          <p className="mt-2 text-body-sm text-text-secondary">
            {jewellery.purity} Gold
            {jewellery.category ? ` · ${jewellery.category}` : ""}
          </p>
          {typeof jewellery.price === "number" && (
            <Price amount={jewellery.price} currency={jewellery.currency} className="mt-2 block" />
          )}
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="-ml-6 mt-4 sm:-ml-8"
        aria-expanded={changing}
        aria-controls="try-on-change"
        onClick={onChangeRequest}
      >
        {copy.change}
      </Button>
    </div>
  );
}

TryOnJewelleryCard.propTypes = {
  /** The room copy model's `jewellery` block. */
  copy: PropTypes.shape({
    heading: PropTypes.string.isRequired,
    fromStudio: PropTypes.string.isRequired,
    fromCatalogue: PropTypes.string.isRequired,
    change: PropTypes.string.isRequired,
  }).isRequired,
  /** The source's jewellery summary. */
  jewellery: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    category: PropTypes.string,
    purity: PropTypes.string,
    images: PropTypes.array,
    price: PropTypes.number,
    currency: PropTypes.string,
  }).isRequired,
  sourceType: PropTypes.oneOf(["ai-design", "product"]).isRequired,
  changing: PropTypes.bool,
  onChangeRequest: PropTypes.func.isRequired,
};
