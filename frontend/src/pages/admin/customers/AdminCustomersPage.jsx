import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import Button from "../../../components/ui/Button.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import AsyncBoundary from "../../../components/ui/AsyncBoundary.jsx";
import Table from "../../../components/ui/Table.jsx";
import FilterBar from "../../../components/super-admin/FilterBar.jsx";
import { useAdminCustomers } from "../../../hooks/useAdminOperations.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { formatter } from "../../../components/ui/Price.jsx";
import { formatDate } from "../../../utils/format.js";

/**
 * CUSTOMER OPERATIONS (Phase 9) — the customer book for the business.
 *
 * Contact information, membership and order statistics derived from the
 * canonical order book — never a second customer database, and nothing
 * sensitive a business view does not need.
 */
export default function AdminCustomersPage() {
  useDocumentTitle("Customers — Swarnova Admin");

  const [search, setSearch] = useState("");
  const query = useMemo(() => ({ search: search.trim() || undefined }), [search]);
  const { status, data: customers, error, retry } = useAdminCustomers(query);

  return (
    <>
      <PageHeader
        eyebrow="Business · Customers"
        title="Customers"
        description="The customer book — who buys from Swarnova, how they are reached, and what their relationship with the house looks like."
      />

      <div className="mt-6 space-y-5">
        <FilterBar
          searchLabel="Search customers"
          searchPlaceholder="Name, email, phone or city…"
          searchValue={search}
          onSearchChange={setSearch}
        />

        <AsyncBoundary
          status={status === "loading" ? "loading" : status === "error" ? "error" : "success"}
          error={error}
          onRetry={retry}
          errorMessage="Customers could not be loaded."
        >
          {!customers || customers.length === 0 ? (
            <EmptyState title="No customers match">
              Adjust the search — or clear it to see the whole customer book.
            </EmptyState>
          ) : (
            <Table
              caption="Customer directory"
              hideCaption
              headers={[
                { label: "Customer" },
                { label: "Contact" },
                { label: "City" },
                { label: "Tier" },
                { label: "Orders", align: "center" },
                { label: "Total Spent", align: "right" },
                { label: "Last Order" },
                { label: "", align: "right" },
              ]}
            >
              {customers.map((customer) => (
                <Table.Row key={customer.id}>
                  <Table.Cell>
                    <Link
                      to={`/admin/customers/${customer.id}`}
                      className="block font-sans text-body-sm font-medium text-text-primary transition-colors duration-200 hover:text-brand-primary"
                    >
                      {customer.name}
                    </Link>
                    <span className="block font-sans text-caption text-text-muted">
                      {customer.id}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="block font-sans text-caption text-text-secondary">
                      {customer.email}
                    </span>
                    <span className="block font-sans text-caption text-text-muted">
                      {customer.phone}
                    </span>
                  </Table.Cell>
                  <Table.Cell className="text-text-secondary">
                    {customer.city}, {customer.state}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge variant={customer.tier === "Swarnova Privé" ? "brand" : "neutral"}>
                      {customer.tier.replace("Swarnova ", "")}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell align="center">{customer.orderCount}</Table.Cell>
                  <Table.Cell align="right">
                    {formatter.format(customer.totalSpent)}
                  </Table.Cell>
                  <Table.Cell className="text-caption text-text-muted">
                    {customer.lastOrderAt ? formatDate(customer.lastOrderAt) : "—"}
                  </Table.Cell>
                  <Table.Cell align="right">
                    <Button variant="ghost" size="sm" to={`/admin/customers/${customer.id}`}>
                      View
                    </Button>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table>
          )}
        </AsyncBoundary>
      </div>
    </>
  );
}
