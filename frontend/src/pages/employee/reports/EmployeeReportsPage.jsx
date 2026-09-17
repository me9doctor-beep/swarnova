import PageHeader from "../../../components/layout/PageHeader.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import AsyncBoundary from "../../../components/ui/AsyncBoundary.jsx";
import Table from "../../../components/ui/Table.jsx";
import StatCard from "../../../components/super-admin/StatCard.jsx";
import { useEmployeeReports } from "../../../hooks/useEmployeeOperations.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { ORDER_STATUS_META, STOCK_STATE_META } from "../../../features/admin/operations.js";
import { formatter } from "../../../components/ui/Price.jsx";
import { formatDate } from "../../../utils/format.js";

/**
 * BRANCH REPORTS (Phase 10)
 * -----------------------------------------------------------------------------
 * Operational reporting for one boutique, and only one: counter sales, the
 * order book by state, the pieces that actually move and stock health. It is
 * capability-controlled (reports.view) — a profile without it never reaches
 * this page — and deliberately says nothing about other branches, head-office
 * performance or platform analytics.
 */
export default function EmployeeReportsPage() {
  useDocumentTitle("Reports — Swarnova Employee");

  const { status, data: reports, error, retry } = useEmployeeReports();

  return (
    <>
      <PageHeader
        eyebrow="My Work · Reports"
        title="Branch Reports"
        description="How this boutique is trading — sales, orders, pieces and stock, computed from the same order book the counter works from."
      />

      <AsyncBoundary
        status={status === "loading" ? "loading" : status === "error" ? "error" : "success"}
        error={error}
        onRetry={retry}
        errorMessage="Reports could not be loaded."
        className="mt-6 py-16"
      >
        {reports ? (
          <div className="mt-8 space-y-10">
            <p className="border border-border-default bg-surface-primary px-5 py-3.5 font-sans text-body-sm text-text-secondary">
              Every figure below covers{" "}
              <span className="text-text-primary">{reports.branch.name}</span> only · business day{" "}
              {formatDate(reports.businessDay)}
            </p>

            {/* ----- Sales summary ----------------------------------------- */}
            <section aria-label="Sales summary" className="space-y-4">
              <h2 className="font-sans text-label uppercase tracking-[0.24em] text-text-secondary">
                Sales Summary
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard
                  label="Today"
                  value={formatter.format(reports.sales.today.value)}
                  detail={`${reports.sales.today.orders} orders · ${reports.sales.today.units} pieces`}
                />
                <StatCard
                  label="Last 7 Days"
                  value={formatter.format(reports.sales.week.value)}
                  detail={`${reports.sales.week.orders} orders · ${reports.sales.week.units} pieces`}
                />
                <StatCard
                  label="All Time"
                  value={formatter.format(reports.sales.all.value)}
                  detail={`${reports.sales.all.orders} orders · ${reports.sales.all.units} pieces`}
                />
              </div>
            </section>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              {/* ----- Recent days ------------------------------------------ */}
              <section aria-label="Sales by day" className="space-y-4">
                <h2 className="font-sans text-label uppercase tracking-[0.24em] text-text-secondary">
                  Last Seven Days
                </h2>
                <Table
                  caption="Sales by day at this branch"
                  hideCaption
                  headers={[
                    { label: "Day" },
                    { label: "Orders", align: "right" },
                    { label: "Pieces", align: "right" },
                    { label: "Value", align: "right" },
                  ]}
                >
                  {reports.recentDays.map((day) => (
                    <Table.Row key={day.date} highlight={day.date === reports.businessDay}>
                      <Table.Cell>{formatDate(day.date)}</Table.Cell>
                      <Table.Cell align="right">{day.orders}</Table.Cell>
                      <Table.Cell align="right">{day.units}</Table.Cell>
                      <Table.Cell align="right">
                        {day.value > 0 ? formatter.format(day.value) : "—"}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table>
              </section>

              {/* ----- Orders by status -------------------------------------- */}
              <section aria-label="Orders by status" className="space-y-4">
                <h2 className="font-sans text-label uppercase tracking-[0.24em] text-text-secondary">
                  Order Book
                </h2>
                <Table
                  caption="Orders by status at this branch"
                  hideCaption
                  headers={[
                    { label: "Status" },
                    { label: "Orders", align: "right" },
                    { label: "Value", align: "right" },
                  ]}
                >
                  {reports.ordersByStatus.map((row) => {
                    const meta = ORDER_STATUS_META[row.status] ?? ORDER_STATUS_META.Placed;
                    return (
                      <Table.Row key={row.status}>
                        <Table.Cell>
                          <Badge variant={meta.variant} dot>
                            {meta.label}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell align="right">{row.count}</Table.Cell>
                        <Table.Cell align="right">
                          {row.value > 0 ? formatter.format(row.value) : "—"}
                        </Table.Cell>
                      </Table.Row>
                    );
                  })}
                </Table>
              </section>

              {/* ----- Product activity -------------------------------------- */}
              <section aria-label="Product activity" className="space-y-4">
                <h2 className="font-sans text-label uppercase tracking-[0.24em] text-text-secondary">
                  Pieces That Move
                </h2>
                {reports.topProducts.length === 0 ? (
                  <EmptyState title="Nothing sold yet">
                    Pieces sold at this boutique will be ranked here.
                  </EmptyState>
                ) : (
                  <Table
                    caption="Top pieces sold at this branch"
                    hideCaption
                    headers={[
                      { label: "Piece" },
                      { label: "Pieces", align: "right" },
                      { label: "Revenue", align: "right" },
                    ]}
                  >
                    {reports.topProducts.map((product) => (
                      <Table.Row key={product.productId}>
                        <Table.Cell>
                          <span className="block font-sans text-body-sm font-medium text-text-primary">
                            {product.name}
                          </span>
                          <span className="block font-sans text-caption text-text-muted">
                            {product.sku}
                          </span>
                        </Table.Cell>
                        <Table.Cell align="right">{product.units}</Table.Cell>
                        <Table.Cell align="right">{formatter.format(product.revenue)}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table>
                )}
              </section>

              {/* ----- Inventory health -------------------------------------- */}
              <section aria-label="Inventory health" className="space-y-4">
                <h2 className="font-sans text-label uppercase tracking-[0.24em] text-text-secondary">
                  Stock Health
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <StatCard
                    label="Pieces On Floor"
                    value={reports.inventory.units}
                    detail={`${reports.inventory.rows} stock lines`}
                  />
                  <StatCard
                    label="Needs Restock"
                    value={reports.inventory.lowCount}
                    tone={reports.inventory.lowCount > 0 ? "attention" : "default"}
                    detail={`${reports.inventory.outCount} out of stock`}
                  />
                </div>
                {reports.inventory.lowStock.length > 0 ? (
                  <ul className="divide-y divide-border-subtle border border-border-default bg-surface-primary">
                    {reports.inventory.lowStock.map((row) => {
                      const meta = STOCK_STATE_META[row.state] ?? STOCK_STATE_META.low;
                      return (
                        <li
                          key={row.id}
                          className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-3.5"
                        >
                          <span className="font-sans text-body-sm text-text-primary">
                            {row.productName}
                          </span>
                          <span className="flex items-center gap-4">
                            <span className="font-sans text-caption text-text-secondary">
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
                ) : null}
              </section>
            </div>
          </div>
        ) : null}
      </AsyncBoundary>
    </>
  );
}
