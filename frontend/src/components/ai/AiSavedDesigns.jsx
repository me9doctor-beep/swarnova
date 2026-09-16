import PropTypes from "prop-types";
import { X } from "lucide-react";
import Button from "../ui/Button.jsx";
import Card from "../ui/Card.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import IconButton from "../ui/IconButton.jsx";
import { optionLabel } from "../../utils/optionLabel.js";

/**
 * The customer's saved concepts for this visit — composed from the shared
 * Card foundation. Opening a design hands its snapshot back to the studio;
 * removing it is a quiet icon action beside the card's link-level content.
 */
export default function AiSavedDesigns({ copy, context, designs, onOpen, onRemove }) {
  if (designs.length === 0) {
    return <EmptyState>{copy.empty}</EmptyState>;
  }

  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {designs.map((entry) => {
        const { concept } = entry;
        const plate = concept.images?.[0];
        const categoryLabel = optionLabel(context.jewelleryTypes, concept.category);

        return (
          <li key={entry.saveId}>
            <Card className="h-full">
              <Card.Media ratio="4/3">
                <img
                  src={plate?.src}
                  alt={plate?.alt ?? concept.title}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </Card.Media>
              <Card.Body padding="sm">
                <p className="text-label font-medium uppercase tracking-[0.3em] text-brand-accent-strong">
                  {concept.purity} Gold{categoryLabel ? ` · ${categoryLabel}` : ""}
                </p>
                <h3 className="mt-2 font-serif text-h4 leading-snug">{concept.title}</h3>
                <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                  <Button size="sm" variant="outline" onClick={() => onOpen(entry)}>
                    {copy.open}
                  </Button>
                  <IconButton
                    label={`${copy.remove} ${concept.title} from saved designs`}
                    variant="outline"
                    size="md"
                    onClick={() => onRemove(entry.saveId)}
                  >
                    <X size={15} strokeWidth={1.5} />
                  </IconButton>
                </div>
              </Card.Body>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}

AiSavedDesigns.propTypes = {
  copy: PropTypes.shape({
    empty: PropTypes.string.isRequired,
    open: PropTypes.string.isRequired,
    remove: PropTypes.string.isRequired,
  }).isRequired,
  context: PropTypes.shape({
    jewelleryTypes: PropTypes.array,
  }).isRequired,
  designs: PropTypes.arrayOf(
    PropTypes.shape({
      saveId: PropTypes.string.isRequired,
      concept: PropTypes.shape({
        id: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        category: PropTypes.string,
        purity: PropTypes.string,
        images: PropTypes.array,
      }).isRequired,
    })
  ).isRequired,
  onOpen: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
};
