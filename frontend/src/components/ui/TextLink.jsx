import PropTypes from "prop-types";
import { ArrowRight } from "lucide-react";
import { cn } from "../../utils/cn.js";

/** Uppercase text link with a fine arrow — the quiet tertiary action. */
export default function TextLink({
  children,
  href = "#",
  tone = "wine",
  className,
  withArrow = true,
  ...rest
}) {
  return (
    <a
      href={href}
      className={cn(
        "group inline-flex items-center gap-2 border-b border-transparent font-sans text-[11px] font-medium uppercase tracking-[0.24em] transition-colors duration-200",
        tone === "wine" && "text-wine hover:text-gold-deep",
        tone === "gold" && "text-gold-deep hover:text-wine",
        tone === "light" && "text-champagne hover:text-cream",
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
    </a>
  );
}

TextLink.propTypes = {
  children: PropTypes.node,
  href: PropTypes.string,
  tone: PropTypes.oneOf(["wine", "gold", "light"]),
  className: PropTypes.string,
  withArrow: PropTypes.bool,
};
