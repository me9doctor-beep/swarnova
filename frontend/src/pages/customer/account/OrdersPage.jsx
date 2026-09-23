import { Link } from "react-router-dom";
import { Package, ArrowRight } from "lucide-react";
import Button from "../../../components/ui/Button.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import Price from "../../../components/ui/Price.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import AsyncBoundary from "../../../components/ui/AsyncBoundary.jsx";
import { useOrders } from "../../../hooks/useOrders.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { orderStatusMeta } from "../../../features/orders/orderLifecycle.js";

export default function OrdersPage() {
  useDocumentTitle("Order History — Swarnova");

  const { orders, status, error, retry } = useOrders();

  if (status !== "success" && orders.length === 0) {
    return (
      <AsyncBoundary
        status={status}
        error={error}
        onRetry={retry}
        className="min-h-[280px]"
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between border-b border-border-default pb-5">
        <div>
          <h2 className="font-serif text-h2 font-medium text-text-primary">Order History</h2>
          <p className="mt-1 font-serif text-body text-text-secondary">
            Review past purchases, current atelier commissions, and tracked deliveries.
          </p>
        </div>
        {orders.length > 0 && (
          <p className="font-sans text-label uppercase tracking-[0.2em] text-text-muted">
            {orders.length} {orders.length === 1 ? "Order" : "Orders"} Placed
          </p>
        )}
      </div>

      {orders.length === 0 ? (
        <EmptyState
          title="No Orders Placed Yet"
          action={<Button href="/products">Explore Catalogue</Button>}
          className="py-16 text-center"
        >
          When you acquire jewellery from the Swarnova house, your order tracking,
          consignment milestones, and authenticity certificates will appear here.
        </EmptyState>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const dateStr = new Date(order.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            });

            return (
              <div
                key={order.id}
                className="border border-border-default bg-surface-primary p-6 transition-colors duration-200 hover:border-brand-accent/50"
              >
                {/* Order Top Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-default pb-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-serif text-h4 font-medium text-text-primary">
                      {order.orderNumber}
                    </span>
                    <span className="text-border-default">·</span>
                    <span className="font-sans text-caption text-text-secondary">
                      Placed on {dateStr}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <Badge variant={orderStatusMeta(order.status).variant} dot>
                      {orderStatusMeta(order.status).label}
                    </Badge>
                    <Price amount={order.total} className="font-serif text-h4 font-medium" />
                  </div>
                </div>

                {/* Items preview list */}
                <div className="mt-6 space-y-4">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 shrink-0 overflow-hidden border border-border-default bg-surface-secondary">
                          <img
                            src={item.image?.src ?? item.image}
                            alt={item.image?.alt ?? item.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-serif text-body text-text-primary">
                            {item.name}
                          </p>
                          <p className="font-sans text-caption text-text-muted">
                            SKU: {item.sku} · {item.purity} Gold · Quantity: {item.quantity}
                          </p>
                        </div>
                      </div>

                      <Price amount={item.price * item.quantity} className="font-sans text-body-sm font-medium" />
                    </div>
                  ))}
                </div>

                {/* Order Footer */}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border-default pt-4">
                  <div className="font-sans text-caption text-text-secondary">
                    {order.trackingNumber ? (
                      <span>
                        Courier: <strong className="font-medium text-text-primary">{order.courier}</strong> (Tracking #{order.trackingNumber})
                      </span>
                    ) : (
                      <span>
                        Fulfillment: <strong className="font-medium text-text-primary">{order.shippingAddress?.city}, {order.shippingAddress?.state}</strong>
                      </span>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    href={`/account/orders/${order.id}`}
                  >
                    View Order Details
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
