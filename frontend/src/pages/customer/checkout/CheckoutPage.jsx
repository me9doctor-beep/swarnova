import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, PackageCheck, RotateCcw } from "lucide-react";
import Button from "../../../components/ui/Button.jsx";
import Container from "../../../components/ui/Container.jsx";
import Eyebrow from "../../../components/ui/Eyebrow.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import CheckoutPanel from "../../../components/checkout/CheckoutPanel.jsx";
import CheckoutAddressPicker from "../../../components/checkout/CheckoutAddressPicker.jsx";
import CheckoutDeliveryPicker from "../../../components/checkout/CheckoutDeliveryPicker.jsx";
import CheckoutPaymentPicker from "../../../components/checkout/CheckoutPaymentPicker.jsx";
import CheckoutSummary from "../../../components/checkout/CheckoutSummary.jsx";
import { useCart } from "../../../state/CartContext.jsx";
import { useCheckoutSession } from "../../../hooks/useCheckoutSession.js";
import { useCheckoutSummary } from "../../../hooks/useCheckoutSummary.js";
import { usePlaceOrder } from "../../../hooks/usePlaceOrder.js";
import {
  buildCheckoutPayload,
  isValidUpiId,
} from "../../../services/checkoutService.js";
import { translateCheckoutError } from "../../../features/checkout/checkoutErrors.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";

/**
 * CHECKOUT (Phase 12)
 * -----------------------------------------------------------------------------
 * The completed commerce step: bag → address → delivery → payment → order.
 * One page, five quiet sections, no wizard. Every commercial fact on this
 * page — the quote, the totals, the methods, the fulfilling boutique — is
 * the provider's; the page only composes selections into a domain payload
 * through `checkoutService` and places it through `usePlaceOrder`. The
 * provider, not this component, owns every business rule.
 *
 * Behind the route guard, the session is already the customer's; an empty
 * bag renders its own quiet state and never reaches payment.
 */
export default function CheckoutPage() {
  useDocumentTitle("Checkout — Swarnova");

  const navigate = useNavigate();
  const { items, clear } = useCart();
  const { checkoutId, selection, patch } = useCheckoutSession();
  const [paymentDetail, setPaymentDetail] = useState({ upiId: "" });
  const [sectionErrors, setSectionErrors] = useState({});

  const {
    summary,
    status: summaryStatus,
    error: summaryError,
    retry: retrySummary,
  } = useCheckoutSummary(items);

  const { placeOrder, isProcessing, error: orderError } = usePlaceOrder();

  const handleSelectAddress = useCallback(
    (addressId) => {
      patch({ addressId });
      setSectionErrors((previous) => ({ ...previous, address: undefined }));
    },
    [patch]
  );

  const handleSelectDelivery = useCallback(
    (deliveryMethod) => {
      patch({ deliveryMethod });
      setSectionErrors((previous) => ({ ...previous, delivery: undefined }));
    },
    [patch]
  );

  const handleSelectPayment = useCallback(
    (paymentMethod) => {
      patch({ paymentMethod });
      setSectionErrors((previous) => ({
        ...previous,
        payment: undefined,
        paymentDetail: undefined,
      }));
    },
    [patch]
  );

  const handlePaymentDetailChange = useCallback(
    (field, value) => {
      setPaymentDetail((previous) => ({ ...previous, [field]: value }));
      setSectionErrors((previous) => ({ ...previous, paymentDetail: undefined }));
    },
    []
  );

  /* Empty bag — a clear state and a way out; no order, no payment UI. */
  if (items.length === 0) {
    return (
      <div className="bg-surface-secondary/30 pb-20 pt-[132px] sm:pb-28 sm:pt-[152px] lg:pt-[168px]">
        <Container>
          <div className="border-b border-border-default pb-8">
            <div className="flex items-center gap-2">
              <Eyebrow tone="gold" className="tracking-[0.3em]">
                SWARNOVA by MediXO
              </Eyebrow>
              <span className="text-border-default">·</span>
              <span className="font-sans text-label uppercase tracking-[0.2em] text-text-muted">
                Secure Checkout
              </span>
            </div>
            <h1 className="mt-2 font-serif text-h2 font-medium text-text-primary sm:text-h1">
              Checkout
            </h1>
          </div>
          <div className="mt-12">
            <EmptyState
              title="Your bag is empty."
              action={<Button href="/products">Continue Shopping</Button>}
              className="py-20 text-center"
            >
              There is nothing to check out just yet. Discover jewellery crafted for your next
              moment, and your bag will be waiting.
            </EmptyState>
          </div>
        </Container>
      </div>
    );
  }

  const bagBlocked = summaryStatus === "success" && summary && !summary.ready;

  const handlePlaceOrder = async () => {
    if (isProcessing || bagBlocked) return;

    /* Early, inline validation — the provider re-enforces everything. */
    const errors = {};
    if (!selection.addressId) {
      errors.address = "Choose a delivery address to continue.";
    }
    if (!selection.deliveryMethod) {
      errors.delivery = "Choose a delivery method to continue.";
    }
    if (!selection.paymentMethod) {
      errors.payment = "Choose a payment method to continue.";
    } else if (selection.paymentMethod === "upi" && !isValidUpiId(paymentDetail.upiId)) {
      errors.paymentDetail = "Enter a valid UPI ID — for example, yourname@bank.";
    }
    setSectionErrors(errors);
    if (Object.keys(errors).length > 0) return;

    /* The domain payload — nothing but clean fields crosses the boundary. */
    const payload = buildCheckoutPayload({
      checkoutId,
      items,
      addressId: selection.addressId,
      deliveryMethod: selection.deliveryMethod,
      paymentMethod: selection.paymentMethod,
      paymentDetail,
    });

    const response = await placeOrder(payload);
    if (response?.order) {
      /* Only a truly created order clears the bag — nothing else is touched. */
      clear();
      navigate(`/order-confirmation/${response.order.id}`, { replace: true });
    }
    /* A rejection renders where the customer is — the bag stays intact. */
  };

  const orderFailure = orderError ? translateCheckoutError(orderError) : null;

  return (
    <div className="bg-surface-secondary/30 pb-20 pt-[132px] sm:pb-28 sm:pt-[152px] lg:pt-[168px]">
      <Container>
        {/* Masthead */}
        <div className="border-b border-border-default pb-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Eyebrow tone="gold" className="tracking-[0.3em]">
                  SWARNOVA by MediXO
                </Eyebrow>
                <span className="text-border-default">·</span>
                <span className="font-sans text-label uppercase tracking-[0.2em] text-text-muted">
                  Secure Checkout
                </span>
              </div>
              <h1 className="mt-2 font-serif text-h2 font-medium text-text-primary sm:text-h1">
                Checkout
              </h1>
            </div>
            <p className="font-sans text-label uppercase tracking-[0.2em] text-text-muted">
              {summary ? (
                <>
                  {summary.count} {summary.count === 1 ? "Piece" : "Pieces"} ·{" "}
                  Insured Delivery
                </>
              ) : (
                "Preparing your order"
              )}
            </p>
          </div>
        </div>

        <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_460px]">
          {/* 01 · 02 — where the order goes and how it travels */}
          <div className="space-y-8">
            <CheckoutPanel step="01" title="Delivery Address">
              <CheckoutAddressPicker
                selectedId={selection.addressId}
                onSelect={handleSelectAddress}
              />
              {sectionErrors.address && (
                <p role="alert" className="mt-4 font-sans text-caption text-state-error">
                  {sectionErrors.address}
                </p>
              )}
            </CheckoutPanel>

            <CheckoutPanel step="02" title="Delivery Method">
              <CheckoutDeliveryPicker
                selectedId={selection.deliveryMethod}
                onSelect={handleSelectDelivery}
              />
              {sectionErrors.delivery && (
                <p role="alert" className="mt-4 font-sans text-caption text-state-error">
                  {sectionErrors.delivery}
                </p>
              )}
            </CheckoutPanel>
          </div>

          {/* 03 · 04 · 05 — what it costs, how it is paid, the one action */}
          <div className="space-y-8">
            <CheckoutPanel step="03" title="Order Summary">
              <CheckoutSummary
                summary={summary}
                status={summaryStatus}
                error={summaryError}
                retry={retrySummary}
              />
            </CheckoutPanel>

            <CheckoutPanel step="04" title="Payment">
              <CheckoutPaymentPicker
                selectedId={selection.paymentMethod}
                onSelect={handleSelectPayment}
                paymentDetail={paymentDetail}
                onPaymentDetailChange={handlePaymentDetailChange}
                detailError={sectionErrors.paymentDetail}
              />
              {sectionErrors.payment && (
                <p role="alert" className="mt-4 font-sans text-caption text-state-error">
                  {sectionErrors.payment}
                </p>
              )}
            </CheckoutPanel>

            {orderFailure && (
              <div
                role="alert"
                className="border border-state-error/30 bg-state-error-soft p-5"
              >
                <p className="font-sans text-label uppercase tracking-[0.18em] text-state-error">
                  {orderFailure.title}
                </p>
                <p className="mt-1.5 font-sans text-body-sm leading-relaxed text-state-error">
                  {orderFailure.message}
                </p>
              </div>
            )}

            <div>
              <Button
                className="w-full justify-center"
                onClick={handlePlaceOrder}
                disabled={isProcessing || bagBlocked || summaryStatus !== "success"}
                aria-describedby="place-order-status"
              >
                {isProcessing ? "Placing Order…" : "Place Order"}
              </Button>
              <p id="place-order-status" role="status" aria-live="polite" className="sr-only">
                {isProcessing ? "Placing your order." : ""}
              </p>
              <p className="mt-3 text-center font-sans text-caption text-text-muted">
                By placing this order you agree to our conditions of sale. Nothing is charged
                until your payment is confirmed.
              </p>
            </div>

            {/* Trust — the house promises, carried from the bag */}
            <div className="space-y-3 border-t border-border-default pt-6 font-sans text-caption text-text-secondary">
              <div className="flex items-start gap-3">
                <ShieldCheck size={16} className="mt-0.5 shrink-0 text-brand-accent-strong" aria-hidden="true" />
                <span>BIS hallmarked 22K certified authenticity with lab certificate.</span>
              </div>
              <div className="flex items-start gap-3">
                <PackageCheck size={16} className="mt-0.5 shrink-0 text-brand-accent-strong" aria-hidden="true" />
                <span>Insured, secure packaging with signature handover across India.</span>
              </div>
              <div className="flex items-start gap-3">
                <RotateCcw size={16} className="mt-0.5 shrink-0 text-brand-accent-strong" aria-hidden="true" />
                <span>30-day effortless exchange and lifetime valuation guarantees.</span>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
