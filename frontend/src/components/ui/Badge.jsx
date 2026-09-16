import PropTypes from "prop-types";
import { cn } from "../../utils/cn.js";

/**
 * BADGE — the single status/tag primitive.
 *
 * Callers describe meaning (`variant="success"`), never colour: the same
 * component later carries Active / Pending / Approved / Cancelled across
 * orders, products, inventory, campaigns, employees, customers and branches.
 */
const base =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm border px-2 py-0.5 font-sans text-label uppercase";

const variants = {
  neutral: "border-border-default bg-surface-secondary text-text-secondary",
  brand: "border-brand-accent/35 bg-surface-muted text-brand-accent-strong",
  success: "border-state-success/25 bg-state-success-soft text-state-success",
  warning: "border-state-warning/25 bg-state-warning-soft text-state-warning",
  error: "border-state-error/25 bg-state-error-soft text-state-error",
  info: "border-state-info/25 bg-state-info-soft text-state-info",
};

export default function Badge({ children, variant = "neutral", dot = false, className }) {
  return (
    <span className={cn(base, variants[variant], className)}>
      {dot ? <span className="h-1.5 w-1.5 rounded-pill bg-current" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

Badge.propTypes = {
  children: PropTypes.node,
  variant: PropTypes.oneOf(["neutral", "brand", "success", "warning", "error", "info"]),
  /** Small leading dot — for live/status indicators. */
  dot: PropTypes.bool,
  className: PropTypes.string,
};
