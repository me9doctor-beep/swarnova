import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { cn } from "../../utils/cn.js";
import { externalLinkProps, isExternalUrl, isInternalPath } from "../../utils/links.js";

/**
 * ICON BUTTON — the single square action primitive for icon-only controls:
 * search, wishlist, bag, notifications, sidebar/menu triggers, table row
 * actions. Same tokens as Button, always labelled for assistive technology.
 *
 * `label` is required: it becomes the accessible name, so an icon button can
 * never ship unlabelled. The glyph itself stays decorative.
 */
const sizes = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  /* 44px on phones, the original 40px from `sm` up — the thumb target used by
     both the storefront header and the console triggers. */
  touch: "h-11 w-11 sm:h-10 sm:w-10",
};

const variants = {
  plain: "text-text-primary/75 hover:text-brand-primary",
  outline:
    "border border-border-default text-text-secondary hover:border-brand-accent/45 hover:text-brand-primary",
  inverse: "text-white/90 hover:text-white",
  solid:
    "bg-brand-primary text-text-inverse hover:bg-brand-primary-strong",
};

const base =
  "relative inline-flex shrink-0 items-center justify-center rounded-sm transition-[color,background-color,border-color,opacity,transform] duration-[var(--motion-standard)] ease-[var(--ease-standard)] disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.96]";

export default function IconButton({
  label,
  children,
  variant = "plain",
  size = "md",
  badge,
  href,
  to,
  className,
  type = "button",
  ...rest
}) {
  const classes = cn(base, sizes[size], variants[variant], className);

  const content = (
    <>
      {children}
      {badge ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-pill bg-brand-primary px-1 text-[9px] font-medium text-text-inverse">
          {badge}
        </span>
      ) : null}
    </>
  );

  const target = href || to;
  if (target) {
    if (isInternalPath(target)) {
      return (
        <Link to={target} aria-label={label} className={classes} {...rest}>
          {content}
        </Link>
      );
    }
    return (
      <a
        href={target}
        aria-label={label}
        className={classes}
        {...(isExternalUrl(target) ? externalLinkProps : {})}
        {...rest}
      >
        {content}
      </a>
    );
  }

  return (
    <button type={type} aria-label={label} className={classes} {...rest}>
      {content}
    </button>
  );
}

IconButton.propTypes = {
  /** Accessible name — required, rendered as aria-label. */
  label: PropTypes.string.isRequired,
  children: PropTypes.node,
  variant: PropTypes.oneOf(["plain", "outline", "inverse", "solid"]),
  size: PropTypes.oneOf(["sm", "md", "touch"]),
  /** Small count/metadata bubble (wishlist, cart, notifications). */
  badge: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  className: PropTypes.string,
  href: PropTypes.string,
  to: PropTypes.string,
  type: PropTypes.string,
};
