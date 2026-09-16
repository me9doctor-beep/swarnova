import PropTypes from "prop-types";
import { X } from "lucide-react";
import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";
import Select from "../ui/Select.jsx";
import { useCategories } from "../../hooks/useCategories.js";
import { PRICE_RANGES, SORT_OPTIONS } from "./config.js";
import { cn } from "../../utils/cn.js";

/**
 * CATALOGUE CONTROLS — the discovery toolbar for the customer catalogue.
 *
 * Fully controlled: the owning page keeps the browsing state (mirrored in the
 * URL) and passes it back as `value`; this component only expresses intent —
 * an optional search field, the category / price filters, the sort select,
 * the active-filter chips and the reset. Category options are data-driven
 * from the provider, never hard-coded.
 *
 * Mobile keeps the toolbar inline: two-up selects, thumb-friendly native
 * controls — no desktop sidebar, no drawer.
 */
export default function CatalogueControls({
  value,
  onChange,
  onReset,
  showSearch = false,
  showCategory = false,
  showPrice = false,
}) {
  /* Category labels resolve from the catalogue data (the options are data). */
  const { data: categories } = useCategories();

  const chips = [];
  if (showCategory && value.category) {
    chips.push({
      key: "category",
      label: categories?.find((item) => item.slug === value.category)?.name ?? value.category,
      patch: { category: "" },
    });
  }
  if (showPrice && value.price) {
    chips.push({
      key: "price",
      label: PRICE_RANGES.find((range) => range.value === value.price)?.label ?? value.price,
      patch: { price: "" },
    });
  }
  if (showSearch && value.q) {
    chips.push({ key: "q", label: `“${value.q}”`, patch: { q: "" } });
  }

  const sortOnly = !showCategory && !showPrice;

  return (
    <div>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
        {showSearch && (
          <div className="w-full lg:max-w-xs">
            <Input
              id="search"
              label="Search"
              placeholder="Search by name"
              value={value.q}
              onChange={(event) => onChange({ q: event.target.value })}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:justify-end">
          {showCategory && (
            <div className="min-w-0 sm:w-44">
              <Select
                label="Category"
                size="sm"
                value={value.category}
                onChange={(event) => onChange({ category: event.target.value })}
              >
                <option value="">All categories</option>
                {(categories ?? []).map((category) => (
                  <option key={category.id} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </div>
          )}
          {showPrice && (
            <div className="min-w-0 sm:w-44">
              <Select
                label="Price"
                size="sm"
                value={value.price}
                onChange={(event) => onChange({ price: event.target.value })}
              >
                <option value="">All price ranges</option>
                {PRICE_RANGES.map((range) => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </Select>
            </div>
          )}
          <div className={cn("min-w-0 sm:w-44", sortOnly && "col-span-2 sm:col-span-1")}>
            <Select
              label="Sort by"
              size="sm"
              value={value.sort}
              onChange={(event) => onChange({ sort: event.target.value })}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-2.5" aria-label="Active filters">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => onChange(chip.patch)}
              aria-label={`Remove filter: ${chip.label}`}
              className="inline-flex items-center gap-1.5 rounded-sm border border-brand-accent/35 bg-surface-muted px-2.5 py-1.5 font-sans text-label uppercase text-brand-accent-strong transition-colors duration-200 hover:border-brand-primary hover:text-brand-primary"
            >
              {chip.label}
              <X size={11} strokeWidth={1.7} aria-hidden="true" />
            </button>
          ))}
          <Button variant="link" size="sm" onClick={onReset}>
            Reset all
          </Button>
        </div>
      )}
    </div>
  );
}

CatalogueControls.propTypes = {
  /** Current browsing state: { sort, price, category, q } — "" = default. */
  value: PropTypes.shape({
    sort: PropTypes.string.isRequired,
    price: PropTypes.string,
    category: PropTypes.string,
    q: PropTypes.string,
  }).isRequired,
  /** Merge a partial state change, e.g. `({ price: "under-75k" })`. */
  onChange: PropTypes.func.isRequired,
  /** Clear every filter, search and sort in one action. */
  onReset: PropTypes.func.isRequired,
  showSearch: PropTypes.bool,
  showCategory: PropTypes.bool,
  showPrice: PropTypes.bool,
};
