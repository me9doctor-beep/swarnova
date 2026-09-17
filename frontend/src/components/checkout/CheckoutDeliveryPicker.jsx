import { useEffect } from "react";
import PropTypes from "prop-types";
import Price from "../ui/Price.jsx";
import AsyncBoundary from "../ui/AsyncBoundary.jsx";
import CheckoutOption from "./CheckoutOption.jsx";
import { useDeliveryMethods } from "../../hooks/useDeliveryMethods.js";

/**
 * CHECKOUT DELIVERY PICKER (Phase 12)
 * -----------------------------------------------------------------------------
 * Renders the canonical delivery surface from the provider — nothing
 * delivery-shaped is invented in the UI. The selected method id travels
 * with the checkout request; its charge enters the ONE totals calculation
 * behind the summary.
 */
export default function CheckoutDeliveryPicker({ selectedId, onSelect }) {
  const { deliveryMethods, status, error, retry } = useDeliveryMethods();

  /* The available methods are the provider's; when exactly one exists the
     checkout arrives with it ready — no customer decision to fake. As with
     the address picker, only the empty seat is filled. */
  useEffect(() => {
    if (status !== "success" || deliveryMethods.length === 0) return;
    if (selectedId) return;
    onSelect(deliveryMethods[0].id);
  }, [status, deliveryMethods, selectedId, onSelect]);

  if (status !== "success" && deliveryMethods.length === 0) {
    return <AsyncBoundary status={status} error={error} onRetry={retry} className="min-h-[120px]" />;
  }

  return (
    <div role="radiogroup" aria-label="Delivery method" className="space-y-3">
      {deliveryMethods.map((method) => (
        <CheckoutOption
          key={method.id}
          name="checkout-delivery"
          value={method.id}
          checked={selectedId === method.id}
          onChange={() => onSelect(method.id)}
          title={method.label}
          description={method.description}
          meta={`Arrives in ${method.eta} · ${method.courier}`}
          trailing={
            method.charge === 0 ? (
              <span className="font-sans text-body-sm font-medium text-state-success">
                Complimentary
              </span>
            ) : (
              <Price amount={method.charge} className="font-sans text-body-sm font-medium" />
            )
          }
        />
      ))}
    </div>
  );
}

CheckoutDeliveryPicker.propTypes = {
  selectedId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
};
