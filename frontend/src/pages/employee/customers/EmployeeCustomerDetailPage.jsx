import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Mail, MapPin, Phone } from "lucide-react";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import AsyncBoundary from "../../../components/ui/AsyncBoundary.jsx";
import Table from "../../../components/ui/Table.jsx";
import { useEmployeeCustomer } from "../../../hooks/useEmployeeOperations.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { orderStatusMeta } from "../../../features/admin/operations.js";
import { formatter } from "../../../components/ui/Price.jsx";
import { formatDateTime } from "../../../utils/format.js";

/**
 * BRANCH CUSTOMER RECORD (Phase 10)
 * -----------------------------------------------------------------------------
 * One guest, as the counter needs them: how to reach them, their membership,
 * and the orders THIS boutique has fulfilled — with the next step on any that
 * are still open. Read-only by design: the branch serves customers, head
 * office and the platform keep the directory itself.
 */
export default function EmployeeCustomerDetailPage() {
  const { id } = useParams();
  const { status, data: customer, error, retry } = useEmployeeCustomer(id);

  useDocumentTitle(
    `${customer?.name ?? "Customer"} — Swarnova Employee`
  );

  return (
    <>
      <p className="mb-4">
        <Link
          to="/employee/customers"
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
            No customer at this boutique matches that reference.
          </EmptyState>
        ) : (
          <>
            <PageHeader
              eyebrow={`${customer.id} · Customers`}
              title={customer.name}
              description={`${customer.tier} · member since ${customer.memberSince}`}
            />

            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
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
                      <Phone
                        size={14}
                        strokeWidth={1.5}
                        aria-hidden="true"
                        className="mt-1 shrink-0 text-brand-accent-strong"
                      />
                      {customer.phone}
                    </li>
                    <li className="flex items-start gap-2.5 font-sans text-body-sm text-text-primary">
                      <Mail
                        size={14}
                        strokeWidth={1.5}
                        aria-hidden="true"
                        className="mt-1 shrink-0 text-brand-accent-strong"
                      />
                      {customer.email}
                    </li>
                    <li className="flex items-start gap-2.5 font-sans text-body-sm text-text-primary">
                      <MapPin
                        size={14}
                        strokeWidth={1.5}
                        aria-hidden="true"
                        className="mt-1 shrink-0 text-brand-accent-strong"
                      />
                      {customer.city}, {customer.state}
                    </li>
                  </ul>
                </section>

                <section
                  aria-label="Relationship at this branch"
                  className="border border-border-default bg-surface-primary p-panel"
                >
                  <h2 className="font-sans text-label uppercase tracking-[0.22em] text-text-secondary">
                    With This Boutique
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
                      <dt className="font-sans text-caption text-text-muted">Orders here</dt>
                      <dd className="font-sans text-caption text-text-primary">
                        {customer.orderCount}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="font-sans text-caption text-text-muted">Value here</dt>
                      <dd className="font-sans text-body-sm font-medium text-text-primary">
                        {formatter.format(customer.totalSpent)}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="font-sans text-caption text-text-muted">Last order</dt>
                      <dd className="font-sans text-caption text-text-primary">
                        {customer.lastOrderAt ? formatDateTime(customer.lastOrderAt) : "—"}
                      </dd>
                    </div>
                  </dl>
                </section>
              </div>

              <section aria-label="Order history at this branch" className="space-y-4 lg:col-span-2">
                <h2 className="font-sans text-label uppercase tracking-[0.24em] text-text-secondary">
                  Order History Here
                </h2>
                {(customer.orders ?? []).length === 0 ? (
                  <EmptyState title="No orders at this boutique">
                    This customer has not bought from this branch yet.
                  </EmptyState>
                ) : (
                  <Table
                    caption={`Orders fulfilled for ${customer.name} at this boutique`}
                    hideCaption
                    headers={[
                      { label: "Order" },
                      { label: "Total", align: "right" },
                      { label: "Status" },
                      { label: "Placed" },
                      { label: "", align: "right" },
                    ]}
                  >
                    {(customer.orders ?? []).map((order) => {
                      const meta = orderStatusMeta(order.status);
                      return (
                        <Table.Row key={order.id}>
                          <Table.Cell>
                            <Link
                              to={`/employee/orders/${order.id}`}
                              className="font-sans text-body-sm font-medium text-text-primary transition-colors duration-200 hover:text-brand-primary"
                            >
                              {order.orderNumber}
                            </Link>
                            <span className="block font-sans text-caption text-text-muted">
                              {order.items.length} {order.items.length === 1 ? "item" : "items"}
                            </span>
                          </Table.Cell>
                          <Table.Cell align="right">{formatter.format(order.total)}</Table.Cell>
                          <Table.Cell>
                            <Badge variant={meta.variant} dot>
                              {meta.label}
                            </Badge>
                          </Table.Cell>
                          <Table.Cell className="text-caption text-text-muted">
                            {formatDateTime(order.createdAt)}
                          </Table.Cell>
                          <Table.Cell align="right">
                            <Link
                              to={`/employee/orders/${order.id}`}
                              className="font-sans text-label uppercase tracking-[0.18em] text-brand-primary transition-colors duration-200 hover:text-brand-accent-strong"
                            >
                              Open
                            </Link>
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
