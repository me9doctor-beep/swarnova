import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Mail, MapPin, Phone } from "lucide-react";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import Button from "../../../components/ui/Button.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import AsyncBoundary from "../../../components/ui/AsyncBoundary.jsx";
import Table from "../../../components/ui/Table.jsx";
import ConfirmDialog from "../../../components/super-admin/ConfirmDialog.jsx";
import {
  useEmployeeActor,
  useEmployeeOrder,
} from "../../../hooks/useEmployeeOperations.js";
import { useGovernanceMutation } from "../../../hooks/useGovernanceMutation.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { useCapability } from "../../../features/authentication/useCapability.js";
import { CAPABILITIES } from "../../../features/authentication/capabilities.js";
import { employeeOperationsService } from "../../../services/employeeOperationsService.js";
import { ORDER_ACTIONS, ORDER_STATUS_META } from "../../../features/admin/operations.js";
import { formatter } from "../../../components/ui/Price.jsx";
import { formatDateTime } from "../../../utils/format.js";

/**
 * BRANCH ORDER DETAIL (Phase 10)
 * -----------------------------------------------------------------------------
 * One order, end to end: the customer and where it goes, the pieces, the
 * payment summary and the operational steps this boutique can take. Which
 * steps exist is decided by the provider (`order.actions`, computed from the
 * lifecycle table) — the screen only offers them, and only to an account with
 * order-management capability. Everything else stays read-only.
 */
export default function EmployeeOrderDetailPage() {
  const { id } = useParams();
  const actor = useEmployeeActor();
  const { can: canDo } = useCapability();
  const { status, data: order, error, retry } = useEmployeeOrder(id);
  const mutation = useGovernanceMutation();
  const [pending, setPending] = useState(null); // the target status awaiting confirmation

  useDocumentTitle(`${order?.orderNumber ?? "Order"} — Swarnova Employee`);

  const canManage = canDo(CAPABILITIES.ORDERS_MANAGE);

  const changeStatus = async (target) => {
    try {
      await mutation.run(
        employeeOperationsService.updateOrderStatus,
        actor,
        order.id,
        target
      );
      setPending(null);
      retry();
    } catch {
      /* Dialog stays open with the provider's message. */
    }
  };

  const pendingConfig = pending ? ORDER_ACTIONS[pending] : null;

  return (
    <>
      <p className="mb-4">
        <Link
          to="/employee/orders"
          className="inline-flex items-center gap-1.5 font-sans text-label uppercase tracking-[0.18em] text-text-secondary transition-colors duration-200 hover:text-brand-primary"
        >
          <ArrowLeft size={12} strokeWidth={1.5} aria-hidden="true" />
          All Orders
        </Link>
      </p>

      <AsyncBoundary
        status={status === "loading" ? "loading" : status === "error" ? "error" : "success"}
        error={error}
        onRetry={retry}
        errorMessage="This order could not be loaded."
      >
        {!order ? (
          <EmptyState title="Order not found" className="mt-6">
            No order at this boutique matches that reference.
          </EmptyState>
        ) : (
          <>
            {(() => {
              const meta = ORDER_STATUS_META[order.status] ?? ORDER_STATUS_META.Placed;
              return (
                <PageHeader
                  eyebrow={`${order.orderNumber} · Orders`}
                  title={order.customerName}
                  description={meta.description}
                  actions={
                    <Badge variant={meta.variant} dot>
                      {meta.label}
                    </Badge>
                  }
                />
              );
            })()}

            {/* ----- Operational steps ------------------------------------- */}
            {canManage && (order.actions ?? []).length > 0 ? (
              <div className="mt-6 flex flex-wrap items-center gap-2" aria-label="Order actions">
                {(order.actions ?? []).map((target) => {
                  const config = ORDER_ACTIONS[target];
                  if (!config) return null;
                  return (
                    <Button
                      key={target}
                      variant={
                        config.variant === "danger"
                          ? "danger"
                          : config.variant === "success"
                            ? "success"
                            : "outline"
                      }
                      size="sm"
                      disabled={mutation.busy}
                      onClick={() => setPending(target)}
                    >
                      {config.label}
                    </Button>
                  );
                })}
              </div>
            ) : null}

            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* ----- Items + payment ------------------------------------- */}
              <div className="space-y-6 lg:col-span-2">
                <section aria-label="Order items" className="space-y-4">
                  <h2 className="font-sans text-label uppercase tracking-[0.24em] text-text-secondary">
                    Pieces
                  </h2>
                  <Table
                    caption={`Items in ${order.orderNumber}`}
                    hideCaption
                    headers={[
                      { label: "Piece" },
                      { label: "Purity" },
                      { label: "Qty", align: "center" },
                      { label: "Price", align: "right" },
                    ]}
                  >
                    {order.items.map((item) => (
                      <Table.Row key={`${item.id}-${item.sku}`}>
                        <Table.Cell>
                          <span className="flex items-center gap-3">
                            {item.image?.src ? (
                              <img
                                src={item.image.src}
                                alt=""
                                loading="lazy"
                                className="h-11 w-11 shrink-0 border border-border-subtle object-cover"
                              />
                            ) : null}
                            <span>
                              <span className="block font-sans text-body-sm font-medium text-text-primary">
                                {item.name}
                              </span>
                              <span className="block font-sans text-caption text-text-muted">
                                {item.sku}
                              </span>
                            </span>
                          </span>
                        </Table.Cell>
                        <Table.Cell className="text-text-secondary">{item.purity}</Table.Cell>
                        <Table.Cell align="center">{item.quantity}</Table.Cell>
                        <Table.Cell align="right">
                          {formatter.format(item.price * item.quantity)}
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table>
                </section>

                <section
                  aria-label="Payment summary"
                  className="border border-border-default bg-surface-primary p-panel"
                >
                  <h2 className="font-sans text-label uppercase tracking-[0.22em] text-text-secondary">
                    Payment Summary
                  </h2>
                  <dl className="mt-4 space-y-2.5">
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="font-sans text-body-sm text-text-secondary">Subtotal</dt>
                      <dd className="font-sans text-body-sm text-text-primary">
                        {formatter.format(order.subtotal)}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="font-sans text-body-sm text-text-secondary">Shipping</dt>
                      <dd className="font-sans text-body-sm text-text-primary">
                        {order.shipping > 0 ? formatter.format(order.shipping) : "Free"}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4 border-t border-border-subtle pt-2.5">
                      <dt className="font-sans text-body-sm font-medium text-text-primary">Total</dt>
                      <dd className="font-sans text-price font-medium text-text-primary">
                        {formatter.format(order.total)}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="font-sans text-caption text-text-muted">Method</dt>
                      <dd className="font-sans text-caption text-text-primary">
                        {order.paymentMethod ?? "—"}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="font-sans text-caption text-text-muted">Payment</dt>
                      <dd>
                        <Badge variant={order.paymentStatus === "paid" ? "success" : "warning"}>
                          {order.paymentStatus === "paid" ? "Paid" : "Refunded"}
                        </Badge>
                      </dd>
                    </div>
                  </dl>
                </section>
              </div>

              {/* ----- Customer, delivery, fulfilment ---------------------- */}
              <div className="space-y-6">
                <section
                  aria-label="Customer and delivery"
                  className="border border-border-default bg-surface-primary p-panel"
                >
                  <h2 className="font-sans text-label uppercase tracking-[0.22em] text-text-secondary">
                    Customer &amp; Delivery
                  </h2>
                  <ul className="mt-4 space-y-3">
                    <li className="font-sans text-body-sm text-text-primary">
                      {order.shippingAddress?.name ?? order.customerName}
                    </li>
                    <li className="flex items-start gap-2.5 font-sans text-body-sm text-text-secondary">
                      <Phone
                        size={14}
                        strokeWidth={1.5}
                        aria-hidden="true"
                        className="mt-1 shrink-0 text-brand-accent-strong"
                      />
                      {order.shippingAddress?.phone ?? "—"}
                    </li>
                    <li className="flex items-start gap-2.5 font-sans text-body-sm text-text-secondary">
                      <MapPin
                        size={14}
                        strokeWidth={1.5}
                        aria-hidden="true"
                        className="mt-1 shrink-0 text-brand-accent-strong"
                      />
                      {order.shippingAddress
                        ? `${order.shippingAddress.line1}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}`
                        : "—"}
                    </li>
                  </ul>
                  <Link
                    to={`/employee/customers/${order.customerId}`}
                    className="mt-5 inline-flex items-center gap-1.5 font-sans text-label uppercase tracking-[0.18em] text-brand-primary transition-colors duration-200 hover:text-brand-accent-strong"
                  >
                    <Mail size={12} strokeWidth={1.5} aria-hidden="true" />
                    Customer record
                  </Link>
                </section>

                <section
                  aria-label="Fulfilment"
                  className="border border-border-default bg-surface-primary p-panel"
                >
                  <h2 className="font-sans text-label uppercase tracking-[0.22em] text-text-secondary">
                    Fulfilment
                  </h2>
                  <dl className="mt-4 space-y-2.5">
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="font-sans text-caption text-text-muted">Boutique</dt>
                      <dd className="font-sans text-caption text-text-primary">
                        {order.branchName ?? "—"}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="font-sans text-caption text-text-muted">Placed</dt>
                      <dd className="font-sans text-caption text-text-primary">
                        {formatDateTime(order.createdAt)}
                      </dd>
                    </div>
                    {order.estimatedDelivery ? (
                      <div className="flex items-baseline justify-between gap-4">
                        <dt className="font-sans text-caption text-text-muted">Expected</dt>
                        <dd className="font-sans text-caption text-text-primary">
                          {formatDateTime(order.estimatedDelivery)}
                        </dd>
                      </div>
                    ) : null}
                    {order.deliveredAt ? (
                      <div className="flex items-baseline justify-between gap-4">
                        <dt className="font-sans text-caption text-text-muted">Delivered</dt>
                        <dd className="font-sans text-caption text-text-primary">
                          {formatDateTime(order.deliveredAt)}
                        </dd>
                      </div>
                    ) : null}
                    {order.cancelledAt ? (
                      <div className="flex items-baseline justify-between gap-4">
                        <dt className="font-sans text-caption text-text-muted">Cancelled</dt>
                        <dd className="font-sans text-caption text-text-primary">
                          {formatDateTime(order.cancelledAt)}
                        </dd>
                      </div>
                    ) : null}
                    {order.courier ? (
                      <div className="flex items-baseline justify-between gap-4">
                        <dt className="font-sans text-caption text-text-muted">Courier</dt>
                        <dd className="font-sans text-caption text-text-primary">{order.courier}</dd>
                      </div>
                    ) : null}
                  </dl>
                </section>
              </div>
            </div>

            {pendingConfig ? (
              <ConfirmDialog
                open
                onClose={() => setPending(null)}
                onConfirm={() => changeStatus(pending)}
                title={pendingConfig.confirmTitle}
                body={pendingConfig.confirmBody}
                confirmLabel={pendingConfig.confirmLabel}
                confirmVariant={pendingConfig.variant}
                busy={mutation.busy}
                error={mutation.error}
              />
            ) : null}
          </>
        )}
      </AsyncBoundary>
    </>
  );
}
