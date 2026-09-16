import PropTypes from "prop-types";

/**
 * PRODUCT SPECIFICATIONS — the piece's own details as a quiet definition
 * list, not a technical table.
 *
 * Rows are derived from the product contract, and a field the catalogue does
 * not carry is simply not rendered: nothing here invents an attribute to fill
 * the grid. `purity`, `weight` and `sku` come from the piece; `category` and
 * `collection` from the catalogue entities the screen resolved. Availability
 * is not repeated here — it is the live status shown beside the price.
 */
export default function ProductSpecifications({ product, category, collection }) {
  const rows = [
    { term: "Purity", detail: product.purity && `${product.purity} gold` },
    { term: "Weight", detail: product.weight },
    { term: "Reference", detail: product.sku },
    { term: "Category", detail: category?.name },
    { term: "Collection", detail: collection?.name },
  ].filter((row) => row.detail);

  if (rows.length === 0) return null;

  return (
    <section aria-labelledby="product-specifications-title" className="mt-9">
      <h2
        id="product-specifications-title"
        className="font-sans text-label uppercase tracking-[0.24em] text-text-secondary"
      >
        Specifications
      </h2>
      <dl className="mt-4 grid grid-cols-1 border-t border-border-default sm:grid-cols-2 sm:gap-x-8">
        {rows.map((row) => (
          <div
            key={row.term}
            className="flex items-baseline justify-between gap-4 border-b border-border-default py-3"
          >
            <dt className="font-sans text-label uppercase tracking-[0.18em] text-text-muted">
              {row.term}
            </dt>
            <dd className="text-right text-body-sm text-text-primary">{row.detail}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

ProductSpecifications.propTypes = {
  product: PropTypes.shape({
    purity: PropTypes.string,
    weight: PropTypes.string,
    sku: PropTypes.string,
    availability: PropTypes.string,
  }).isRequired,
  category: PropTypes.shape({ name: PropTypes.string }),
  collection: PropTypes.shape({ name: PropTypes.string }),
};
