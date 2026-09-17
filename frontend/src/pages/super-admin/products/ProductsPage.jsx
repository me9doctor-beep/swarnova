import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import Button from "../../../components/ui/Button.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import AsyncBoundary from "../../../components/ui/AsyncBoundary.jsx";
import Table from "../../../components/ui/Table.jsx";
import FilterBar from "../../../components/super-admin/FilterBar.jsx";
import { useGovernanceProducts } from "../../../hooks/useGovernanceProducts.js";
import { useGovernanceCategories } from "../../../hooks/useGovernanceCatalogue.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import {
  AVAILABILITY_META,
  AVAILABILITY_OPTIONS,
  PRODUCT_STATUS_META,
  PRODUCT_STATUS_OPTIONS,
} from "../../../features/super-admin/governance.js";
import { formatDate } from "../../../utils/format.js";

/**
 * PRODUCT GOVERNANCE — the catalogue list.
 *
 * One table answers the four questions a Super Admin asks of products:
 * what exists, what state it's in, what it costs, and what to do next.
 * Filters sync to the URL (?status=submitted) so the command centre can
 * deep-link the review queue and any view can be shared.
 *
 * Only three row actions exist, each with one clear destination:
 * View (read the piece) · Review (decide it, in-review only) · Edit.
 * Lifecycle decisions happen on the detail screen — never from a crowded
 * row menu.
 */
export default function ProductsPage() {
  useDocumentTitle("Products — Swarnova Super Admin");

  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "all");
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("categoryId") ?? "all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");

  /* A deep-link change (e.g. from the dashboard) refreshes the filter. */
  useEffect(() => {
    setStatusFilter(searchParams.get("status") ?? "all");
    setCategoryFilter(searchParams.get("categoryId") ?? "all");
  }, [searchParams]);

  const query = useMemo(
    () => ({
      search: search.trim() || undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
      categoryId: categoryFilter === "all" ? undefined : categoryFilter,
      availability: availabilityFilter === "all" ? undefined : availabilityFilter,
    }),
    [search, statusFilter, categoryFilter, availabilityFilter]
  );

  const { status, data: products, error, retry } = useGovernanceProducts(query);
  const categories = useGovernanceCategories();

  const categoryOptions = [
    { value: "all", label: "All categories" },
    ...(categories.data ?? []).map((category) => ({
      value: category.id,
      label: category.name,
    })),
  ];

  return (
    <>
      <PageHeader
        eyebrow="Product Governance"
        title="Products"
        description="The one canonical catalogue. Draft → Submit → Review → Approve → Publish — nothing in between."
        actions={
          <Button size="sm" href="/super-admin/products/new">
            New Product
          </Button>
        }
      />

      <div className="mt-6">
        <FilterBar
          searchLabel="Search products"
          searchPlaceholder="Name, SKU or id…"
          searchValue={search}
          onSearchChange={setSearch}
          filters={[
            {
              id: "category",
              label: "Category",
              value: categoryFilter,
              onChange: setCategoryFilter,
              options: categoryOptions,
            },
            {
              id: "status",
              label: "Status",
              value: statusFilter,
              onChange: setStatusFilter,
              options: PRODUCT_STATUS_OPTIONS,
            },
            {
              id: "availability",
              label: "Availability",
              value: availabilityFilter,
              onChange: setAvailabilityFilter,
              options: AVAILABILITY_OPTIONS,
            },
          ]}
        />
      </div>

      <div className="mt-6">
        <AsyncBoundary
          status={status === "loading" ? "loading" : status === "error" ? "error" : "success"}
          error={error}
          onRetry={retry}
          errorMessage="Products could not be loaded. Please try again."
        >
          {!products || products.length === 0 ? (
            <EmptyState
              title="No products match"
              action={
                <Button size="sm" href="/super-admin/products/new">
                  Create a Product Draft
                </Button>
              }
            >
              Nothing in the catalogue matches these filters. Adjust the
              filters, or start a new product draft.
            </EmptyState>
          ) : (
            <Table
              caption={`Product catalogue — ${products.length} ${products.length === 1 ? "product" : "products"}`}
              hideCaption
              headers={[
                { label: "Product" },
                { label: "Category" },
                { label: "Price", align: "right" },
                { label: "Status" },
                { label: "Availability" },
                { label: "Updated" },
                { label: "Actions", align: "right" },
              ]}
            >
              {products.map((product) => {
                const statusMeta = PRODUCT_STATUS_META[product.status] ?? PRODUCT_STATUS_META.draft;
                const availabilityMeta =
                  AVAILABILITY_META[product.availability] ?? AVAILABILITY_META.available;
                return (
                  <Table.Row key={product.id}>
                    <Table.Cell>
                      <div className="flex items-center gap-3">
                        <span className="h-12 w-12 shrink-0 overflow-hidden bg-surface-secondary">
                          {product.images?.[0]?.src ? (
                            <img
                              src={product.images[0].src}
                              alt=""
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <span
                              role="img"
                              aria-label="No image"
                              className="flex h-full w-full items-center justify-center font-sans text-label uppercase text-text-muted"
                            >
                              None
                            </span>
                          )}
                        </span>
                        <span className="min-w-0">
                          <Link
                            to={`/super-admin/products/${product.id}`}
                            className="block truncate font-sans text-body-sm font-medium text-text-primary underline-offset-4 transition-colors duration-200 hover:text-brand-primary hover:underline"
                          >
                            {product.name || "Untitled piece"}
                          </Link>
                          <span className="block font-sans text-caption text-text-muted">
                            {product.id} · {product.sku || "No SKU"}
                          </span>
                        </span>
                      </div>
                    </Table.Cell>
                    <Table.Cell>{product.categoryName ?? "—"}</Table.Cell>
                    <Table.Cell align="right" className="whitespace-nowrap">
                      {typeof product.price === "number" ? (
                        <span className="font-sans text-price text-text-primary">
                          <span className="mr-0.5 font-light">₹</span>
                          {product.price.toLocaleString("en-IN")}
                        </span>
                      ) : (
                        <span className="font-sans text-caption text-state-warning">Unset</span>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <Badge variant={statusMeta.variant} dot>
                        {statusMeta.label}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="font-sans text-caption text-text-secondary">
                        {availabilityMeta.label}
                      </span>
                    </Table.Cell>
                    <Table.Cell className="whitespace-nowrap text-caption text-text-muted">
                      {formatDate(product.governance?.updatedAt)}
                    </Table.Cell>
                    <Table.Cell align="right">
                      <span className="inline-flex items-center gap-3 whitespace-nowrap font-sans text-label uppercase tracking-[0.14em]">
                        <RowLink to={`/super-admin/products/${product.id}`}>View</RowLink>
                        {product.status === "submitted" ? (
                          <RowLink to={`/super-admin/products/${product.id}`}>Review</RowLink>
                        ) : null}
                        <RowLink to={`/super-admin/products/${product.id}/edit`}>Edit</RowLink>
                      </span>
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

function RowLink({ to, children }) {
  return (
    <Link
      to={to}
      className="text-brand-primary transition-colors duration-200 hover:text-brand-accent-strong hover:underline underline-offset-4"
    >
      {children}
    </Link>
  );
}
