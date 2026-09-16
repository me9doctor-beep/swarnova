import PropTypes from "prop-types";
import Container from "../ui/Container.jsx";
import Eyebrow from "../ui/Eyebrow.jsx";

/**
 * CATALOGUE HEADER — the page masthead for every customer catalogue screen:
 * eyebrow, the page's single serif H1, the house ornament, a short
 * description and the quiet result count.
 *
 * It speaks the storefront's own SectionHeading/Eyebrow language — the
 * console PageHeader is not used here.
 */
export default function CatalogueHeader({ eyebrow, title, description, count }) {
  return (
    <Container className="pb-10 pt-[160px] sm:pb-12">
      <div className="mx-auto max-w-2xl text-center">
        <Eyebrow tone="gold">{eyebrow}</Eyebrow>
        <h1 className="mt-4 text-balance text-h1 text-text-primary sm:text-display">{title}</h1>
        <div className="ornament mt-6">
          <span aria-hidden="true" />
        </div>
        {description && (
          <p className="mx-auto mt-6 max-w-xl text-body-lg text-text-secondary">{description}</p>
        )}
        {count != null && (
          <p className="mt-4 font-sans text-label uppercase tracking-[0.18em] text-text-muted">
            {count} {count === 1 ? "piece" : "pieces"}
          </p>
        )}
      </div>
    </Container>
  );
}

CatalogueHeader.propTypes = {
  eyebrow: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  /** Result count, e.g. 8 → "8 pieces". Omitted while data is loading. */
  count: PropTypes.number,
};
