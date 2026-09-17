import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import Button from "../../../components/ui/Button.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import AsyncBoundary from "../../../components/ui/AsyncBoundary.jsx";
import Table from "../../../components/ui/Table.jsx";
import FilterBar from "../../../components/super-admin/FilterBar.jsx";
import { useEmployeeOrders } from "../../../hooks/useEmployeeOperations.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { ORDER_STATUS_META, ORDER_STATUS_OPTIONS } from "../../../features/admin/operations.js";
import { formatter } from "../../../components/ui/Price.jsx";
import { formatDateTime } from "../../../utils/format.js";

/**
 * BRANCH ORDERS (Phase 10)
 * -----------------------------------------------------------------------------
 * The order book as this boutique works it: search by order number or
 * customer, filter by the lifecycle state, open the order. The branch comes
 * from the signed-in employee's account — there is no branch filter to change,
 * and the provider would refuse one anyway.
 */
export default function EmployeeOrdersPage() {
  useDocumentTitle("Orders — Swarnova Employee");

  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "all");

  /* Dashboard deep-links (?status=Placed) refresh the filters. */
  useEffect(() => {
    setStatusFilter(searchParams.get("status") ?? "all");
  }, [searchParams]);

  const query = useMemo(
    () => ({
      search: search.trim() || undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
    }),
    [search, statusFilter]
  );

  const { status, data: orders, error, retry } = useEmployeeOrders(query);

  return (
    <>
      <PageHeader
        eyebrow="My Work · Orders"
        title="Orders"
        description="Every order this boutique fulfils — search, check its state and carry it through the counter."
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
              Adjust the search or status — or clear them to see the boutique's
              whole order book.
            </EmptyState>
          ) : (
            <Table
              caption="Branch orders"
              hideCaption
              headers={[
                { label: "Order" },
                { label: "Customer" },
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
                        to={`/employee/orders/${order.id}`}
                        className="font-sans text-body-sm font-medium text-text-primary transition-colors duration-200 hover:text-brand-primary"
                      >
                        {order.orderNumber}
                      </Link>
                      <span className="block font-sans text-caption text-text-muted">
                        {order.items.length} {order.items.length === 1 ? "item" : "items"}
                      </span>
                    </Table.Cell>
                    <Table.Cell className="text-text-secondary">{order.customerName}</Table.Cell>
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
                      <Button variant="ghost" size="sm" to={`/employee/orders/${order.id}`}>
                        Open
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
