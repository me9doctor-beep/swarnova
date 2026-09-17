import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { externalLinkProps, isExternalUrl, isInternalPath } from "../../utils/links.js";

/**
 * CONTENT LINK — the unstyled anchor that knows about the router.
 *
 * Canonical content (`site.navigation`, the footer columns, the branch and
 * journal cards) stores a plain `href`, so every surface that renders it needs
 * the same decision: navigate internally, or let the browser do what it does
 * natively. `src/utils/links.js` owns that rule; this component is the markup
 * half of it for links that carry no button or TextLink styling of their own.
 *
 * Presentation belongs to the caller (`className`), and behaviour belongs here.
 */
export default function ContentLink({ href, className, children, ...rest }) {
  if (isInternalPath(href)) {
    return (
      <Link to={href} className={className} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <a
      href={href}
      className={className}
      {...(isExternalUrl(href) ? externalLinkProps : {})}
      {...rest}
    >
      {children}
    </a>
  );
}

ContentLink.propTypes = {
  href: PropTypes.string.isRequired,
  className: PropTypes.string,
  children: PropTypes.node,
};
