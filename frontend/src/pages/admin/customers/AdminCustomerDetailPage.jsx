import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Mail, MapPin, Phone } from "lucide-react";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import AsyncBoundary from "../../../components/ui/AsyncBoundary.jsx";
import Table from "../../../components/ui/Table.jsx";
import { useAdminCustomer } from "../../../hooks/useAdminOperations.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { ORDER_STATUS_META } from "../../../features/admin/operations.js";
import { formatter } from "../../../components/ui/Price.jsx";
import { formatDateTime } from "../../../utils/format.js";

/**
 * CUSTOMER PROFILE (Phase 9) — one customer, read plainly: contact
 * details, membership, lifetime value and their full order history from
 * the canonical order book. Read-only by design in this phase.
 */
export default function AdminCustomerDetailPage() {
  const { id } = useParams();
  const { status, data: customer, error, retry } = useAdminCustomer(id);

  useDocumentTitle(`${customer?.name ?? "Customer"} — Swarnova Admin`);

  return (
    <>
      <p className="mb-4">
        <Link
          to="/admin/customers"
          className="inline-flex items-center gap-1.5 font-sans text-label uppercase tracking-[0.18em] text-text-secondary transition-colors duration-200 hover:text-brand-primary"
        >
          <ArrowLeft size={12} strokeWidth={1.5} aria-hidden="true" />
          All Customers
        </Link>
      </p>

      <AsyncBoundary
        status={status === "loading" ? "loading" : status === "error" ? "error" : "success"}
        error={error}
        onRetry={retry}
        errorMessage="This customer could not be loaded."
      >
        {!customer ? (
          <EmptyState title="Customer not found" className="mt-6">
            No customer matches this id. They may have been removed.
          </EmptyState>
        ) : (
          <>
            <PageHeader
              eyebrow={`${customer.id} · Customers`}
              title={customer.name}
              description={`${customer.tier} · member since ${customer.memberSince}`}
            />

            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* ----- Contact & relationship ------------------------------- */}
              <div className="space-y-6">
                <section
                  aria-label="Contact details"
                  className="border border-border-default bg-surface-primary p-panel"
                >
                  <h2 className="font-sans text-label uppercase tracking-[0.22em] text-text-secondary">
                    Contact
                  </h2>
                  <ul className="mt-4 space-y-3">
                    <li className="flex items-start gap-2.5 font-sans text-body-sm text-text-primary">
                      <Mail size={14} strokeWidth={1.5} aria-hidden="true" className="mt-1 shrink-0 text-brand-accent-strong" />
                      {customer.email}
                    </li>
                    <li className="flex items-start gap-2.5 font-sans text-body-sm text-text-primary">
                      <Phone size={14} strokeWidth={1.5} aria-hidden="true" className="mt-1 shrink-0 text-brand-accent-strong" />
                      {customer.phone}
                    </li>
                    <li className="flex items-start gap-2.5 font-sans text-body-sm text-text-primary">
                      <MapPin size={14} strokeWidth={1.5} aria-hidden="true" className="mt-1 shrink-0 text-brand-accent-strong" />
                      {customer.city}, {customer.state}
                    </li>
                  </ul>
                </section>

                <section
                  aria-label="Relationship summary"
                  className="border border-border-default bg-surface-primary p-panel"
                >
                  <h2 className="font-sans text-label uppercase tracking-[0.22em] text-text-secondary">
                    Relationship
                  </h2>
                  <dl className="mt-4 space-y-2.5">
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="font-sans text-caption text-text-muted">Tier</dt>
                      <dd>
                        <Badge
                          variant={customer.tier === "Swarnova Privé" ? "brand" : "neutral"}
                        >
                          {customer.tier}
                        </Badge>
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="font-sans text-caption text-text-muted">Member since</dt>
                      <dd className="font-sans text-caption text-text-primary">
                        {customer.memberSince}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="font-sans text-caption text-text-muted">Orders</dt>
                      <dd className="font-sans text-caption text-text-primary">
                        {customer.orderCount}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="font-sans text-caption text-text-muted">Lifetime value</dt>
                      <dd className="font-sans text-body-sm font-medium text-text-primary">
                        {formatter.format(customer.totalSpent)}
                      </dd>
                    </div>
                  </dl>
                </section>
              </div>

              {/* ----- Order history ----------------------------------------- */}
              <section aria-label="Order history" className="space-y-4 lg:col-span-2">
                <h2 className="font-sans text-label uppercase tracking-[0.24em] text-text-secondary">
                  Order History
                </h2>
                {(customer.orders ?? []).length === 0 ? (
                  <EmptyState title="No orders yet">
                    This customer has not placed an order yet.
                  </EmptyState>
                ) : (
                  <Table
                    caption={`Order history for ${customer.name}`}
                    hideCaption
                    headers={[
                      { label: "Order" },
                      { label: "Branch" },
                      { label: "Total", align: "right" },
                      { label: "Status" },
                      { label: "Placed" },
                    ]}
                  >
                    {(customer.orders ?? []).map((order) => {
                      const meta = ORDER_STATUS_META[order.status] ?? ORDER_STATUS_META.Placed;
                      return (
                        <Table.Row key={order.id}>
                          <Table.Cell>
                            <Link
                              to={`/admin/orders/${order.id}`}
                              className="font-sans text-body-sm font-medium text-text-primary transition-colors duration-200 hover:text-brand-primary"
                            >
                              {order.orderNumber}
                            </Link>
                            <span className="block font-sans text-caption text-text-muted">
                              {order.items.length}{" "}
                              {order.items.length === 1 ? "item" : "items"}
                            </span>
                          </Table.Cell>
                          <Table.Cell className="text-text-secondary">
                            {order.branchName ?? "—"}
                          </Table.Cell>
                          <Table.Cell align="right">
                            {formatter.format(order.total)}
                          </Table.Cell>
                          <Table.Cell>
                            <Badge variant={meta.variant} dot>
                              {meta.label}
                            </Badge>
                          </Table.Cell>
                          <Table.Cell className="text-caption text-text-muted">
                            {formatDateTime(order.createdAt)}
                          </Table.Cell>
                        </Table.Row>
                      );
                    })}
                  </Table>
                )}
              </section>
            </div>
          </>
        )}
      </AsyncBoundary>
    </>
  );
}
