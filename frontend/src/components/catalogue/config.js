import { formatter } from "../ui/Price.jsx";

/**
 * CATALOGUE CONFIG — the discovery vocabulary of the customer catalogue.
 *
 * The price bands are derived from the catalogue's actual price spread
 * (₹49,600 – ₹1,42,000); the sort options are the only orderings the product
 * contract supports — there is deliberately no "Newest" because the model
 * carries no date or position field.
 *
 * Pages mirror these values in the URL (`?price=…&sort=…`) and translate them
 * into the provider query (numeric bounds, sort key), so a future API
 * provider consumes the same contract without knowing about band slugs.
 */
export const PRICE_RANGES = [
  { value: "under-75k", label: `Under ${formatter.format(75000)}`, min: null, max: 75000 },
  {
    value: "75k-100k",
    label: `${formatter.format(75000)} – ${formatter.format(100000)}`,
    min: 75001,
    max: 100000,
  },
  { value: "above-100k", label: `Above ${formatter.format(100000)}`, min: 100001, max: null },
];

export const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
];

export const DEFAULT_SORT = "featured";
