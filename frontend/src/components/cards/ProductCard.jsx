import PropTypes from "prop-types";
import { Heart } from "lucide-react";
import Card from "../ui/Card.jsx";
import IconButton from "../ui/IconButton.jsx";
import Price from "../ui/Price.jsx";
import Rating from "../ui/Rating.jsx";
import { useWishlist } from "../../state/WishlistContext.jsx";
import { cn } from "../../utils/cn.js";

/**
 * Premium catalogue product card — dominant image, quiet type, hairline
 * border, single wishlist action. Composed from the shared Card foundation.
 */
export default function ProductCard({ product }) {
  const { has, toggle } = useWishlist();
  const wished = has(product.id);
  const image = product.images?.[0];

  return (
    <article className="group flex h-full flex-col">
      {/* The wishlist action is the shared IconButton, anchored beside the
          image link rather than nested inside it. */}
      <Card.Media
        ratio="4/3"
        href={product.href}
        ariaLabel={`View ${product.name}`}
        className="border border-border-default transition-colors duration-200 group-hover:border-brand-accent/45"
        overlay={
          <IconButton
            label={
              wished
                ? `Remove ${product.name} from wishlist`
                : `Add ${product.name} to wishlist`
            }
            aria-pressed={wished}
            variant="outline"
            size="touch"
            onClick={() => toggle(product.id)}
            className="absolute right-3 top-3 bg-surface-primary/90 sm:h-9 sm:w-9"
          >
            <Heart
              size={15}
              strokeWidth={1.5}
              className={cn(wished && "fill-wine text-wine")}
            />
          </IconButton>
        }
      >
        <img
          src={image?.src}
          alt={image?.alt ?? product.name}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </Card.Media>

      <Card.Body className="items-center pt-4 text-center">
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
          <Rating average={product.rating.average} className="mt-2.5" size={11} />
        )}
      </Card.Body>
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
