import PropTypes from "prop-types";
import { Heart, Sparkles } from "lucide-react";
import Button from "../ui/Button.jsx";
import Card from "../ui/Card.jsx";
import ContentLink from "../ui/ContentLink.jsx";
import IconButton from "../ui/IconButton.jsx";
import Price from "../ui/Price.jsx";
import Rating from "../ui/Rating.jsx";
import ProductActions from "../product/ProductActions.jsx";
import { useWishlist } from "../../state/WishlistContext.jsx";
import { useStorefrontAvailability } from "../../features/storefront/StorefrontFeatures.jsx";
import { isFeatureOpen } from "../../features/storefront/availability.js";
import { cn } from "../../utils/cn.js";

/**
 * Premium catalogue product card — dominant image, quiet type, hairline
 * border, the two commerce actions and the wishlist. Composed from the shared
 * Card foundation.
 *
 * Imagery and name carry the customer to the product detail route; the
 * commerce actions are siblings of those links, never nested inside them, so
 * adding a piece from the catalogue never navigates away from it.
 */
export default function ProductCard({ product, showTryOn = false }) {
  const { has, toggle } = useWishlist();
  const availability = useStorefrontAvailability();
  const tryOnOpen = isFeatureOpen(availability, "virtualTryOn");
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
              className={cn(wished && "fill-brand-primary text-brand-primary")}
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

      <Card.Body className="items-center pt-5 text-center">
        <p className="text-label font-medium uppercase tracking-[0.3em] text-brand-accent-strong">
          {product.purity} Gold
        </p>
        <h3 className="mt-2 font-serif text-h4 leading-snug">
          <ContentLink href={product.href} className="transition-colors duration-200 hover:text-brand-primary">
            {product.name}
          </ContentLink>
        </h3>
        <Price amount={product.price} className="mt-1.5" />
        {product.rating && (
          <Rating average={product.rating.average} className="mt-2.5" size={11} />
        )}
        {/* `mt-auto` sits the actions on the same line across a row, however
            many lines the piece's name takes. */}
        <ProductActions product={product} size="sm" className="mt-auto pt-5" />
        {showTryOn && product.tryOnAvailable && tryOnOpen && (
          <Button
            variant="outline"
            size="sm"
            href={`/virtual-try-on?product=${product.id}`}
            className="mt-2.5 w-full"
          >
            <Sparkles size={12} strokeWidth={1.5} aria-hidden="true" />
            Try It On
          </Button>
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
    tryOnAvailable: PropTypes.bool,
    rating: PropTypes.shape({ average: PropTypes.number }),
  }).isRequired,
  showTryOn: PropTypes.bool,
};
