import PropTypes from "prop-types";
import { cn } from "../../utils/cn.js";

/**
 * Reference CTA system — compact, rectangular, small uppercase type.
 * No pills, no gradients, no oversized type.
 */
const variants = {
  primary:
    "bg-wine text-cream border-wine hover:bg-wine-deep hover:border-wine-deep",
  outline:
    "bg-transparent text-ink border-ink/45 hover:border-wine hover:text-wine",
  outlineOnWine:
    "bg-transparent text-champagne border-champagne/60 hover:bg-champagne hover:text-wine-deep hover:border-champagne",
  ghost: "bg-transparent text-wine border border-transparent hover:text-gold-deep",
};

const sizes = {
  sm: "px-6 py-2.5 text-[10px]",
  md: "px-8 py-3.5 text-[11px]",
};

const base =
  "inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-[2px] border font-sans font-medium uppercase tracking-[0.22em] transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60";

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  href,
  type = "button",
  ...rest
}) {
  const classes = cn(base, variants[variant], sizes[size], className);

  if (href) {
    const external = /^https?:\/\//.test(href);
    return (
      <a
        href={href}
        className={classes}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        {...rest}
      >
        {children}
      </a>
    );
  }

  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  );
}

Button.propTypes = {
  children: PropTypes.node,
  variant: PropTypes.oneOf(["primary", "outline", "outlineOnWine", "ghost"]),
  size: PropTypes.oneOf(["sm", "md"]),
  className: PropTypes.string,
  href: PropTypes.string,
  type: PropTypes.string,
};
