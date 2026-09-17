import PropTypes from "prop-types";
import { ArrowRight } from "lucide-react";
import ContentLink from "./ContentLink.jsx";
import { cn } from "../../utils/cn.js";

/**
 * Uppercase text link with a fine arrow — the quiet tertiary action.
 *
 * Content supplies a plain `href`; ContentLink decides whether the router owns
 * it, so a card or CTA never has to know how it is being rendered.
 */
export default function TextLink({
  children,
  href = "#",
  tone = "wine",
  className,
  withArrow = true,
  ...rest
}) {
  return (
    <ContentLink
      href={href}
      className={cn(
        "group inline-flex items-center gap-2 border-b border-transparent font-sans text-[11px] font-medium uppercase tracking-[0.24em] transition-colors duration-200",
        tone === "wine" && "text-brand-primary hover:text-brand-accent-strong",
        tone === "gold" && "text-brand-accent-strong hover:text-brand-primary",
        tone === "light" && "text-brand-accent-soft hover:text-text-inverse",
        className
      )}
      {...rest}
    >
      {children}
      {withArrow && (
        <ArrowRight
          size={13}
          strokeWidth={1.6}
          className="transition-transform duration-200 group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      )}
    </ContentLink>
  );
}

TextLink.propTypes = {
  children: PropTypes.node,
  href: PropTypes.string,
  tone: PropTypes.oneOf(["wine", "gold", "light"]),
  className: PropTypes.string,
  withArrow: PropTypes.bool,
};
