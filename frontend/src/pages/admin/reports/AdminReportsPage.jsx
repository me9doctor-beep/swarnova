import PageHeader from "../../../components/layout/PageHeader.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import AsyncBoundary from "../../../components/ui/AsyncBoundary.jsx";
import Table from "../../../components/ui/Table.jsx";
import { useAdminReports } from "../../../hooks/useAdminOperations.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { ORDER_STATUS_META, STOCK_STATE_META } from "../../../features/admin/operations.js";
import { formatter } from "../../../components/ui/Price.jsx";

/**
 * BUSINESS REPORTS (Phase 9) — the numbers head office reads, computed by
 * the provider from canonical state. Plain tables, no charts: orders by
 * status, sales by branch, top pieces and the stock that needs attention.
 */
export default function AdminReportsPage() {
  useDocumentTitle("Reports — Swarnova Admin");

  const { status, data: reports, error, retry } = useAdminReports();

  return (
    <>
      <PageHeader
        eyebrow="Insights"
        title="Reports"
        description="Business performance from the canonical order book and inventory — orders by status, sales by branch, top pieces and stock health."
      />

      <AsyncBoundary
        status={status === "loading" ? "loading" : status === "error" ? "error" : "success"}
        error={error}
        onRetry={retry}
        errorMessage="Reports could not be loaded."
        className="mt-6"
      >
        {reports ? (
          <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
            {/* ----- Orders by status -------------------------------------- */}
            <section aria-label="Orders by status" className="space-y-4">
              <h2 className="font-sans text-label uppercase tracking-[0.24em] text-text-secondary">
                Orders by Status
              </h2>
              <Table
                caption="Orders by status"
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
                      <Table.Cell align="right">{formatter.format(row.value)}</Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table>
            </section>

            {/* ----- Sales by branch --------------------------------------- */}
            <section aria-label="Sales by branch" className="space-y-4">
              <h2 className="font-sans text-label uppercase tracking-[0.24em] text-text-secondary">
                Sales by Branch
              </h2>
              <Table
                caption="Sales by branch"
                hideCaption
                headers={[
                  { label: "Branch" },
                  { label: "Orders", align: "right" },
                  { label: "Units", align: "right" },
                  { label: "Revenue", align: "right" },
                ]}
              >
                {reports.salesByBranch.map((row) => (
                  <Table.Row key={row.branchId}>
                    <Table.Cell>
                      <span className="block font-sans text-body-sm font-medium text-text-primary">
                        {row.branchName}
                      </span>
                      <span className="block font-sans text-caption text-text-muted">
                        {row.city}
                      </span>
                    </Table.Cell>
                    <Table.Cell align="right">{row.orders}</Table.Cell>
                    <Table.Cell align="right">{row.units}</Table.Cell>
                    <Table.Cell align="right">{formatter.format(row.revenue)}</Table.Cell>
                  </Table.Row>
                ))}
              </Table>
              <p className="font-sans text-caption text-text-muted">
                Cancelled orders are excluded from sales figures.
              </p>
            </section>

            {/* ----- Top pieces --------------------------------------------- */}
            <section aria-label="Top pieces" className="space-y-4">
              <h2 className="font-sans text-label uppercase tracking-[0.24em] text-text-secondary">
                Top Pieces
              </h2>
              {reports.topProducts.length === 0 ? (
                <EmptyState title="No sales recorded yet">
                  Top pieces appear once the order book has delivered
                  history.
                </EmptyState>
              ) : (
                <Table
                  caption="Top pieces by units sold"
                  hideCaption
                  headers={[
                    { label: "Piece" },
                    { label: "Units", align: "right" },
                    { label: "Revenue", align: "right" },
                  ]}
                >
                  {reports.topProducts.map((row) => (
                    <Table.Row key={row.productId}>
                      <Table.Cell>
                        <span className="block font-sans text-body-sm font-medium text-text-primary">
                          {row.name}
                        </span>
                        <span className="block font-sans text-caption text-text-muted">
                          {row.sku}
                        </span>
                      </Table.Cell>
                      <Table.Cell align="right">{row.units}</Table.Cell>
                      <Table.Cell align="right">{formatter.format(row.revenue)}</Table.Cell>
                    </Table.Row>
                  ))}
                </Table>
              )}
            </section>

            {/* ----- Stock health -------------------------------------------- */}
            <section aria-label="Stock health" className="space-y-4">
              <h2 className="font-sans text-label uppercase tracking-[0.24em] text-text-secondary">
                Stock Needing Attention
              </h2>
              {reports.lowStock.length === 0 ? (
                <EmptyState title="No stock needs attention">
                  Every branch stock line sits above its reorder level.
                </EmptyState>
              ) : (
                <Table
                  caption="Stock lines at or below reorder level"
                  hideCaption
                  headers={[
                    { label: "Piece" },
                    { label: "Branch" },
                    { label: "Available", align: "right" },
                    { label: "State" },
                  ]}
                >
                  {reports.lowStock.map((row) => {
                    const meta = STOCK_STATE_META[row.state] ?? STOCK_STATE_META.ok;
                    return (
                      <Table.Row key={row.id}>
                        <Table.Cell>
                          <span className="block font-sans text-body-sm font-medium text-text-primary">
                            {row.productName}
                          </span>
                          <span className="block font-sans text-caption text-text-muted">
                            {row.sku}
                          </span>
                        </Table.Cell>
                        <Table.Cell className="text-text-secondary">
                          {row.branchName}
                        </Table.Cell>
                        <Table.Cell align="right">{row.available}</Table.Cell>
                        <Table.Cell>
                          <Badge variant={meta.variant} dot>
                            {meta.label}
                          </Badge>
                        </Table.Cell>
                      </Table.Row>
                    );
                  })}
                </Table>
              )}
            </section>
          </div>
        ) : null}
      </AsyncBoundary>
    </>
  );
}
