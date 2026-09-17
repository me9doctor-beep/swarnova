import PropTypes from "prop-types";
import Dialog from "../ui/Dialog.jsx";
import Badge from "../ui/Badge.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import AsyncBoundary from "../ui/AsyncBoundary.jsx";
import { MOVEMENT_TYPE_META } from "../../features/admin/operations.js";
import { formatDateTime } from "../../utils/format.js";

/**
 * STOCK MOVEMENTS DIALOG — the history behind one stock line: receipts,
 * sales, adjustments and transfers, newest first, each with the actor who
 * moved the stock and the note they wrote.
 *
 * Presentational: the caller fetches through its own scoped hook (the Admin
 * console and a branch both read the same canonical movement log, but each
 * through the contract that enforces who may see which lines) and passes the
 * async result in.
 */
export default function StockMovementsDialog({
  row,
  status,
  movements,
  error,
  onRetry,
  onClose,
}) {
  return (
    <Dialog
      open
      onClose={onClose}
      title="Stock Movement History"
      description={`${row.productName} · ${row.branchName}`}
      width="lg"
    >
      <AsyncBoundary
        status={status === "loading" ? "loading" : status === "error" ? "error" : "success"}
        error={error}
        onRetry={onRetry}
        errorMessage="Movements could not be loaded."
        className="py-8"
      >
        {!movements || movements.length === 0 ? (
          <EmptyState title="No movements recorded">
            Adjustments, receipts and sales for this line will appear here.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-border-subtle border border-border-default">
            {movements.map((movement) => {
              const meta = MOVEMENT_TYPE_META[movement.type] ?? MOVEMENT_TYPE_META.adjustment;
              return (
                <li key={movement.id} className="px-5 py-3.5">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                    <span className="font-sans text-body-sm font-medium text-text-primary">
                      {movement.delta > 0 ? "+" : ""}
                      {movement.delta} {Math.abs(movement.delta) === 1 ? "piece" : "pieces"}
                    </span>
                    <span className="font-sans text-caption text-text-muted">
                      {formatDateTime(movement.at)}
                    </span>
                  </div>
                  <p className="mt-1.5 font-sans text-caption text-text-secondary">
                    {movement.by}
                    {movement.note ? ` — ${movement.note}` : ""}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </AsyncBoundary>
    </Dialog>
  );
}

StockMovementsDialog.propTypes = {
  /** The stock row whose history is shown (uses productName, branchName). */
  row: PropTypes.shape({
    productName: PropTypes.string,
    branchName: PropTypes.string,
  }).isRequired,
  status: PropTypes.oneOf(["loading", "success", "error"]).isRequired,
  movements: PropTypes.arrayOf(PropTypes.object),
  error: PropTypes.instanceOf(Error),
  onRetry: PropTypes.func,
  onClose: PropTypes.func.isRequired,
};
