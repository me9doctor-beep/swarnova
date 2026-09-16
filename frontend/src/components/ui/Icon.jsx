import PropTypes from "prop-types";
import {
  BadgeCheck,
  Hammer,
  ShieldCheck,
  Package,
  Gem,
  HeartHandshake,
} from "lucide-react";

/**
 * Line-icon registry — data references icons by string key so the CMS
 * never needs to know about the icon library.
 */
const registry = {
  badgeCheck: BadgeCheck,
  hammer: Hammer,
  shieldCheck: ShieldCheck,
  package: Package,
  gem: Gem,
  heartHandshake: HeartHandshake,
};

export default function Icon({ name, size = 26, strokeWidth = 1.3, className, ...rest }) {
  const Glyph = registry[name] ?? Gem;
  return <Glyph size={size} strokeWidth={strokeWidth} className={className} aria-hidden="true" {...rest} />;
}

Icon.propTypes = {
  name: PropTypes.oneOf(Object.keys(registry)).isRequired,
  size: PropTypes.number,
  strokeWidth: PropTypes.number,
  className: PropTypes.string,
};
