import PropTypes from "prop-types";

/** Light, quiet category card in the reference's collection-grid language. */
export default function CollectionCard({ category }) {
  return (
    <article className="group flex h-full flex-col border border-line bg-paper text-center transition-colors duration-200 hover:border-gold/45">
      <a
        href={category.cta?.href ?? "#"}
        aria-label={`Explore ${category.name}`}
        className="block overflow-hidden bg-ivory"
      >
        <div className="aspect-square overflow-hidden">
          <img
            src={category.image?.src}
            alt={category.image?.alt ?? category.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>
      </a>
      <div className="flex flex-1 flex-col px-4 pb-7 pt-5">
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
      </div>
    </article>
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
