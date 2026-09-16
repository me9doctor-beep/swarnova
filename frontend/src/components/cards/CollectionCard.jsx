import PropTypes from "prop-types";
import Card from "../ui/Card.jsx";

/** Light, quiet category card in the reference's collection-grid language. */
export default function CollectionCard({ category }) {
  return (
    <Card interactive className="group text-center">
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

      <Card.Body className="px-4 pb-7 pt-5">
        <h3 className="font-sans text-[12px] font-medium uppercase tracking-[0.3em] text-ink">
          <a
            href={category.cta?.href ?? "#"}
            className="transition-colors duration-200 hover:text-wine"
          >
            {category.name}
          </a>
        </h3>
        <p className="mt-2 font-serif text-[17px] italic leading-snug text-ash">
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
