import PropTypes from "prop-types";
import { cn } from "../../utils/cn.js";

const tones = {
  gold: "eyebrow-light",
  wine: "eyebrow-on-wine",
  ink: "text-text-primary/70",
};

/** Small uppercase label with generous tracking and gold/champagne emphasis. */
export default function Eyebrow({ children, tone = "gold", className, as: Tag = "p" }) {
  return <Tag className={cn("eyebrow", tones[tone], className)}>{children}</Tag>;
}

Eyebrow.propTypes = {
  children: PropTypes.node,
  tone: PropTypes.oneOf(["gold", "wine", "ink"]),
  className: PropTypes.string,
  as: PropTypes.elementType,
};
