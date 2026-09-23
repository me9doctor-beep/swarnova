import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ClipboardList,
  Package,
  TriangleAlert,
  Users,
} from "lucide-react";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import Button from "../../../components/ui/Button.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import AsyncBoundary from "../../../components/ui/AsyncBoundary.jsx";
import Table from "../../../components/ui/Table.jsx";
import StatCard from "../../../components/super-admin/StatCard.jsx";
import { useGovernanceBranches } from "../../../hooks/useGovernanceOrganization.js";
import {
  useEmployeeBranchOperations,
  useEmployeeReports,
} from "../../../hooks/useEmployeeOperations.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { STOCK_STATE_META, orderStatusMeta } from "../../../features/admin/operations.js";
import { ACCOUNT_STATUS_META } from "../../../features/super-admin/governance.js";
import { formatter } from "../../../components/ui/Price.jsx";
import { formatDate, formatDateTime } from "../../../utils/format.js";

/**
 * BRANCH DRILL-DOWN — the Super Admin's global lens on one boutique.
 *
 * The Super Admin's authority is global (Phase 8): every governance surface
 * already reads the whole platform. This is the other half of that promise —
 * GLOBAL VIEW → one branch → back, without the account ever being narrowed.
 *
 * It reads the SAME branch contract the Employee console works inside
 * (`getEmployeeBranchOperations` / `getEmployeeReports`, scoped from the
 * session actor), with the branch named explicitly in the query. The provider
 * validates that name rather than obeying it: a global account may open any
 * boutique, and nothing about this route grants or removes authority.
 * Acting on the book uses the shared operational pages, filtered to this
 * boutique — not a second store.
 */
export default function BranchDrillDownPage() {
  const { branchId } = useParams();

  const branchesState = useGovernanceBranches();
  const operations = useEmployeeBranchOperations({ branchId });
  const reports = useEmployeeReports({ branchId });

  const branch = branchesState.data?.find((item) => item.id === branchId) ?? null;
  const statuses = [branchesState.status, operations.status, reports.status];
  const status = statuses.includes("error")
    ? "error"
    : statuses.every((item) => item === "success")
      ? "success"
      : "loading";

  useDocumentTitle(
    branch ? `${branch.name} — Swarnova Super Admin` : "Branch — Swarnova Super Admin"
  );

  const header = (
    <PageHeader
      eyebrow="Organisation · Branch Oversight"
      title={branch ? branch.name : "Branch"}
      description="One boutique, as a view. This account stays organization-wide. Open the shared book to act — choosing All branches returns to the full organization."
      actions={
        <div className="flex flex-wrap items-center gap-3">
          {branch ? (
            <Badge variant={branch.status === "active" ? "success" : "neutral"} dot>
              {branch.status === "active" ? "Trading" : "Closed"}
            </Badge>
          ) : null}
          <Button variant="secondary" size="sm" href="/super-admin/branches">
            <ArrowLeft size={13} strokeWidth={1.5} aria-hidden="true" />
            All Branches
          </Button>
          <Button size="sm" variant="outline" href={`/super-admin/orders?branch=${branchId}`}>
            Orders
          </Button>
          <Button size="sm" variant="outline" href={`/super-admin/customers?branch=${branchId}`}>
            Customers
          </Button>
          <Button size="sm" variant="outline" href={`/super-admin/inventory?branch=${branchId}`}>
            Inventory
          </Button>
        </div>
      }
    />
  );

  /* An unknown id in the URL is a dead end the platform can answer itself —
     the branch list is canonical, so the screen says so instead of throwing. */
  if (branchesState.status === "success" && !branch) {
    return (
      <>
        {header}
        <div className="mt-6">
          <EmptyState
            title="Branch not found"
            action={
              <Button variant="outline" size="sm" href="/super-admin/branches">
                Back to Branches
              </Button>
            }
          >
            No boutique is registered under <code className="font-sans">{branchId}</code>. It may
            have been renamed — the platform’s branch list is the source of truth.
          </EmptyState>
        </div>
      </>
    );
  }

  if (status !== "success") {
    return (
      <>
        {header}
        <div className="mt-6">
          <AsyncBoundary
            status={status}
            error={operations.error ?? reports.error ?? branchesState.error}
            onRetry={() => {
              if (operations.error) operations.retry();
              if (reports.error) reports.retry();
              if (branchesState.error) branchesState.retry();
            }}
            errorMessage="This branch could not be loaded."
            className="min-h-[240px] py-16"
          />
        </div>
      </>
    );
  }

  const branchOps = operations.data;
  const numbers = reports.data;

  return (
    <>
      {header}

      <div className="mt-8 space-y-10">
        {/* ----- The day, at a glance ------------------------------------ */}
        <section aria-label="Branch summary" className="space-y-4">
          <h2 className="font-sans text-label uppercase tracking-[0.24em] text-text-secondary">
            {branch.city}, {branch.state} · {formatDate(branchOps.businessDay)}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Sales Today"
              value={formatter.format(numbers.sales.today.value)}
              detail={`${numbers.sales.today.orders} order${numbers.sales.today.orders === 1 ? "" : "s"} · ${numbers.sales.today.units} piece${numbers.sales.today.units === 1 ? "" : "s"}`}
            />
            <StatCard
              label="Open Orders"
              value={branchOps.orders?.openCount ?? 0}
              icon={ClipboardList}
              tone={branchOps.orders?.openCount > 0 ? "attention" : "default"}
              detail={`${formatter.format(branchOps.orders?.openValue ?? 0)} being fulfilled`}
            />
            <StatCard
              label="Stock On Floor"
              value={branchOps.inventory?.units ?? 0}
              icon={Package}
              detail={`${branchOps.inventory?.rows ?? 0} stock lines held`}
            />
            <StatCard
              label="Needs Restock"
              value={branchOps.inventory?.lowCount ?? 0}
              icon={TriangleAlert}
              tone={branchOps.inventory?.lowCount > 0 ? "attention" : "default"}
              detail={`${branchOps.inventory?.outCount ?? 0} lines out of stock`}
            />
          </div>
        </section>

        {/* ----- The order book, by state --------------------------------- */}
        <section aria-label="Order book" className="space-y-4">
          <h2 className="font-sans text-label uppercase tracking-[0.24em] text-text-secondary">
            Order Book
          </h2>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
            <Table
              caption="Orders by status"
              headers={[
                { label: "Status" },
                { label: "Orders", align: "center" },
                { label: "Value", align: "right" },
              ]}
            >
              {numbers.ordersByStatus.map((row) => (
                <Table.Row key={row.status}>
                  <Table.Cell>
                    <Badge variant={orderStatusMeta(row.status).variant}>
                      {orderStatusMeta(row.status).label}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell align="center">{row.count}</Table.Cell>
                  <Table.Cell align="right" className="font-sans text-body-sm text-text-secondary">
                    {formatter.format(row.value)}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table>

            <div className="space-y-4">
              <h3 className="font-sans text-label uppercase tracking-[0.22em] text-text-muted">
                Awaiting the Counter
              </h3>
              {branchOps.orders?.awaiting?.length ? (
                <Table
                  caption="Orders waiting to be processed"
                  headers={[
                    { label: "Order" },
                    { label: "Customer" },
                    { label: "Placed" },
                    { label: "Total", align: "right" },
                  ]}
                >
                  {branchOps.orders.awaiting.map((order) => (
                    <Table.Row key={order.id}>
                      <Table.Cell>
                        <Link
                          to={`/super-admin/orders/${order.id}`}
                          className="block font-sans text-body-sm font-medium text-text-primary transition-colors duration-200 hover:text-brand-primary"
                        >
                          {order.orderNumber}
                        </Link>
                        <Badge variant={orderStatusMeta(order.status).variant}>
                          {orderStatusMeta(order.status).label}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell className="font-sans text-body-sm text-text-secondary">
                        {order.customerName}
                      </Table.Cell>
                      <Table.Cell className="font-sans text-caption text-text-muted">
                        {formatDate(order.createdAt)}
                      </Table.Cell>
                      <Table.Cell
                        align="right"
                        className="font-sans text-body-sm text-text-primary"
                      >
                        {formatter.format(order.total)}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table>
              ) : (
                <EmptyState title="Nothing is waiting">
                  Every order this boutique holds has moved past the counter.
                </EmptyState>
              )}
            </div>
          </div>
        </section>

        {/* ----- Stock and the pieces that move --------------------------- */}
        <section aria-label="Stock and demand" className="space-y-4">
          <h2 className="font-sans text-label uppercase tracking-[0.24em] text-text-secondary">
            Stock &amp; Demand
          </h2>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="space-y-4">
              <h3 className="font-sans text-label uppercase tracking-[0.22em] text-text-muted">
                Lines Needing Attention
              </h3>
              {branchOps.inventory?.lowStock?.length ? (
                <Table
                  caption="Stock needing restock"
                  headers={[
                    { label: "Product" },
                    { label: "Available", align: "center" },
                    { label: "Reserved", align: "center" },
                    { label: "State" },
                  ]}
                >
                  {branchOps.inventory.lowStock.map((row) => (
                    <Table.Row key={row.id} highlight>
                      <Table.Cell>
                        <span className="block font-sans text-body-sm font-medium text-text-primary">
                          {row.productName}
                        </span>
                        <span className="block font-sans text-caption text-text-muted">
                          {row.sku}
                        </span>
                      </Table.Cell>
                      <Table.Cell align="center">{row.available}</Table.Cell>
                      <Table.Cell align="center">{row.reserved}</Table.Cell>
                      <Table.Cell>
                        <Badge variant={STOCK_STATE_META[row.state]?.variant ?? "neutral"} dot>
                          {STOCK_STATE_META[row.state]?.label ?? row.state}
                        </Badge>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table>
              ) : (
                <EmptyState title="Every line is stocked">
                  No product at {branch.name} is below its reorder level.
                </EmptyState>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="font-sans text-label uppercase tracking-[0.22em] text-text-muted">
                Top Movers
              </h3>
              {numbers.topProducts.length ? (
                <Table
                  caption="Best-selling pieces at this branch"
                  headers={[
                    { label: "Product" },
                    { label: "Units", align: "center" },
                    { label: "Revenue", align: "right" },
                  ]}
                >
                  {numbers.topProducts.map((product) => (
                    <Table.Row key={product.productId}>
                      <Table.Cell>
                        <span className="block font-sans text-body-sm font-medium text-text-primary">
                          {product.name}
                        </span>
                        <span className="block font-sans text-caption text-text-muted">
                          {product.sku}
                        </span>
                      </Table.Cell>
                      <Table.Cell align="center">{product.units}</Table.Cell>
                      <Table.Cell
                        align="right"
                        className="font-sans text-body-sm text-text-secondary"
                      >
                        {formatter.format(product.revenue)}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table>
              ) : (
                <EmptyState title="No sales yet">
                  Nothing has been sold at this boutique in the recorded window.
                </EmptyState>
              )}
            </div>
          </div>
        </section>

        {/* ----- The people and the trail --------------------------------- */}
        <section aria-label="Team and activity" className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="font-sans text-label uppercase tracking-[0.24em] text-text-secondary">
              Team &amp; Activity
            </h2>
            <Link
              to="/super-admin/employees"
              className="inline-flex items-center gap-1.5 font-sans text-label uppercase tracking-[0.18em] text-brand-primary transition-colors duration-200 hover:text-brand-accent-strong"
            >
              <Users size={12} strokeWidth={1.5} aria-hidden="true" />
              Staff Directory
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Table
              caption={`Team at ${branch.name}`}
              headers={[
                { label: "Employee" },
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
                      {member.role}
                    </span>
                  </Table.Cell>
                  <Table.Cell className="font-sans text-body-sm text-text-secondary">
                    {member.profileName ?? "—"}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge variant={ACCOUNT_STATUS_META[member.status]?.variant ?? "neutral"} dot>
                      {ACCOUNT_STATUS_META[member.status]?.label ?? member.status}
                    </Badge>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table>

            <div className="space-y-4">
              <h3 className="font-sans text-label uppercase tracking-[0.22em] text-text-muted">
                Recent Branch Activity
              </h3>
              {branchOps.activity.length ? (
                <ul className="divide-y divide-border-subtle border border-border-default bg-surface-primary">
                  {branchOps.activity.map((entry) => (
                    <li key={entry.id} className="px-5 py-3.5">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <Badge variant="neutral">{entry.label}</Badge>
                        <span className="font-sans text-caption text-text-muted">
                          {formatDateTime(entry.at)}
                        </span>
                      </div>
                      <p className="mt-1.5 font-sans text-caption text-text-secondary">
                        {entry.actor}
                        {entry.detail ? ` — ${entry.detail}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="Nothing recorded today">
                  No counter movements or governance actions have been logged at this boutique yet.
                </EmptyState>
              )}
            </div>
          </div>
        </section>

      </div>
    </>
  );
}
