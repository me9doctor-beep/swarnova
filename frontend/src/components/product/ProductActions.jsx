import { useState } from "react";
import PropTypes from "prop-types";
import { Check } from "lucide-react";
import Button from "../ui/Button.jsx";
import { useCart } from "../../state/CartContext.jsx";
import { cn } from "../../utils/cn.js";

/**
 * COMMERCE ACTIONS — the two purchase intents, shared by `ProductCard` and the
 * product detail screen so the wording, the feedback and the bag behaviour are
 * defined once instead of twice.
 *
 *   Add to Cart — outline, the considered intent
 *   Buy Now     — solid wine, the direct purchase intent
 *
 * Both compose the shared `Button`; neither navigates, so adding a piece never
 * pulls the customer off the screen they are browsing. The confirmation is the
 * storefront's existing in-place language (the newsletter's gold status line),
 * not a modal.
 *
 * Buy Now records the piece as the direct-purchase line in the bag. When the
 * commerce phase registers its checkout route, this component is the single
 * call site that navigates to it.
 */
const layouts = {
  /* On a card the two actions stack: a 2-up phone card is ~160px wide, which
     cannot hold both labels side by side. From `md` the card is wide enough
     for the row, with tighter padding than the detail screen's buttons.
     `min-h-11` keeps the compact action on the storefront's 44px thumb
     target — the density table's promise for anything a phone can tap. */
  sm: { row: "flex-col md:flex-row", button: "min-h-11 flex-1 px-4" },
  md: { row: "flex-col sm:flex-row", button: "flex-1" },
};

export default function ProductActions({ product, size = "md", className }) {
  const { add, quantityOf } = useCart();
  const [confirmed, setConfirmed] = useState(null);

  const layout = layouts[size] ?? layouts.md;
  const quantity = quantityOf(product.id);
  const suffix = quantity > 1 ? ` · ${quantity} pieces in your bag` : "";

  const act = (intent) => {
    add(product);
    setConfirmed(intent);
  };

  return (
    <div className={cn("w-full", className)}>
      <div className={cn("flex gap-2.5", layout.row)}>
        <Button
          variant="outline"
          size={size}
          className={layout.button}
          onClick={() => act("cart")}
        >
          Add to Cart
        </Button>
        <Button size={size} className={layout.button} onClick={() => act("buy")}>
          Buy Now
        </Button>
      </div>

      {confirmed && (
        <p
          role="status"
          className="mt-3 flex items-center justify-center gap-2 text-body-sm text-brand-accent-strong"
        >
          <Check size={14} strokeWidth={1.6} aria-hidden="true" />
          {confirmed === "buy"
            ? `Added to your bag — ready for checkout${suffix}`
            : `Added to your bag${suffix}`}
        </p>
      )}
    </div>
  );
}

ProductActions.propTypes = {
  /** The piece being purchased — stored as the bag line. */
  product: PropTypes.shape({ id: PropTypes.string.isRequired }).isRequired,
  size: PropTypes.oneOf(["sm", "md"]),
  className: PropTypes.string,
};
