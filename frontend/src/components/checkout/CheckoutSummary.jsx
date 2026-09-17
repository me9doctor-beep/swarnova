import PropTypes from "prop-types";
import Price from "../ui/Price.jsx";
import AsyncBoundary from "../ui/AsyncBoundary.jsx";

/**
 * CHECKOUT SUMMARY (Phase 12)
 * -----------------------------------------------------------------------------
 * Renders the provider's validated quote — never a client-side calculation.
 * The lines arrive snapshotted at canonical prices, the totals arrive from
 * the ONE pricing calculation, and any blocking issue (stock, availability)
 * arrives as an issue the customer can act on. The checkout's numbers here,
 * on the order and in the order book are, by construction, the same numbers.
 */
export default function CheckoutSummary({ summary, status, error, retry }) {
  return (
    <AsyncBoundary
      status={status}
      error={error}
      onRetry={retry}
      className="min-h-[200px]"
    >
      {summary && (
        <div className="space-y-6">
          {/* Issues first — the customer should never discover them at the button */}
          {summary.issues.length > 0 && (
            <ul className="space-y-2" role="alert">
              {summary.issues.map((issue, index) => (
                <li
                  key={`${issue.code}-${issue.productId ?? index}`}
                  className="border border-state-warning/30 bg-state-warning-soft p-3.5 font-sans text-body-sm text-state-warning"
                >
                  {issue.message}
                </li>
              ))}
            </ul>
          )}

          {/* Lines */}
          <div className="divide-y divide-border-default">
            {summary.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                <div className="h-16 w-16 shrink-0 overflow-hidden border border-border-default bg-surface-secondary">
                  {item.image && (
                    <img
                      src={item.image.src ?? item.image}
                      alt={item.image.alt ?? item.name}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-serif text-h4 font-medium text-text-primary">
                    {item.name}
                  </p>
                  <p className="mt-0.5 font-sans text-caption text-text-muted">
                    {item.purity} Gold · Qty {item.quantity} · <Price amount={item.unitPrice} />
                  </p>
                </div>
                <Price amount={item.lineTotal} className="font-sans text-body font-medium" />
              </div>
            ))}
          </div>

          {/* Totals — the ONE calculation, displayed */}
          <div className="space-y-3.5 border-t border-border-default pt-5 font-sans text-body-sm">
            <div className="flex justify-between text-text-secondary">
              <span>Subtotal ({summary.count} {summary.count === 1 ? "piece" : "pieces"})</span>
              <Price amount={summary.totals.subtotal} />
            </div>

            <div className="flex justify-between text-text-secondary">
              <span>{summary.delivery?.label ?? "Insured Courier Delivery"}</span>
              {summary.totals.deliveryCharge === 0 ? (
                <span className="font-medium text-state-success">Complimentary</span>
              ) : (
                <Price amount={summary.totals.deliveryCharge} />
              )}
            </div>

            <div className="flex justify-between text-text-secondary">
              <span>{summary.totals.taxLabel ?? "GST (3% Indian Jewellery Tax)"}</span>
              <span className="text-text-muted">Included</span>
            </div>

            <div className="flex justify-between border-t border-border-default pt-4 font-serif text-h3 text-text-primary">
              <span>Grand Total</span>
              <Price amount={summary.totals.grandTotal} />
            </div>
          </div>

          {/* Fulfilment transparency — the branch the store chose, not the client */}
          {summary.fulfilment && (
            <p className="font-sans text-caption leading-relaxed text-text-muted">
              To be fulfilled with insured, secure packaging by{" "}
              {summary.fulfilment.branchName}
              {summary.delivery?.eta ? ` · arrives in ${summary.delivery.eta}` : ""}.
            </p>
          )}
        </div>
      )}
    </AsyncBoundary>
  );
}

CheckoutSummary.propTypes = {
  summary: PropTypes.object,
  status: PropTypes.oneOf(["loading", "success", "error"]).isRequired,
  error: PropTypes.object,
  retry: PropTypes.func,
};
