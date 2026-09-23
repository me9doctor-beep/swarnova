import { Link } from "react-router-dom";
import {
  ArrowRight,
  Boxes,
  ClipboardList,
  Clock,
  Phone,
  ShoppingBag,
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
import { useEmployeeOverview } from "../../../hooks/useEmployeeOperations.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { useCapability } from "../../../features/authentication/useCapability.js";
import { CAPABILITIES } from "../../../features/authentication/capabilities.js";
import { STOCK_STATE_META, orderStatusMeta } from "../../../features/admin/operations.js";
import { formatter } from "../../../components/ui/Price.jsx";
import { formatDate, formatDateTime } from "../../../utils/format.js";

/**
 * BRANCH DASHBOARD (Phase 10)
 * -----------------------------------------------------------------------------
 * The employee's answer to "what do I need to do at my branch today?" —
 * deliberately operational and small: today's counter activity, the work
 * waiting to be processed, stock that needs attention and the next step for
 * each item. No corporate analytics, no charts.
 *
 * Everything is computed by the provider from the employee's own branch
 * (`getEmployeeOverview`), and the blocks it cannot see — stock figures, the
 * team line — are simply absent from the payload for a profile without those
 * capabilities, so the screen never has to decide what to hide.
 */
export default function EmployeeDashboardPage() {
  const { status, data: overview, error, retry } = useEmployeeOverview();
  const { can: canDo } = useCapability();

  useDocumentTitle(
    overview?.branch ? `${overview.branch.name} — Swarnova Employee` : "My Branch — Swarnova Employee"
  );

  const branch = overview?.branch;

  return (
    <>
      <PageHeader
        eyebrow="My Work"
        title={branch ? branch.name : "My Branch"}
        description="What needs your attention at your boutique today."
        actions={
          branch ? (
            <Badge variant={branch.status === "active" ? "success" : "neutral"} dot>
              {branch.status === "active" ? "Open" : "Closed"}
            </Badge>
          ) : null
        }
      />

      <AsyncBoundary
        status={status === "loading" ? "loading" : status === "error" ? "error" : "success"}
        error={error}
        onRetry={retry}
        errorMessage="Your branch overview could not be loaded."
        className="mt-6 py-16"
      >
        {overview ? (
          <div className="mt-8 space-y-10">
            {/* ----- Today ------------------------------------------------ */}
            <section aria-label="Today" className="space-y-4">
              <h2 className="font-sans text-label uppercase tracking-[0.24em] text-text-secondary">
                Today · {formatDate(overview.businessDay)}
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {/* Order-derived cards exist only for a profile that may read
                    the order book; the payload omits the block otherwise. */}
                {overview.today ? (
                  <StatCard
                    label="Orders Today"
                    value={overview.today.orders}
                    icon={ClipboardList}
                    detail={`${formatter.format(overview.today.value)} in counter sales`}
                  />
                ) : null}
                {overview.awaiting && overview.openOrders ? (
                  <StatCard
                    label="Awaiting Action"
                    value={overview.awaiting.count}
                    icon={Truck}
                    tone={overview.awaiting.count > 0 ? "attention" : "default"}
                    detail={`${overview.openOrders.count} open orders at this boutique`}
                  />
                ) : null}
                {overview.inventory ? (
                  <StatCard
                    label="Needs Restock"
                    value={overview.inventory.lowCount}
                    icon={Boxes}
                    tone={overview.inventory.lowCount > 0 ? "attention" : "default"}
                    detail={`${overview.inventory.units} pieces on the floor`}
                  />
                ) : null}
                {overview.today ? (
                  <StatCard
                    label="Customers Today"
                    value={overview.today.customers}
                    icon={Users}
                    detail="Guests served across today's orders"
                  />
                ) : null}
              </div>
            </section>

            {/* ----- Boutique status -------------------------------------- */}
            {branch ? (
              <p className="flex flex-wrap items-center gap-x-4 gap-y-2 border border-border-default bg-surface-primary px-5 py-4 font-sans text-body-sm text-text-secondary">
                <span className="inline-flex items-center gap-2 text-text-primary">
                  <Store size={15} strokeWidth={1.5} aria-hidden="true" className="text-brand-accent-strong" />
                  {branch.city}, {branch.state}
                </span>
                {branch.openingHours ? (
                  <span className="inline-flex items-center gap-2">
                    <Clock size={14} strokeWidth={1.5} aria-hidden="true" className="text-brand-accent-strong" />
                    {branch.openingHours.summary} · {branch.openingHours.hours}
                  </span>
                ) : null}
                {branch.phone ? (
                  <span className="inline-flex items-center gap-2">
                    <Phone size={14} strokeWidth={1.5} aria-hidden="true" className="text-brand-accent-strong" />
                    {branch.phone}
                  </span>
                ) : null}
              </p>
            ) : null}

            {/* ----- Work waiting ----------------------------------------- */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <section aria-label="Needs attention" className="space-y-4">
                <h2 className="font-sans text-label uppercase tracking-[0.24em] text-text-secondary">
                  Needs Attention
                </h2>
                {overview.attention.length === 0 ? (
                  <EmptyState title="Nothing is waiting on you">
                    Orders are moving and the counter is clear — everything else
                    is already in hand.
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
              </section>

              <section aria-label="Quick actions" className="space-y-4">
                <h2 className="font-sans text-label uppercase tracking-[0.24em] text-text-secondary">
                  Quick Actions
                </h2>
                <div className="flex flex-col gap-3 border border-border-default bg-surface-primary p-panel sm:flex-row sm:flex-wrap sm:items-center">
                  {canDo(CAPABILITIES.ORDERS_VIEW) ? (
                    <Button variant="outline" size="sm" to="/employee/orders">
                      View Orders
                    </Button>
                  ) : null}
                  {canDo(CAPABILITIES.INVENTORY_VIEW) ? (
                    <Button variant="outline" size="sm" to="/employee/inventory">
                      Check Inventory
                    </Button>
                  ) : null}
                  {canDo(CAPABILITIES.ORDERS_VIEW) ? (
                    <Button variant="outline" size="sm" to="/employee/customers">
                      Customers
                    </Button>
                  ) : null}
                  {canDo(CAPABILITIES.CATALOGUE_VIEW) ? (
                    <Button variant="outline" size="sm" to="/employee/products">
                      Product Lookup
                    </Button>
                  ) : null}
                </div>
                {overview.team ? (
                  <p className="border border-border-default bg-surface-primary px-5 py-3.5 font-sans text-body-sm text-text-secondary">
                    <span className="text-text-primary">
                      {overview.team.activeCount} of {overview.team.count}
                    </span>{" "}
                    colleagues are active at this boutique.{" "}
                    <Link
                      to="/employee/branch"
                      className="font-sans text-label uppercase tracking-[0.18em] text-brand-primary transition-colors duration-200 hover:text-brand-accent-strong"
                    >
                      Branch details
                    </Link>
                  </p>
                ) : null}
              </section>
            </div>

            {/* ----- Recent orders ---------------------------------------- */}
            {canDo(CAPABILITIES.ORDERS_VIEW) ? (
            <section aria-label="Recent orders" className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <h2 className="font-sans text-label uppercase tracking-[0.24em] text-text-secondary">
                  Recent Orders
                </h2>
                {canDo(CAPABILITIES.ORDERS_VIEW) ? (
                  <Link
                    to="/employee/orders"
                    className="font-sans text-label uppercase tracking-[0.18em] text-brand-primary transition-colors duration-200 hover:text-brand-accent-strong"
                  >
                    All orders
                  </Link>
                ) : null}
              </div>

              {overview.recentOrders.length === 0 ? (
                <EmptyState title="No orders yet">
                  Orders placed for this boutique will appear here as they arrive.
                </EmptyState>
              ) : (
                <ul className="divide-y divide-border-subtle border border-border-default bg-surface-primary">
                  {overview.recentOrders.map((order) => {
                    const meta = orderStatusMeta(order.status);
                    return (
                      <li key={order.id}>
                        <Link
                          to={`/employee/orders/${order.id}`}
                          className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-4 transition-colors duration-200 hover:bg-surface-secondary"
                        >
                          <span className="min-w-0">
                            <span className="block font-sans text-body-sm font-medium text-text-primary">
                              {order.customerName}
                            </span>
                            <span className="block font-sans text-caption text-text-muted">
                              {order.orderNumber} · {formatDateTime(order.createdAt)}
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
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
            ) : null}

            {/* ----- Stock needing attention ------------------------------ */}
            {overview.lowStock.length > 0 ? (
              <section aria-label="Stock needing restock" className="space-y-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <h2 className="font-sans text-label uppercase tracking-[0.24em] text-text-secondary">
                    Stock Needing Restock
                  </h2>
                  <Link
                    to="/employee/inventory?stock=low"
                    className="font-sans text-label uppercase tracking-[0.18em] text-brand-primary transition-colors duration-200 hover:text-brand-accent-strong"
                  >
                    All stock
                  </Link>
                </div>
                <ul className="divide-y divide-border-subtle border border-border-default bg-surface-primary">
                  {overview.lowStock.map((row) => {
                    const meta = STOCK_STATE_META[row.state] ?? STOCK_STATE_META.low;
                    return (
                      <li
                        key={row.id}
                        className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-4"
                      >
                        <span className="flex items-center gap-3">
                          {row.productImage?.src ? (
                            <img
                              src={row.productImage.src}
                              alt=""
                              loading="lazy"
                              className="h-11 w-11 shrink-0 border border-border-subtle object-cover"
                            />
                          ) : (
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-border-subtle bg-surface-secondary text-brand-accent-strong">
                              <ShoppingBag size={16} strokeWidth={1.5} aria-hidden="true" />
                            </span>
                          )}
                          <span>
                            <span className="block font-sans text-body-sm font-medium text-text-primary">
                              {row.productName}
                            </span>
                            <span className="block font-sans text-caption text-text-muted">
                              {row.sku} · reorder at {row.reorderLevel}
                            </span>
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
          </div>
        ) : null}
      </AsyncBoundary>
    </>
  );
}
