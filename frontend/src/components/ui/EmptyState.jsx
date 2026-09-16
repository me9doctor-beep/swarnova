import PropTypes from "prop-types";
import { cn } from "../../utils/cn.js";

/**
 * EMPTY STATE — the quiet "nothing here yet / nothing matched" panel.
 *
 * Used by console screens that are structurally live but have no data or
 * feature behind them yet, and by list screens with an empty result. It is a
 * presentation slot only: no data access, no business logic.
 */
export default function EmptyState({ title, children, action, className }) {
  return (
    <div
      className={cn(
        "border border-dashed border-border-default bg-surface-primary px-6 py-8",
        className
      )}
    >
      {title ? (
        <h2 className="font-sans text-label uppercase tracking-[0.24em] text-text-secondary">
          {title}
        </h2>
      ) : null}
      {children ? (
        <p className="mt-3 max-w-2xl font-sans text-body-sm text-text-muted">{children}</p>
      ) : null}
      {action ? <div className="mt-6 flex flex-wrap items-center gap-3">{action}</div> : null}
    </div>
  );
}

EmptyState.propTypes = {
  title: PropTypes.node,
  children: PropTypes.node,
  action: PropTypes.node,
  className: PropTypes.string,
};
