import PropTypes from "prop-types";
import { cn } from "../../utils/cn.js";

const backgrounds = {
  paper: "bg-surface-primary",
  ivory: "bg-surface-secondary",
  cream: "bg-surface-muted",
  wine: "bg-surface-inverse text-text-inverse/80",
};

/** Semantic section wrapper with the reference's generous vertical rhythm. */
export default function Section({
  id,
  as: Tag = "section",
  background = "paper",
  className,
  children,
  ariaLabel,
  ariaLabelledby,
}) {
  return (
    <Tag
      id={id}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
      className={cn(
        "scroll-mt-28 py-16 sm:py-20 lg:py-24",
        backgrounds[background],
        className
      )}
    >
      {children}
    </Tag>
  );
}

Section.propTypes = {
  id: PropTypes.string,
  as: PropTypes.elementType,
  background: PropTypes.oneOf(["paper", "ivory", "cream", "wine"]),
  className: PropTypes.string,
  children: PropTypes.node,
  ariaLabel: PropTypes.string,
  ariaLabelledby: PropTypes.string,
};
