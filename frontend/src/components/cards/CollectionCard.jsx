import PropTypes from "prop-types";
import Card from "../ui/Card.jsx";

/**
 * Frameless editorial category tile — the imagery carries the card, the
 * label sits beneath on the section surface with a quiet gold hairline.
 * No frame, no shadow: collection imagery reads as fashion photography.
 */
export default function CollectionCard({ category }) {
  return (
    <Card className="group border-0 bg-transparent text-center">
      <Card.Media
        ratio="square"
        href={category.cta?.href ?? "#"}
        ariaLabel={`Explore ${category.name}`}
      >
        <img
          src={category.image?.src}
          alt={category.image?.alt ?? category.name}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </Card.Media>

      <Card.Body className="pt-6">
        <h3 className="font-sans text-caption font-medium uppercase tracking-[0.3em] text-text-primary">
          <a
            href={category.cta?.href ?? "#"}
            className="transition-colors duration-200 hover:text-brand-primary"
          >
            {category.name}
          </a>
        </h3>
        <div
          className="mx-auto mt-3 h-px w-8 bg-brand-accent/50"
          aria-hidden="true"
        />
        <p className="mt-3 font-serif text-body-lg italic leading-snug text-text-secondary">
          {category.tagline}
        </p>
      </Card.Body>
    </Card>
  );
}

CollectionCard.propTypes = {
  category: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    tagline: PropTypes.string,
    image: PropTypes.shape({ src: PropTypes.string, alt: PropTypes.string }),
    cta: PropTypes.shape({ href: PropTypes.string }),
  }).isRequired,
};
