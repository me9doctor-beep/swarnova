import PropTypes from "prop-types";
import { cn } from "../../utils/cn.js";

/**
 * CONTAINER — the single page-width primitive.
 *
 * Owns maximum content width and horizontal padding so no page or section
 * declares its own `max-w-* px-* mx-auto` combination. `size` picks the
 * measure, never the padding: storefront pages use the default 1280px editorial
 * measure, consoles the wider 1536px work area, reading views the narrow one.
 */
const sizes = {
  default: "",
  narrow: "max-w-3xl",
  wide: "max-w-[1536px]",
  full: "max-w-none",
};

/** Centered max-width page container with the reference's side margins. */
export default function Container({
  as: Tag = "div",
  size = "default",
  className,
  children,
  ...rest
}) {
  return (
    <Tag className={cn("shell", sizes[size], className)} {...rest}>
      {children}
    </Tag>
  );
}

Container.propTypes = {
  as: PropTypes.elementType,
  size: PropTypes.oneOf(["default", "narrow", "wide", "full"]),
  className: PropTypes.string,
  children: PropTypes.node,
};
