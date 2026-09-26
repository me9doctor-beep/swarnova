import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { cn } from "../../utils/cn.js";
import { externalLinkProps, isExternalUrl, isInternalPath } from "../../utils/links.js";

/**
 * BUTTON — the single action primitive for the whole ecosystem.
 *
 * One component, semantic variants, no per-role copies:
 *   Customer storefront → `primary` (deep burgundy, refined rectangular CTA)
 *   Console (Admin / Super Admin / Employee) → `primary`, `secondary`,
 *   `outline`, `ghost`, `danger`, `success`
 *
 * `link` is the inline text action; `outlineInverse` is the outline treatment
 * for dark surfaces (wine sections, campaign imagery).
 */
const base =
  "inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-sm border font-sans font-medium uppercase tracking-[0.22em] transition-[color,background-color,border-color,opacity,transform] duration-[var(--motion-standard)] ease-[var(--ease-standard)] disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]";

const sizes = {
  sm: "px-6 py-2.5 text-[10px]",
  md: "px-8 py-3.5 text-[11px]",
};

/* Declared after `sizes` so a variant can override the size's padding. */
const variants = {
  primary:
    "border-brand-primary bg-brand-primary text-text-inverse hover:border-brand-primary-strong hover:bg-brand-primary-strong",
  secondary:
    "border-border-default bg-surface-secondary text-text-primary hover:border-brand-accent/45 hover:text-brand-primary",
  outline:
    "border-ink/45 bg-transparent text-ink hover:border-brand-primary hover:text-brand-primary",
  outlineInverse:
    "border-brand-accent-soft/60 bg-transparent text-brand-accent-soft hover:border-brand-accent-soft hover:bg-brand-accent-soft hover:text-brand-primary-strong",
  ghost:
    "border-transparent bg-transparent text-brand-primary hover:text-brand-accent-strong",
  link: "border-transparent bg-transparent px-0 py-0 text-brand-primary underline-offset-4 hover:text-brand-accent-strong hover:underline",
  danger:
    "border-state-error bg-state-error text-text-inverse hover:bg-state-error/85",
  success:
    "border-state-success bg-state-success text-text-inverse hover:bg-state-success/85",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  href,
  to,
  type = "button",
  ...rest
}) {
  const classes = cn(base, sizes[size], variants[variant], className);

  const target = href || to;
  if (target) {
    /* A root-relative path is this app's own route: the router navigates it.
       Everything else — an in-page anchor, mailto, another host — is handed to
       the browser. One rule, shared with every other link surface. */
    if (isInternalPath(target)) {
      return (
        <Link to={target} className={classes} {...rest}>
          {children}
        </Link>
      );
    }
    return (
      <a
        href={target}
        className={classes}
        {...(isExternalUrl(target) ? externalLinkProps : {})}
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
  variant: PropTypes.oneOf([
    "primary",
    "secondary",
    "outline",
    "outlineInverse",
    "ghost",
    "link",
    "danger",
    "success",
  ]),
  size: PropTypes.oneOf(["sm", "md"]),
  className: PropTypes.string,
  href: PropTypes.string,
  to: PropTypes.string,
  type: PropTypes.string,
};
