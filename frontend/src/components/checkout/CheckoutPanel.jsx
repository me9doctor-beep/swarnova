import { useId } from "react";
import PropTypes from "prop-types";
import { cn } from "../../utils/cn.js";

/**
 * CHECKOUT PANEL — the single section shell of the checkout page (Phase 12).
 * A quiet editorial frame: numbered eyebrow, label heading, one content
 * slot. No cards inside cards, no decoration — the SWARNOVA console panel
 * language, carried onto the storefront.
 */
export default function CheckoutPanel({ step, title, children, className }) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className={cn("border border-border-default bg-surface-primary", className)}>
      <header className="flex items-baseline gap-3 border-b border-border-default px-6 py-4 sm:px-8">
        {step && (
          <span className="font-sans text-label uppercase tracking-[0.24em] text-brand-accent-strong">
            {step}
          </span>
        )}
        <h2
          id={headingId}
          className="font-sans text-label uppercase tracking-[0.24em] text-text-secondary"
        >
          {title}
        </h2>
      </header>
      <div className="px-6 py-6 sm:px-8 sm:py-8">{children}</div>
    </section>
  );
}

CheckoutPanel.propTypes = {
  step: PropTypes.string,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};
