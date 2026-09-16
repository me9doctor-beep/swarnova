import PropTypes from "prop-types";
import AsyncBoundary from "../ui/AsyncBoundary.jsx";
import Button from "../ui/Button.jsx";
import { useCategories } from "../../hooks/useCategories.js";
import { useProducts } from "../../hooks/useProducts.js";

/**
 * CHANGE JEWELLERY — the eligible rail. The room asks the catalogue for its
 * `tryOnAvailable` pieces through the shared product provider, so no second
 * jewellery dataset exists and unsupported pieces never surface. Choosing a
 * piece swaps the source under the room's URL; the photograph stays put.
 */
export default function TryOnJewellerySelector({ copy, currentId, onSelect }) {
  const { status, data: products, error, retry } = useProducts({ tryOnAvailable: true });
  const { data: categories } = useCategories();

  const categoryName = (categoryId) =>
    categories?.find((item) => item.id === categoryId)?.name;

  const options = (products ?? []).filter((product) => product.id !== currentId);

  return (
    <AsyncBoundary
      status={status}
      error={error}
      onRetry={retry}
      isEmpty={options.length === 0}
      emptyMessage={copy.empty}
      className="py-4"
    >
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {options.map((product) => {
          const image = product.images?.[0];
          const lineage = categoryName(product.categoryId);
          return (
            <li key={product.id}>
              <article className="flex h-full flex-col border border-border-default bg-surface-primary transition-colors duration-200 hover:border-brand-accent/45">
                <div className="aspect-[4/3] overflow-hidden border-b border-border-default bg-surface-secondary">
                  <img
                    src={image?.src}
                    alt={image?.alt ?? product.name}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col items-center p-5 text-center">
                  <p className="text-label font-medium uppercase tracking-[0.3em] text-brand-accent-strong">
                    {product.purity} Gold
                  </p>
                  <h3 className="mt-2 font-serif text-h4 leading-snug text-text-primary">
                    {product.name}
                  </h3>
                  {lineage && (
                    <p className="mt-1 text-body-sm text-text-muted">{lineage}</p>
                  )}
                  <div className="mt-auto w-full pt-5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => onSelect(product.id)}
                    >
                      {copy.select}
                    </Button>
                  </div>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </AsyncBoundary>
  );
}

TryOnJewellerySelector.propTypes = {
  /** The room copy model's `change` block. */
  copy: PropTypes.shape({ empty: PropTypes.string.isRequired, select: PropTypes.string.isRequired }).isRequired,
  /** The piece already on the mirror (a product source), excluded from the rail. */
  currentId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
};
