import PropTypes from "prop-types";
import Input from "../ui/Input.jsx";
import AsyncBoundary from "../ui/AsyncBoundary.jsx";
import CheckoutOption from "./CheckoutOption.jsx";
import { usePaymentMethods } from "../../hooks/usePaymentMethods.js";

/**
 * CHECKOUT PAYMENT PICKER (Phase 12)
 * -----------------------------------------------------------------------------
 * Renders the canonical payment surface from the provider. The UI never
 * names a gateway, never renders a card form and never holds a credential —
 * the only client-safe detail a method may ask for arrives on the method
 * itself (today, a UPI handle) and is handed to the provider inside the
 * checkout payload, where the processor settles it.
 */
export default function CheckoutPaymentPicker({
  selectedId,
  onSelect,
  paymentDetail,
  onPaymentDetailChange,
  detailError,
}) {
  const { paymentMethods, status, error, retry } = usePaymentMethods();

  if (status !== "success" && paymentMethods.length === 0) {
    return <AsyncBoundary status={status} error={error} onRetry={retry} className="min-h-[120px]" />;
  }

  const selected = paymentMethods.find((method) => method.id === selectedId);

  return (
    <div className="space-y-3">
      <div role="radiogroup" aria-label="Payment method" className="space-y-3">
        {paymentMethods.map((method) => (
          <CheckoutOption
            key={method.id}
            name="checkout-payment"
            value={method.id}
            checked={selectedId === method.id}
            onChange={() => onSelect(method.id)}
            title={method.label}
            description={method.description}
          />
        ))}
      </div>

      {selected?.detail && (
        <div className="border border-border-default bg-surface-secondary/40 p-5">
          <Input
            label={selected.detail.label}
            name={selected.detail.field}
            value={paymentDetail?.[selected.detail.field] ?? ""}
            onChange={(e) => onPaymentDetailChange(selected.detail.field, e.target.value)}
            placeholder={selected.detail.placeholder}
            error={detailError}
            autoComplete="off"
            required
          />
          <p className="mt-3 font-sans text-caption leading-relaxed text-text-muted">
            Demonstration environment — any valid UPI ID settles. One beginning with
            &ldquo;fail&rdquo; previews a declined payment.
          </p>
        </div>
      )}
    </div>
  );
}

CheckoutPaymentPicker.propTypes = {
  selectedId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  paymentDetail: PropTypes.object,
  onPaymentDetailChange: PropTypes.func.isRequired,
  detailError: PropTypes.node,
};
