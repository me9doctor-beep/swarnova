import PropTypes from "prop-types";
import { Heart } from "lucide-react";
import Badge from "../ui/Badge.jsx";
import Button from "../ui/Button.jsx";
import Eyebrow from "../ui/Eyebrow.jsx";
import Price from "../ui/Price.jsx";
import Rating from "../ui/Rating.jsx";
import ProductActions from "./ProductActions.jsx";
import ProductSpecifications from "./ProductSpecifications.jsx";
import { useWishlist } from "../../state/WishlistContext.jsx";
import { cn } from "../../utils/cn.js";

/** Copy for the availability values the product contract actually carries. */
const AVAILABILITY = {
  available: "In stock",
};

/**
 * PRODUCT SUMMARY — the information column beside the gallery.
 *
 * The whole reading order of a piece lives in this one column — collection,
 * name, rating, price, availability, specifications, the two commerce actions
 * and the wishlist — so the desktop column and the phone stack are the same
 * composition rather than two implementations.
 *
 * The wishlist is the shared storefront state: a piece wished from a
 * ProductCard is already wished here, and the reverse.
 */
export default function ProductSummary({ product, category, collection }) {
  const { has, toggle } = useWishlist();
  const wished = has(product.id);
  const lineage = collection?.name ?? category?.name;
  const availability = product.availability && AVAILABILITY[product.availability];

  return (
    <div>
      {lineage && <Eyebrow className="mb-4 block">{lineage}</Eyebrow>}

      <h1 className="text-balance font-serif text-h1 leading-[1.14] sm:text-display">
        {product.name}
      </h1>

      {product.rating && (
        <Rating
          average={product.rating.average}
          count={product.rating.count}
          showCount
          size={14}
          className="mt-4"
        />
      )}

      {/* The price gets its own register, hairlined above and below. */}
      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 border-y border-border-default py-5">
        <Price amount={product.price} currency={product.currency} className="text-h3" />
        {availability && (
          <Badge variant="success" dot>
            {availability}
          </Badge>
        )}
      </div>

      <ProductSpecifications product={product} category={category} collection={collection} />

      <ProductActions product={product} className="mt-8" />

      <Button
        variant="ghost"
        onClick={() => toggle(product.id)}
        aria-pressed={wished}
        className="mt-4 w-full sm:w-auto"
      >
        <Heart
          size={15}
          strokeWidth={1.5}
          aria-hidden="true"
          className={cn(wished && "fill-brand-primary text-brand-primary")}
        />
        {wished ? "Saved to Wishlist" : "Add to Wishlist"}
      </Button>
    </div>
  );
}

ProductSummary.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    currency: PropTypes.string,
    purity: PropTypes.string,
    weight: PropTypes.string,
    sku: PropTypes.string,
    availability: PropTypes.string,
    rating: PropTypes.shape({
      average: PropTypes.number,
      count: PropTypes.number,
    }),
  }).isRequired,
  /** Resolved catalogue entities — the piece carries only their ids. */
  category: PropTypes.shape({ name: PropTypes.string }),
  collection: PropTypes.shape({ name: PropTypes.string }),
};
