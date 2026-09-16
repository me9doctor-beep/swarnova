import PropTypes from "prop-types";
import { cn } from "../../utils/cn.js";

/** Centered max-width page container with the reference's side margins. */
export default function Container({ as: Tag = "div", className, children, ...rest }) {
  return (
    <Tag className={cn("shell", className)} {...rest}>
      {children}
    </Tag>
  );
}

Container.propTypes = {
  as: PropTypes.elementType,
  className: PropTypes.string,
  children: PropTypes.node,
};
