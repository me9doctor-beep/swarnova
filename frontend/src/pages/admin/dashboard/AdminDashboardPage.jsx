import { Link } from "react-router-dom";
import {
  ArrowRight,
  Boxes,
  ClipboardList,
  Megaphone,
  Package,
  Store,
  Truck,
  Users,
} from "lucide-react";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import Button from "../../../components/ui/Button.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import AsyncBoundary from "../../../components/ui/AsyncBoundary.jsx";
import StatCard from "../../../components/super-admin/StatCard.jsx";
import { useAdminOverview } from "../../../hooks/useAdminOperations.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { useCapability } from "../../../features/authentication/useCapability.js";
import { CAPABILITIES } from "../../../features/authentication/capabilities.js";
import { ROLE_LABELS, ROLES } from "../../../features/authentication/roles.js";
import { orderStatusMeta } from "../../../features/admin/operations.js";
import { auditActionLabel, auditActionVariant } from "../../../features/super-admin/governance.js";
import { formatter } from "../../../components/ui/Price.jsx";
import { formatDateTime, formatDate } from "../../../utils/format.js";

/**
 * BUSINESS OPERATIONS DASHBOARD (Phase 9)
 * -----------------------------------------------------------------------------
 * The Admin's answer to "what needs attention in the jewellery business
 * today?" — deliberately different from the Super Admin command centre,
 * which answers platform-governance questions instead.
 *
 * Everything here is computed by the provider from canonical state
 * (`getAdminOverview`): compact KPIs, one attention list, branch snapshot,
 * recent customer orders and recent activity. No charts, no decoration.
 */
export default function AdminDashboardPage() {
  useDocumentTitle("Business Overview — Swarnova Admin");
  const { status, data: overview, error, retry } = useAdminOverview();
  const { can: canDo } = useCapability();

  return (
    <>
      <PageHeader
        eyebrow={ROLE_LABELS[ROLES.ADMIN]}
        title="Business Overview"
        description="Your boutique's day at a glance — this branch's orders, stock and customers, and what needs attention today."
        actions={
          canDo(CAPABILITIES.REPORTS_VIEW) ? (
            <Button size="sm" href="/admin/reports">
              View Reports
            </Button>
          ) : null
        }
      />

      <AsyncBoundary
        status={status === "loading" ? "loading" : status === "error" ? "error" : "success"}
        error={error}
        onRetry={retry}
        errorMessage="The business overview could not be loaded."
      >
        {overview ? (
          <div className="mt-8 space-y-10">
            {/* ----- Business KPIs ----------------------------------------- */}
            <section aria-label="Business summary" className="space-y-4">
              <h2 className="font-sans text-label uppercase tracking-[0.24em] text-text-secondary">
                Business Summary
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Open Orders"
                  value={overview.business.openOrders}
                  icon={ClipboardList}
                  detail={`${formatter.format(overview.business.openOrdersValue)} across open orders`}
                />
                <StatCard
                  label="Awaiting Fulfilment"
                  value={overview.business.awaitingFulfilment}
                  icon={Truck}
                  tone={overview.business.awaitingFulfilment > 0 ? "attention" : "default"}
                  detail="Placed and processing orders"
                />
                <StatCard
                  label="Stock Needing Restock"
                  value={overview.business.lowStockCount}
                  icon={Boxes}
                  tone={overview.business.lowStockCount > 0 ? "attention" : "default"}
                  detail={`${overview.business.outOfStockCount} out of stock entirely`}
                />
                <StatCard
                  label="Live Catalogue"
                  value={overview.business.publishedProducts}
                  icon={Package}
                  detail={`${overview.business.totalProducts} pieces in the catalogue overall`}
                />
              </div>
            </section>

            {/* ----- Attention + activity ---------------------------------- */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <section aria-label="Needs attention" className="space-y-4">
                <h2 className="font-sans text-label uppercase tracking-[0.24em] text-text-secondary">
                  Needs Attention
                </h2>
                {overview.attention.length === 0 ? (
                  <EmptyState title="Nothing is waiting on you">
                    Orders are moving, stock is healthy and every product is
                    where it should be in the lifecycle.
                  </EmptyState>
                ) : (
                  <ul className="divide-y divide-border-subtle border border-border-default bg-surface-primary">
                    {overview.attention.map((item) => (
                      <li key={item.key}>
                        <Link
                          to={item.to}
                          className="flex items-center justify-between gap-4 px-5 py-4 transition-colors duration-200 hover:bg-surface-secondary"
                        >
                          <span className="font-sans text-body-sm text-text-primary">
                            {item.label}
                          </span>
                          <span className="inline-flex shrink-0 items-center gap-1.5 font-sans text-label uppercase tracking-[0.18em] text-brand-primary">
                            {item.action}
                            <ArrowRight size={12} strokeWidth={1.5} aria-hidden="true" />
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}

                {overview.campaign ? (
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border border-border-default bg-surface-primary px-5 py-3.5 font-sans text-body-sm text-text-secondary">
                    <Megaphone size={14} strokeWidth={1.5} aria-hidden="true" className="text-brand-accent-strong" />
                    Live campaign:
                    <span className="font-medium text-text-primary">{overview.campaign.title}</span>
                  </p>
                ) : null}
              </section>

              <section aria-label="Recent customer orders" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-sans text-label uppercase tracking-[0.24em] text-text-secondary">
                    Recent Customer Activity
                  </h2>
                  {canDo(CAPABILITIES.ORDERS_VIEW) ? (
                    <Link
                      to="/admin/orders"
                      className="inline-flex items-center gap-1.5 font-sans text-label uppercase tracking-[0.18em] text-brand-primary transition-colors duration-200 hover:text-brand-accent-strong"
                    >
                      All Orders
                      <ArrowRight size={12} strokeWidth={1.5} aria-hidden="true" />
                    </Link>
                  ) : null}
                </div>
                <ul className="divide-y divide-border-subtle border border-border-default bg-surface-primary">
                  {overview.recentOrders.map((order) => {
                    const meta = orderStatusMeta(order.status);
                    return (
                      <li key={order.id} className="px-5 py-3.5">
                        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                          <span className="font-sans text-body-sm font-medium text-text-primary">
                            {order.customerName}
                          </span>
                          <Badge variant={meta.variant}>{meta.label}</Badge>
                        </div>
                        <p className="mt-1 font-sans text-caption text-text-muted">
                          {order.orderNumber} · {formatter.format(order.total)} ·{" "}
                          {formatDateTime(order.createdAt)}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </section>
            </div>

            {/* ----- Branch snapshot ---------------------------------------- */}
            <section aria-label="Branch snapshot" className="space-y-4">
              <h2 className="font-sans text-label uppercase tracking-[0.24em] text-text-secondary">
                Branch Snapshot
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {overview.branches.map((branch) => (
                  <article
                    key={branch.id}
                    className="flex flex-col border border-border-default bg-surface-primary p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <Store size={16} strokeWidth={1.5} aria-hidden="true" className="shrink-0 text-brand-accent-strong" />
                        <h3 className="font-sans text-body-sm font-medium text-text-primary">
                          {branch.name}
                        </h3>
                      </div>
                      <Badge variant={branch.status === "active" ? "success" : "neutral"} dot>
                        {branch.status === "active" ? "Active" : "Disabled"}
                      </Badge>
                    </div>
                    <dl className="mt-4 space-y-1.5">
                      <div className="flex items-baseline justify-between gap-4">
                        <dt className="font-sans text-caption text-text-muted">Team</dt>
                        <dd className="font-sans text-caption text-text-primary">
                          {branch.activeEmployeeCount} active of {branch.employeeCount}
                        </dd>
                      </div>
                      <div className="flex items-baseline justify-between gap-4">
                        <dt className="font-sans text-caption text-text-muted">Open orders</dt>
                        <dd className="font-sans text-caption text-text-primary">
                          {branch.openOrders.count} · {formatter.format(branch.openOrders.value)}
                        </dd>
                      </div>
                      <div className="flex items-baseline justify-between gap-4">
                        <dt className="font-sans text-caption text-text-muted">Stock</dt>
                        <dd className="font-sans text-caption text-text-primary">
                          {branch.inventory.units} units
                          {branch.inventory.lowCount > 0
                            ? ` · ${branch.inventory.lowCount} low`
                            : ""}
                        </dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            </section>

            {/* ----- Recent activity + quick actions ------------------------- */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <section aria-label="Recent activity" className="space-y-4">
                <h2 className="font-sans text-label uppercase tracking-[0.24em] text-text-secondary">
                  Recent Activity
                </h2>
                <ul className="divide-y divide-border-subtle border border-border-default bg-surface-primary">
                  {overview.recentActivity.map((entry) => (
                    <li key={entry.id} className="px-5 py-3.5">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <Badge variant={auditActionVariant(entry.action)}>
                          {auditActionLabel(entry.action)}
                        </Badge>
                        <span className="font-sans text-body-sm font-medium text-text-primary">
                          {entry.entityLabel ?? entry.entityId}
                        </span>
                        <span className="font-sans text-caption text-text-muted">
                          {formatDateTime(entry.at)}
                        </span>
                      </div>
                      <p className="mt-1.5 font-sans text-caption text-text-secondary">
                        {entry.actor} — {entry.detail}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>

              <section aria-label="Quick actions and operational queues" className="space-y-4">
                <h2 className="font-sans text-label uppercase tracking-[0.24em] text-text-secondary">
                  Quick Actions
                </h2>
                <div className="flex flex-wrap gap-3">
                  {canDo(CAPABILITIES.STAFF_MANAGE) ? (
                    <Button variant="secondary" size="sm" href="/admin/employees?new=1">
                      <Users size={14} strokeWidth={1.5} aria-hidden="true" />
                      New Employee
                    </Button>
                  ) : null}
                  {canDo(CAPABILITIES.ORDERS_VIEW) ? (
                    <Button variant="secondary" size="sm" href="/admin/orders">
                      Open Orders
                    </Button>
                  ) : null}
                  {canDo(CAPABILITIES.INVENTORY_VIEW) ? (
                    <Button variant="secondary" size="sm" href="/admin/inventory?stock=low">
                      Low Stock
                    </Button>
                  ) : null}
                  {canDo(CAPABILITIES.BRANCHES_VIEW) ? (
                    <Button variant="ghost" size="sm" href="/admin/branches">
                      <Store size={14} strokeWidth={1.5} aria-hidden="true" />
                      Branches
                    </Button>
                  ) : null}
                  <Button variant="ghost" size="sm" href="/">
                    View Storefront
                  </Button>
                </div>

                <h2 className="pt-2 font-sans text-label uppercase tracking-[0.24em] text-text-secondary">
                  Orders Needing Attention
                </h2>
                {overview.ordersNeedingAttention.length === 0 ? (
                  <EmptyState title="No open orders waiting">
                    Every placed order has been confirmed, and every confirmed
                    order has entered preparation.
                  </EmptyState>
                ) : (
                  <ul className="divide-y divide-border-subtle border border-border-default bg-surface-primary">
                    {overview.ordersNeedingAttention.map((order) => {
                      const meta = orderStatusMeta(order.status);
                      return (
                        <li key={order.id} className="px-5 py-3.5">
                          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                            <Link
                              to={`/admin/orders/${order.id}`}
                              className="font-sans text-body-sm font-medium text-text-primary transition-colors duration-200 hover:text-brand-primary"
                            >
                              {order.orderNumber}
                            </Link>
                            <Badge variant={meta.variant}>{meta.label}</Badge>
                          </div>
                          <p className="mt-1 font-sans text-caption text-text-muted">
                            {order.customerName} · {formatter.format(order.total)} ·{" "}
                            {formatDate(order.createdAt)}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            </div>
          </div>
        ) : null}
      </AsyncBoundary>
    </>
  );
}
