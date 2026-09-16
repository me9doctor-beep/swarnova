import PropTypes from "prop-types";
import { cn } from "../../utils/cn.js";

/**
 * CARD — the one surface foundation.
 *
 * Specialised cards compose it instead of re-declaring border, background,
 * radius and hover behaviour:
 *
 *   Card
 *   ├── Card.Media   image frame (ratio, optional link, optional overlay)
 *   └── Card.Body    flex column that grows to fill the card (padding scale)
 *
 * The storefront's editorial cards and the console's panels are the same
 * surface with different density — not two card systems.
 */
const ratios = {
  "4/3": "aspect-[4/3]",
  "3/2": "aspect-[3/2]",
  "16/9": "aspect-[16/9]",
  "4/5": "aspect-[4/5]",
  square: "aspect-square",
};

const paddings = {
  none: "",
  sm: "p-5",
  md: "p-panel sm:p-7",
};

function CardMedia({ ratio = "4/3", href, ariaLabel, overlay, className, children }) {
  const aspect = ratios[ratio] ?? ratios["4/3"];

  /* Without an overlay action the frame itself is the link, so no wrapper is
     introduced between the card and its image. With one, the link is nested in
     a relative frame: an overlay action (wishlist, quick view) must sit beside
     the anchor, never inside it. */
  if (!overlay) {
    const frame = cn("block overflow-hidden bg-surface-secondary", aspect, className);

    return href ? (
      <a href={href} aria-label={ariaLabel} className={frame}>
        {children}
      </a>
    ) : (
      <div className={frame}>{children}</div>
    );
  }

  const inner = cn("block overflow-hidden", aspect);

  return (
    <div className={cn("relative overflow-hidden bg-surface-secondary", className)}>
      {href ? (
        <a href={href} aria-label={ariaLabel} className={inner}>
          {children}
        </a>
      ) : (
        <div className={inner}>{children}</div>
      )}
      {overlay}
    </div>
  );
}

CardMedia.propTypes = {
  ratio: PropTypes.oneOf(Object.keys(ratios)),
  href: PropTypes.string,
  ariaLabel: PropTypes.string,
  /** Absolutely positioned action (wishlist, quick view, badge). */
  overlay: PropTypes.node,
  className: PropTypes.string,
  children: PropTypes.node,
};

function CardBody({ padding = "none", className, children }) {
  return (
    <div className={cn("flex flex-1 flex-col", paddings[padding], className)}>{children}</div>
  );
}

CardBody.propTypes = {
  padding: PropTypes.oneOf(Object.keys(paddings)),
  className: PropTypes.string,
  children: PropTypes.node,
};

export default function Card({
  as: Tag = "article",
  interactive = false,
  className,
  children,
  ...rest
}) {
  return (
    <Tag
      className={cn(
        "flex h-full flex-col border border-border-default bg-surface-primary",
        interactive && "transition-colors duration-200 hover:border-brand-accent/45",
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

Card.propTypes = {
  as: PropTypes.elementType,
  /** Adds the hairline hover treatment used by clickable storefront cards. */
  interactive: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node,
};

Card.Media = CardMedia;
Card.Body = CardBody;
