import { useParams, Link } from "react-router-dom";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import Button from "../../../components/ui/Button.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import Container from "../../../components/ui/Container.jsx";
import Eyebrow from "../../../components/ui/Eyebrow.jsx";
import Price from "../../../components/ui/Price.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import AsyncBoundary from "../../../components/ui/AsyncBoundary.jsx";
import { useOrder } from "../../../hooks/useOrder.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";

const STATUS_BADGE_VARIANTS = {
  Delivered: "success",
  Shipped: "info",
  Processing: "brand",
  Placed: "brand",
  Confirmed: "neutral",
  Cancelled: "error",
};

/**
 * ORDER CONFIRMATION (Phase 12)
 * -----------------------------------------------------------------------------
 * The quiet exhale after Place Order: what was bought, where it travels,
 * how it is paid and what happens next. The order is read through the
 * EXISTING customer order contract (`useOrder` → canonical book, ownership
 * re-resolved store-side), so confirmation and order detail can never
 * disagree — there is one order system, and this page borrows it.
 */
export default function OrderConfirmationPage() {
  const { id } = useParams();
  const { order, status, error, retry } = useOrder(id);

  useDocumentTitle(
    order ? `Order ${order.orderNumber} Confirmed — Swarnova` : "Order Confirmation — Swarnova"
  );

  if (status !== "success" && !order) {
    return (
      <AsyncBoundary status={status} error={error} onRetry={retry} className="min-h-[300px]" />
    );
  }

  if (!order) {
    return (
      <div className="bg-surface-secondary/30 pb-20 pt-[132px] sm:pb-28 sm:pt-[152px] lg:pt-[168px]">
        <Container>
          <EmptyState
            title="Order Not Found"
            action={
              <div className="flex flex-wrap gap-3">
                <Button href="/account/orders">View All Orders</Button>
                <Button href="/products" variant="outline">
                  Continue Shopping
                </Button>
              </div>
            }
            className="py-20 text-center"
          >
            We could not locate this order in your order book. It may belong to another client
            session — your orders live in your account.
          </EmptyState>
        </Container>
      </div>
    );
  }

  const dateStr = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const isPaid = order.paymentStatus === "paid";

  return (
    <div className="bg-surface-secondary/30 pb-20 pt-[132px] sm:pb-28 sm:pt-[152px] lg:pt-[168px]">
      <Container>
        {/* Masthead */}
        <div className="border-b border-border-default pb-8 text-center sm:text-left">
          <div className="flex items-center justify-center gap-2 sm:justify-start">
            <Eyebrow tone="gold" className="tracking-[0.3em]">
              SWARNOVA by MediXO
            </Eyebrow>
            <span className="text-border-default">·</span>
            <span className="font-sans text-label uppercase tracking-[0.2em] text-text-muted">
              Order Confirmation
            </span>
          </div>
          <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-4">
            <CheckCircle2 size={30} strokeWidth={1.4} className="text-state-success" aria-hidden="true" />
            <h1 className="font-serif text-h2 font-medium text-text-primary sm:text-h1">
              Thank you — your order is confirmed
            </h1>
          </div>
          <p className="mt-3 font-serif text-body text-text-secondary">
            Order <span className="font-medium text-text-primary">{order.orderNumber}</span> placed
            on {dateStr}. We are preparing your pieces with insured, secure packaging.
          </p>
        </div>

        <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_460px]">
          {/* What was bought */}
          <div className="space-y-8">
            <div className="border border-border-default bg-surface-primary">
              <h2 className="border-b border-border-default px-6 py-4 font-sans text-label uppercase tracking-[0.24em] text-text-secondary sm:px-8">
                Your Pieces ({order.items.length})
              </h2>
              <div className="divide-y divide-border-default px-6 sm:px-8">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 py-5">
                    <div className="h-20 w-20 shrink-0 overflow-hidden border border-border-default bg-surface-secondary">
                      {item.image && (
                        <img
                          src={item.image.src ?? item.image}
                          alt={item.image?.alt ?? item.name}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-serif text-h4 font-medium text-text-primary">{item.name}</p>
                      <p className="mt-0.5 font-sans text-caption text-text-muted">
                        SKU: {item.sku} · {item.purity} Hallmarked Gold
                      </p>
                      <p className="mt-0.5 font-sans text-caption text-text-secondary">
                        <Price amount={item.price} /> × {item.quantity}
                      </p>
                    </div>
                    <Price
                      amount={item.price * item.quantity}
                      className="font-sans text-body font-medium"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Where it travels */}
            <div className="border border-border-default bg-surface-primary p-6 sm:p-8">
              <h2 className="border-b border-border-default pb-4 font-sans text-label uppercase tracking-[0.24em] text-text-secondary">
                Delivery Details
              </h2>
              <div className="mt-5 space-y-1 font-sans text-body-sm text-text-secondary">
                <p className="font-serif text-h4 font-medium text-text-primary">
                  {order.shippingAddress?.name}
                </p>
                <p className="text-caption text-text-muted">{order.shippingAddress?.phone}</p>
                <p className="pt-2 text-text-primary">{order.shippingAddress?.line1}</p>
                {order.shippingAddress?.line2 && <p>{order.shippingAddress.line2}</p>}
                <p>
                  {order.shippingAddress?.city}, {order.shippingAddress?.state}{" "}
                  {order.shippingAddress?.postalCode}
                </p>
                <p className="text-text-muted">{order.shippingAddress?.country}</p>
              </div>
              <p className="mt-5 border-t border-border-default pt-4 font-sans text-caption text-text-muted">
                Travels by {order.courier ?? "insured courier"} with signature handover.
              </p>
            </div>
          </div>

          {/* Status, totals, next step */}
          <div className="space-y-8">
            <div className="border border-border-default bg-surface-primary p-6 sm:p-8">
              <h2 className="border-b border-border-default pb-4 font-sans text-label uppercase tracking-[0.24em] text-text-secondary">
                Order & Payment
              </h2>

              <dl className="mt-5 space-y-4 font-sans text-body-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-text-secondary">Order status</dt>
                  <dd>
                    <Badge variant={STATUS_BADGE_VARIANTS[order.status] ?? "neutral"} dot>
                      {order.status}
                    </Badge>
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-text-secondary">Payment</dt>
                  <dd className="flex items-center gap-2">
                    <Badge variant={isPaid ? "success" : "warning"} dot>
                      {isPaid ? "Paid" : "Pending"}
                    </Badge>
                  </dd>
                </div>
                {order.paymentMethod && (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-text-secondary">Paid with</dt>
                    <dd className="text-text-primary">{order.paymentMethod}</dd>
                  </div>
                )}
              </dl>

              <div className="mt-6 space-y-3.5 border-t border-border-default pt-5 font-sans text-body-sm">
                <div className="flex justify-between text-text-secondary">
                  <span>Subtotal</span>
                  <Price amount={order.subtotal} />
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Insured Courier Delivery</span>
                  {order.shipping === 0 ? (
                    <span className="font-medium text-state-success">Complimentary</span>
                  ) : (
                    <Price amount={order.shipping} />
                  )}
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>GST (3% Indian Jewellery Tax)</span>
                  <span className="text-text-muted">Included</span>
                </div>
                <div className="flex justify-between border-t border-border-default pt-4 font-serif text-h3 text-text-primary">
                  <span>Total</span>
                  <Price amount={order.total} />
                </div>
              </div>
            </div>

            <div className="border border-border-default bg-surface-primary p-6 sm:p-8">
              <h2 className="font-sans text-label uppercase tracking-[0.24em] text-text-secondary">
                What Happens Next
              </h2>
              <p className="mt-4 font-sans text-body-sm leading-relaxed text-text-secondary">
                Your order enters the atelier queue shortly. You can follow its journey —
                preparation, insured dispatch and delivery — at any moment from your account.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button to={`/account/orders/${order.id}`}>View Order</Button>
                <Button href="/products" variant="outline">
                  Continue Shopping
                </Button>
              </div>
              <Link
                to="/account/orders"
                className="mt-6 inline-flex items-center gap-2 font-sans text-caption uppercase tracking-[0.2em] text-text-secondary hover:text-brand-primary"
              >
                <ArrowLeft size={14} aria-hidden="true" /> All Orders
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
