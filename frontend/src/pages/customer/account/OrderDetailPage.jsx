import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Check, Package, Clock, Truck, ShieldCheck } from "lucide-react";
import Button from "../../../components/ui/Button.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import Price from "../../../components/ui/Price.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import AsyncBoundary from "../../../components/ui/AsyncBoundary.jsx";
import { useOrder } from "../../../hooks/useOrder.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { cn } from "../../../utils/cn.js";

const ORDER_STEPS = [
  { key: "Confirmed", label: "Order Confirmed", Icon: Check },
  { key: "Processing", label: "In Atelier Preparation", Icon: Clock },
  { key: "Shipped", label: "Dispatched with Insured Courier", Icon: Truck },
  { key: "Delivered", label: "Safely Delivered", Icon: ShieldCheck },
];

const STATUS_RANK = {
  Confirmed: 0,
  Processing: 1,
  Shipped: 2,
  Delivered: 3,
};

const STATUS_BADGE_VARIANTS = {
  Delivered: "success",
  Shipped: "info",
  Processing: "brand",
  Confirmed: "neutral",
  Cancelled: "error",
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const { order, status, error, retry } = useOrder(id);

  useDocumentTitle(order ? `Order ${order.orderNumber} — Swarnova` : "Order Detail — Swarnova");

  if (status !== "success" && !order) {
    return (
      <AsyncBoundary
        status={status}
        error={error}
        onRetry={retry}
        className="min-h-[300px]"
      />
    );
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <Link
          to="/account/orders"
          className="inline-flex items-center gap-2 font-sans text-caption uppercase tracking-[0.2em] text-text-secondary hover:text-brand-primary"
        >
          <ArrowLeft size={14} /> Back to Orders
        </Link>
        <EmptyState
          title="Order Not Found"
          action={<Button href="/account/orders">View All Orders</Button>}
          className="py-16 text-center"
        >
          We could not locate an order matching identifier &ldquo;{id}&rdquo;. It may belong to another client session or was archived.
        </EmptyState>
      </div>
    );
  }

  const currentRank = STATUS_RANK[order.status] ?? 0;
  const isCancelled = order.status === "Cancelled";
  const dateStr = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-8">
      {/* Back link */}
      <div>
        <Link
          to="/account/orders"
          className="inline-flex items-center gap-2 font-sans text-caption uppercase tracking-[0.2em] text-text-secondary hover:text-brand-primary transition-colors duration-200"
        >
          <ArrowLeft size={14} /> Back to Orders
        </Link>
      </div>

      {/* Header row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border-default pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-serif text-h2 font-medium text-text-primary">
              Order {order.orderNumber}
            </h2>
            <Badge variant={STATUS_BADGE_VARIANTS[order.status] ?? "neutral"} dot>
              {order.status}
            </Badge>
          </div>
          <p className="mt-1 font-serif text-body text-text-secondary">
            Placed on {dateStr}
          </p>
        </div>

        <div className="text-left sm:text-right">
          <p className="font-sans text-caption uppercase tracking-[0.2em] text-text-muted">
            Total Amount
          </p>
          <Price amount={order.total} className="mt-0.5 font-serif text-h3 font-medium" />
        </div>
      </div>

      {/* Static Order Journey */}
      {!isCancelled ? (
        <div className="border border-border-default bg-surface-primary p-6 sm:p-8">
          <h3 className="font-sans text-label uppercase tracking-[0.24em] text-text-secondary">
            Fulfillment Journey
          </h3>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
            {ORDER_STEPS.map((step, idx) => {
              const StepIcon = step.Icon;
              const isCompleted = idx < currentRank || (idx === currentRank && order.status === "Delivered");
              const isCurrent = idx === currentRank && order.status !== "Delivered";

              return (
                <div
                  key={step.key}
                  className={cn(
                    "relative flex flex-col border p-4 transition-colors duration-200",
                    isCurrent
                      ? "border-brand-primary bg-surface-muted/50"
                      : isCompleted
                        ? "border-brand-accent/50 bg-surface-primary"
                        : "border-border-default/60 bg-surface-secondary/30 opacity-60"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-pill text-[12px]",
                        isCompleted
                          ? "bg-brand-primary text-text-inverse"
                          : isCurrent
                            ? "bg-brand-accent text-text-inverse"
                            : "bg-surface-secondary text-text-muted border border-border-default"
                      )}
                    >
                      {isCompleted ? (
                        <Check size={14} strokeWidth={2.2} />
                      ) : (
                        <StepIcon size={13} strokeWidth={1.8} />
                      )}
                    </span>
                    <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-text-muted">
                      0{idx + 1}
                    </span>
                  </div>

                  <p
                    className={cn(
                      "mt-3 font-sans text-label uppercase tracking-[0.16em]",
                      isCurrent
                        ? "font-semibold text-brand-primary"
                        : isCompleted
                          ? "font-medium text-text-primary"
                          : "text-text-muted"
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="mt-1 font-sans text-[11px] text-text-muted">
                    {isCurrent
                      ? "Current milestone"
                      : isCompleted
                        ? "Completed"
                        : "Pending"}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="border border-state-error/30 bg-state-error-soft p-5 text-body text-state-error">
          <p className="font-medium uppercase tracking-[0.18em] text-label">
            Order Cancelled
          </p>
          <p className="mt-1 text-body-sm">
            This order has been cancelled. Any pre-authorized payment was returned to your original payment method.
          </p>
        </div>
      )}

      {/* Order Items */}
      <div className="border border-border-default bg-surface-primary p-6 sm:p-8">
        <h3 className="font-sans text-label uppercase tracking-[0.24em] text-text-secondary pb-4 border-b border-border-default">
          Acquired Jewellery Pieces ({order.items.length})
        </h3>

        <div className="mt-4 divide-y divide-border-default">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 shrink-0 overflow-hidden border border-border-default bg-surface-secondary">
                  <img
                    src={item.image?.src ?? item.image}
                    alt={item.image?.alt ?? item.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-serif text-h4 font-medium text-text-primary">
                    {item.href ? (
                      <Link to={item.href} className="hover:text-brand-primary">
                        {item.name}
                      </Link>
                    ) : (
                      item.name
                    )}
                  </h4>
                  <p className="mt-1 font-sans text-caption text-text-muted">
                    SKU: {item.sku} · {item.purity} Hallmarked Gold
                  </p>
                  <p className="font-sans text-caption text-text-secondary mt-0.5">
                    Unit Price: <Price amount={item.price} /> × {item.quantity}
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <p className="font-sans text-caption uppercase tracking-[0.18em] text-text-muted">
                  Line Total
                </p>
                <Price
                  amount={item.price * item.quantity}
                  className="mt-0.5 font-serif text-h4 font-medium"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Columns: Delivery & Summary */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Shipping & Delivery Address */}
        <div className="border border-border-default bg-surface-primary p-6 sm:p-8">
          <h3 className="font-sans text-label uppercase tracking-[0.24em] text-text-secondary pb-4 border-b border-border-default">
            Delivery Details
          </h3>

          <div className="mt-4 space-y-4 font-sans text-body-sm text-text-secondary">
            <div>
              <p className="text-caption uppercase tracking-[0.18em] text-text-muted">
                Recipient
              </p>
              <p className="font-serif text-h4 font-medium text-text-primary mt-1">
                {order.shippingAddress?.name}
              </p>
              <p className="text-caption text-text-muted">{order.shippingAddress?.phone}</p>
            </div>

            <div>
              <p className="text-caption uppercase tracking-[0.18em] text-text-muted">
                Shipping Address
              </p>
              <p className="mt-1 text-text-primary">{order.shippingAddress?.line1}</p>
              {order.shippingAddress?.line2 && <p>{order.shippingAddress.line2}</p>}
              <p>
                {order.shippingAddress?.city}, {order.shippingAddress?.state}{" "}
                {order.shippingAddress?.postalCode}
              </p>
              <p className="text-text-muted">{order.shippingAddress?.country}</p>
            </div>

            {order.trackingNumber && (
              <div className="border-t border-border-default pt-4">
                <p className="text-caption uppercase tracking-[0.18em] text-text-muted">
                  Consignment Courier
                </p>
                <p className="mt-1 text-text-primary font-medium">{order.courier}</p>
                <p className="text-caption text-brand-accent-strong">
                  Tracking ID: {order.trackingNumber}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Financial Breakdown */}
        <div className="border border-border-default bg-surface-primary p-6 sm:p-8">
          <h3 className="font-sans text-label uppercase tracking-[0.24em] text-text-secondary pb-4 border-b border-border-default">
            Payment & Summary
          </h3>

          <div className="mt-4 space-y-3 font-sans text-body-sm">
            <div className="flex justify-between text-text-secondary">
              <span>Item Subtotal</span>
              <Price amount={order.subtotal} />
            </div>

            <div className="flex justify-between text-text-secondary">
              <span>Insured Armoured Courier Delivery</span>
              <span className="font-medium text-state-success">Complimentary</span>
            </div>

            <div className="flex justify-between text-text-secondary">
              <span>Taxes (3% GST Included)</span>
              <span className="text-text-muted">Included</span>
            </div>

            <div className="flex justify-between border-t border-border-default pt-4 text-text-primary font-serif text-h3">
              <span>Total Paid</span>
              <Price amount={order.total} />
            </div>

            {order.paymentMethod && (
              <div className="border-t border-border-default pt-4 text-caption text-text-muted">
                <span>Payment Mode: </span>
                <span className="text-text-primary font-medium">{order.paymentMethod}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
