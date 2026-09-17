import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import Button from "../../../components/ui/Button.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import AsyncBoundary from "../../../components/ui/AsyncBoundary.jsx";
import Table from "../../../components/ui/Table.jsx";
import FilterBar from "../../../components/super-admin/FilterBar.jsx";
import { useAdminOrders } from "../../../hooks/useAdminOperations.js";
import { useGovernanceBranches } from "../../../hooks/useGovernanceOrganization.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { ORDER_STATUS_META, ORDER_STATUS_OPTIONS } from "../../../features/admin/operations.js";
import { formatter } from "../../../components/ui/Price.jsx";
import { formatDateTime } from "../../../utils/format.js";

/**
 * ORDER OPERATIONS (Phase 9) — the whole order book, operated from head
 * office. Search, filter by status and branch, open an order. The
 * lifecycle itself stays deliberately small: Placed → Processing →
 * Shipped → Delivered, with Cancelled before shipping.
 */
export default function AdminOrdersPage() {
  useDocumentTitle("Orders — Swarnova Admin");

  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "all");
  const [branchFilter, setBranchFilter] = useState(searchParams.get("branch") ?? "all");

  /* Dashboard deep-links (?status=Processing) refresh the filters. */
  useEffect(() => {
    setStatusFilter(searchParams.get("status") ?? "all");
    setBranchFilter(searchParams.get("branch") ?? "all");
  }, [searchParams]);

  const query = useMemo(
    () => ({
      search: search.trim() || undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
      branchId: branchFilter === "all" ? undefined : branchFilter,
    }),
    [search, statusFilter, branchFilter]
  );

  const { status, data: orders, error, retry } = useAdminOrders(query);
  const branches = useGovernanceBranches();

  const branchOptions = [
    { value: "all", label: "All branches" },
    ...(branches.data ?? []).map((branch) => ({
      value: branch.id,
      label: branch.name,
    })),
  ];

  return (
    <>
      <PageHeader
        eyebrow="Business · Orders"
        title="Orders"
        description="Every order across the business — placed, processing, shipped, delivered and cancelled, with the branch that fulfils each one."
      />

      <div className="mt-6 space-y-5">
        <FilterBar
          searchLabel="Search orders"
          searchPlaceholder="Order number or customer…"
          searchValue={search}
          onSearchChange={setSearch}
          filters={[
            {
              id: "status",
              label: "Status",
              value: statusFilter,
              onChange: setStatusFilter,
              options: ORDER_STATUS_OPTIONS,
            },
            {
              id: "branch",
              label: "Branch",
              value: branchFilter,
              onChange: setBranchFilter,
              options: branchOptions,
            },
          ]}
        />

        <AsyncBoundary
          status={status === "loading" ? "loading" : status === "error" ? "error" : "success"}
          error={error}
          onRetry={retry}
          errorMessage="Orders could not be loaded."
        >
          {!orders || orders.length === 0 ? (
            <EmptyState title="No orders match">
              Adjust the search or filters — or clear them to see the whole
              order book.
            </EmptyState>
          ) : (
            <Table
              caption="Order book"
              hideCaption
              headers={[
                { label: "Order" },
                { label: "Customer" },
                { label: "Branch" },
                { label: "Total", align: "right" },
                { label: "Status" },
                { label: "Placed" },
                { label: "", align: "right" },
              ]}
            >
              {orders.map((order) => {
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
                        {order.items.length} {order.items.length === 1 ? "item" : "items"}
                      </span>
                    </Table.Cell>
                    <Table.Cell className="text-text-secondary">
                      {order.customerName}
                    </Table.Cell>
                    <Table.Cell className="text-text-secondary">
                      {order.branchName ?? "—"}
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
                      <Button variant="ghost" size="sm" to={`/admin/orders/${order.id}`}>
                        View
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table>
          )}
        </AsyncBoundary>
      </div>
    </>
  );
}
