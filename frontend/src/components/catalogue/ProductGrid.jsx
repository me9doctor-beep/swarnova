import PropTypes from "prop-types";
import ProductCard from "../cards/ProductCard.jsx";
import { cn } from "../../utils/cn.js";

/**
 * PRODUCT GRID — the responsive grid of the shared ProductCard used by every
 * catalogue listing. Two columns on phones (imagery stays readable), three on
 * laptops, four on wide desktops; the card owns its own 4:3 media ratio.
 */
export default function ProductGrid({ products, showTryOn = false, className }) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-4 gap-y-9 md:gap-x-6 md:gap-y-12 lg:grid-cols-3 xl:grid-cols-4",
        className
      )}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} showTryOn={showTryOn} />
      ))}
    </div>
  );
}

ProductGrid.propTypes = {
  products: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string.isRequired })).isRequired,
  showTryOn: PropTypes.bool,
  className: PropTypes.string,
};
