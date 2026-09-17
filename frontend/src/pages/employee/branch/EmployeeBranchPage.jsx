import { Link } from "react-router-dom";
import { Clock, Mail, MapPin, Phone, Store } from "lucide-react";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import AsyncBoundary from "../../../components/ui/AsyncBoundary.jsx";
import StatCard from "../../../components/super-admin/StatCard.jsx";
import Table from "../../../components/ui/Table.jsx";
import { useEmployeeBranchOperations } from "../../../hooks/useEmployeeOperations.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { ORDER_STATUS_META, STOCK_STATE_META } from "../../../features/admin/operations.js";
import { formatter } from "../../../components/ui/Price.jsx";
import { formatDate, formatDateTime } from "../../../utils/format.js";

/**
 * BRANCH OPERATIONS (Phase 10)
 * -----------------------------------------------------------------------------
 * The boutique's own operating picture — where it is, who works here, what the
 * floor holds, which orders are open and what has been happening today. It is
 * deliberately smaller than head office's branch coordination and shares
 * nothing with the Super Admin's organisation governance: this is the view a
 * colleague needs to run their own counter.
 *
 * The order and stock blocks arrive only for an account whose capabilities
 * include them; the page renders what the provider returned rather than
 * deciding what to hide.
 */
export default function EmployeeBranchPage() {
  const { status, data: branchOps, error, retry } = useEmployeeBranchOperations();

  useDocumentTitle(
    branchOps?.branch ? `${branchOps.branch.name} — Swarnova Employee` : "Branch — Swarnova Employee"
  );

  const branch = branchOps?.branch;

  return (
    <>
      <PageHeader
        eyebrow="My Work · Branch Operations"
        title={branch ? branch.name : "Branch"}
        description="Your boutique — team, stock, open orders and today's activity."
        actions={
          branch ? (
            <Badge variant={branch.status === "active" ? "success" : "neutral"} dot>
              {branch.status === "active" ? "Trading" : "Closed"}
            </Badge>
          ) : null
        }
      />

      <AsyncBoundary
        status={status === "loading" ? "loading" : status === "error" ? "error" : "success"}
        error={error}
        onRetry={retry}
        errorMessage="Branch operations could not be loaded."
        className="mt-6 py-16"
      >
        {branchOps ? (
          <div className="mt-8 space-y-10">
            {/* ----- Today ------------------------------------------------ */}
            {branchOps.orders || branchOps.inventory ? (
              <section aria-label="Today at this branch" className="space-y-4">
                <h2 className="font-sans text-label uppercase tracking-[0.24em] text-text-secondary">
                  Today · {formatDate(branchOps.businessDay)}
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {branchOps.orders ? (
                    <StatCard
                      label="Orders Today"
                      value={branchOps.orders.todayCount}
                      detail={`${formatter.format(branchOps.orders.value)} in sales`}
                    />
                  ) : null}
                  {branchOps.orders ? (
                    <StatCard
                      label="Open Orders"
                      value={branchOps.orders.openCount}
                      tone={branchOps.orders.openCount > 0 ? "attention" : "default"}
                      detail={`${formatter.format(branchOps.orders.openValue)} in progress`}
                    />
                  ) : null}
                  {branchOps.inventory ? (
                    <StatCard
                      label="Stock On Floor"
                      value={branchOps.inventory.units}
                      detail={`${branchOps.inventory.rows} stock lines held`}
                    />
                  ) : null}
                  {branchOps.inventory ? (
                    <StatCard
                      label="Needs Restock"
                      value={branchOps.inventory.lowCount}
                      tone={branchOps.inventory.lowCount > 0 ? "attention" : "default"}
                      detail={`${branchOps.inventory.outCount} lines out of stock`}
                    />
                  ) : null}
                </div>
              </section>
            ) : null}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* ----- Branch details --------------------------------------- */}
              <section
                aria-label="Branch details"
                className="space-y-5 border border-border-default bg-surface-primary p-panel"
              >
                <div className="flex items-center gap-2.5">
                  <Store size={17} strokeWidth={1.5} aria-hidden="true" className="shrink-0 text-brand-accent-strong" />
                  <h2 className="font-sans text-label uppercase tracking-[0.22em] text-text-secondary">
                    Boutique
                  </h2>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2.5 font-sans text-caption text-text-secondary">
                    <MapPin size={13} strokeWidth={1.5} aria-hidden="true" className="mt-0.5 shrink-0 text-brand-accent-strong" />
                    {branch.address}
                  </li>
                  <li className="flex items-center gap-2.5 font-sans text-caption text-text-secondary">
                    <Phone size={13} strokeWidth={1.5} aria-hidden="true" className="shrink-0 text-brand-accent-strong" />
                    {branch.phone}
                  </li>
                  <li className="flex items-center gap-2.5 font-sans text-caption text-text-secondary">
                    <Mail size={13} strokeWidth={1.5} aria-hidden="true" className="shrink-0 text-brand-accent-strong" />
                    {branch.email}
                  </li>
                  {branch.openingHours ? (
                    <li className="flex items-center gap-2.5 font-sans text-caption text-text-secondary">
                      <Clock size={13} strokeWidth={1.5} aria-hidden="true" className="shrink-0 text-brand-accent-strong" />
                      {branch.openingHours.summary} · {branch.openingHours.hours}
                    </li>
                  ) : null}
                </ul>
                <p className="border-t border-border-subtle pt-4 font-sans text-caption text-text-muted">
                  {branch.flagship ? "Flagship boutique" : "Boutique"} ·{" "}
                  {branchOps.team.activeCount} of {branchOps.team.count} colleagues active
                </p>
              </section>

              {/* ----- Team -------------------------------------------------- */}
              <section aria-label="Branch team" className="space-y-4 lg:col-span-2">
                <h2 className="font-sans text-label uppercase tracking-[0.24em] text-text-secondary">
                  Team At This Boutique
                </h2>
                <Table
                  caption="Colleagues at this branch"
                  hideCaption
                  headers={[
                    { label: "Colleague" },
                    { label: "Role" },
                    { label: "Capability Profile" },
                    { label: "Status" },
                  ]}
                >
                  {branchOps.team.members.map((member) => (
                    <Table.Row key={member.id}>
                      <Table.Cell>
                        <span className="block font-sans text-body-sm font-medium text-text-primary">
                          {member.name}
                        </span>
                        <span className="block font-sans text-caption text-text-muted">
                          {member.id}
                        </span>
                      </Table.Cell>
                      <Table.Cell className="text-text-secondary">{member.role}</Table.Cell>
                      <Table.Cell className="text-text-secondary">
                        {member.profileName ?? "—"}
                      </Table.Cell>
                      <Table.Cell>
                        <Badge variant={member.status === "active" ? "success" : "neutral"} dot>
                          {member.status === "active" ? "Active" : "Disabled"}
                        </Badge>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table>
              </section>
            </div>

            {/* ----- Open orders ------------------------------------------- */}
            {branchOps.orders ? (
              <section aria-label="Orders awaiting action" className="space-y-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <h2 className="font-sans text-label uppercase tracking-[0.24em] text-text-secondary">
                    Orders Awaiting Action
                  </h2>
                  <Link
                    to="/employee/orders?status=Placed"
                    className="font-sans text-label uppercase tracking-[0.18em] text-brand-primary transition-colors duration-200 hover:text-brand-accent-strong"
                  >
                    Open orders
                  </Link>
                </div>
                {branchOps.orders.awaiting.length === 0 ? (
                  <EmptyState title="No orders are waiting">
                    Every order this boutique has taken is already on its way to
                    the customer.
                  </EmptyState>
                ) : (
                  <ul className="divide-y divide-border-subtle border border-border-default bg-surface-primary">
                    {branchOps.orders.awaiting.map((order) => {
                      const meta = ORDER_STATUS_META[order.status] ?? ORDER_STATUS_META.Placed;
                      return (
                        <li key={order.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-4">
                          <span>
                            <Link
                              to={`/employee/orders/${order.id}`}
                              className="font-sans text-body-sm font-medium text-text-primary transition-colors duration-200 hover:text-brand-primary"
                            >
                              {order.orderNumber} · {order.customerName}
                            </Link>
                            <span className="block font-sans text-caption text-text-muted">
                              Placed {formatDateTime(order.createdAt)}
                            </span>
                          </span>
                          <span className="flex items-center gap-4">
                            <span className="font-sans text-price text-text-primary">
                              {formatter.format(order.total)}
                            </span>
                            <Badge variant={meta.variant} dot>
                              {meta.label}
                            </Badge>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            ) : null}

            {/* ----- Stock needing attention ------------------------------- */}
            {branchOps.inventory && branchOps.inventory.lowStock.length > 0 ? (
              <section aria-label="Stock needing attention" className="space-y-4">
                <h2 className="font-sans text-label uppercase tracking-[0.24em] text-text-secondary">
                  Stock Needing Attention
                </h2>
                <ul className="divide-y divide-border-subtle border border-border-default bg-surface-primary">
                  {branchOps.inventory.lowStock.map((row) => {
                    const meta = STOCK_STATE_META[row.state] ?? STOCK_STATE_META.low;
                    return (
                      <li
                        key={row.id}
                        className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-4"
                      >
                        <span className="font-sans text-body-sm text-text-primary">
                          {row.productName}
                          <span className="block font-sans text-caption text-text-muted">
                            {row.sku} · reorder at {row.reorderLevel}
                          </span>
                        </span>
                        <span className="flex items-center gap-4">
                          <span className="font-sans text-body-sm text-text-primary">
                            {row.available} available
                          </span>
                          <Badge variant={meta.variant} dot>
                            {meta.label}
                          </Badge>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}

            {/* ----- Recent activity --------------------------------------- */}
            <section aria-label="Recent branch activity" className="space-y-4">
              <h2 className="font-sans text-label uppercase tracking-[0.24em] text-text-secondary">
                Recent Activity
              </h2>
              {branchOps.activity.length === 0 ? (
                <EmptyState title="Nothing recorded yet">
                  Stock movements and counter actions at this boutique will
                  appear here.
                </EmptyState>
              ) : (
                <ul className="divide-y divide-border-subtle border border-border-default bg-surface-primary">
                  {branchOps.activity.map((entry) => (
                    <li key={entry.id} className="px-5 py-4">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <Badge variant={entry.kind === "audit" ? "neutral" : "info"}>
                          {entry.kind === "audit" ? entry.label : "Stock movement"}
                        </Badge>
                        <span className="font-sans text-body-sm text-text-primary">
                          {entry.kind === "audit" ? entry.detail : entry.label}
                        </span>
                        <span className="font-sans text-caption text-text-muted">
                          {formatDateTime(entry.at)}
                        </span>
                      </div>
                      <p className="mt-1.5 font-sans text-caption text-text-secondary">
                        {entry.actor}
                        {entry.kind !== "audit" && entry.detail ? ` — ${entry.detail}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        ) : null}
      </AsyncBoundary>
    </>
  );
}
