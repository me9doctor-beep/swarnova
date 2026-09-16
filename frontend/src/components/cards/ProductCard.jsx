import PropTypes from "prop-types";
import { Heart } from "lucide-react";
import Price from "../ui/Price.jsx";
import Rating from "../ui/Rating.jsx";
import { useWishlist } from "../../state/WishlistContext.jsx";
import { cn } from "../../utils/cn.js";

/**
 * Premium catalogue product card — dominant image, quiet type, hairline
 * border, single wishlist action. No badges, no heavy shadows, no overlays.
 */
export default function ProductCard({ product }) {
  const { has, toggle } = useWishlist();
  const wished = has(product.id);
  const image = product.images?.[0];

  return (
    <article className="group flex h-full flex-col">
      <div className="relative overflow-hidden border border-line bg-ivory transition-colors duration-200 group-hover:border-gold/45">
        <a
          href={product.href}
          aria-label={`View ${product.name}`}
          className="block aspect-[4/3] overflow-hidden"
        >
          <img
            src={image?.src}
            alt={image?.alt ?? product.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </a>
        <button
          type="button"
          onClick={() => toggle(product.id)}
          aria-pressed={wished}
          aria-label={wished ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center border border-line bg-paper/90 text-ash transition-colors duration-200 hover:border-gold/50 hover:text-wine sm:h-9 sm:w-9"
        >
          <Heart
            size={15}
            strokeWidth={1.5}
            className={cn(wished && "fill-wine text-wine")}
          />
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center pt-4 text-center">
        <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-gold-deep">
          {product.purity} Gold
        </p>
        <h3 className="mt-2 font-serif text-[19px] leading-snug">
          <a href={product.href} className="transition-colors duration-200 hover:text-wine">
            {product.name}
          </a>
        </h3>
        <Price amount={product.price} className="mt-1.5" />
        {product.rating && (
          <Rating
            average={product.rating.average}
            className="mt-2.5"
            size={11}
          />
        )}
      </div>
    </article>
  );
}

ProductCard.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    purity: PropTypes.string,
    price: PropTypes.number.isRequired,
    href: PropTypes.string,
    images: PropTypes.array,
    rating: PropTypes.shape({ average: PropTypes.number }),
  }).isRequired,
};
