import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import Button from "../../../components/ui/Button.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import AsyncBoundary from "../../../components/ui/AsyncBoundary.jsx";
import Table from "../../../components/ui/Table.jsx";
import FilterBar from "../../../components/super-admin/FilterBar.jsx";
import { useEmployeeCustomers } from "../../../hooks/useEmployeeOperations.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { formatter } from "../../../components/ui/Price.jsx";
import { formatDate } from "../../../utils/format.js";

/**
 * BRANCH CUSTOMER BOOK (Phase 10)
 * -----------------------------------------------------------------------------
 * The guests this boutique has served — from the ONE canonical customer
 * directory, narrowed to the people with orders at this branch. Order counts
 * and value are the branch's own slice, so a colleague sees exactly what they
 * need to help the customer in front of them.
 */
export default function EmployeeCustomersPage() {
  useDocumentTitle("Customers — Swarnova Employee");

  const [search, setSearch] = useState("");
  const query = useMemo(() => ({ search: search.trim() || undefined }), [search]);
  const { status, data: customers, error, retry } = useEmployeeCustomers(query);

  return (
    <>
      <PageHeader
        eyebrow="My Work · Customers"
        title="Customers"
        description="The guests your boutique looks after — contact details, membership and their history with this branch."
      />

      <div className="mt-6 space-y-5">
        <FilterBar
          searchLabel="Search customers"
          searchPlaceholder="Name, phone, email or city…"
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
              Adjust the search — or clear it to see everyone this boutique has
              served.
            </EmptyState>
          ) : (
            <Table
              caption="Branch customers"
              hideCaption
              headers={[
                { label: "Customer" },
                { label: "Contact" },
                { label: "City" },
                { label: "Tier" },
                { label: "Orders", align: "center" },
                { label: "Spent Here", align: "right" },
                { label: "Last Order" },
                { label: "", align: "right" },
              ]}
            >
              {customers.map((customer) => (
                <Table.Row key={customer.id}>
                  <Table.Cell>
                    <Link
                      to={`/employee/customers/${customer.id}`}
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
                      {customer.phone}
                    </span>
                    <span className="block font-sans text-caption text-text-muted">
                      {customer.email}
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
                  <Table.Cell align="right">{formatter.format(customer.totalSpent)}</Table.Cell>
                  <Table.Cell className="text-caption text-text-muted">
                    {customer.lastOrderAt ? formatDate(customer.lastOrderAt) : "—"}
                  </Table.Cell>
                  <Table.Cell align="right">
                    <Button variant="ghost" size="sm" to={`/employee/customers/${customer.id}`}>
                      Open
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
