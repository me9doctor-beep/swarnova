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
import { useCapability } from "../../../features/authentication/useCapability.js";
import { CAPABILITIES } from "../../../features/authentication/capabilities.js";
import {
  AVAILABILITY_META,
  AVAILABILITY_OPTIONS,
  PRODUCT_STATUS_META,
  PRODUCT_STATUS_OPTIONS,
} from "../../../features/super-admin/governance.js";
import { formatter } from "../../../components/ui/Price.jsx";
import { formatDate } from "../../../utils/format.js";

/**
 * PRODUCT OPERATIONS (Phase 9) — the catalogue from the business side.
 *
 * The Admin reads and operates the ONE canonical catalogue the Super Admin
 * governs: search, filter, open a piece, manage availability and pricing,
 * submit for review. Approval and publishing stay with the Super Admin —
 * this screen shows those states, it never performs them.
 */
export default function AdminProductsPage() {
  useDocumentTitle("Products — Swarnova Admin");

  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "all");
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("categoryId") ?? "all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const { can: canDo } = useCapability();

  /* A deep-link change (e.g. from the dashboard) refreshes the filters. */
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
        eyebrow="Business · Catalogue"
        title="Products"
        description="The one canonical catalogue, operated from head office — availability, pricing and placement, with governance status always in view."
      />

      <div className="mt-6 space-y-5">
        <FilterBar
          searchLabel="Search products"
          searchPlaceholder="Name, SKU or product id…"
          searchValue={search}
          onSearchChange={setSearch}
          filters={[
            {
              id: "status",
              label: "Status",
              value: statusFilter,
              onChange: setStatusFilter,
              options: PRODUCT_STATUS_OPTIONS,
            },
            {
              id: "category",
              label: "Category",
              value: categoryFilter,
              onChange: setCategoryFilter,
              options: categoryOptions,
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

        <AsyncBoundary
          status={status === "loading" ? "loading" : status === "error" ? "error" : "success"}
          error={error}
          onRetry={retry}
          errorMessage="Products could not be loaded."
        >
          {!products || products.length === 0 ? (
            <EmptyState title="No products match">
              Adjust the search or filters — or clear them to see the whole
              catalogue.
            </EmptyState>
          ) : (
            <Table
              caption="Catalogue products"
              hideCaption
              headers={[
                { label: "Product" },
                { label: "Category" },
                { label: "Price", align: "right" },
                { label: "Availability" },
                { label: "Status" },
                { label: "Updated" },
                { label: "", align: "right" },
              ]}
            >
              {products.map((product) => {
                const statusMeta = PRODUCT_STATUS_META[product.status] ?? PRODUCT_STATUS_META.draft;
                const availabilityMeta =
                  AVAILABILITY_META[product.availability] ?? AVAILABILITY_META.available;
                return (
                  <Table.Row key={product.id}>
                    <Table.Cell>
                      <span className="flex items-center gap-3">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0].src}
                            alt=""
                            loading="lazy"
                            className="h-11 w-11 shrink-0 border border-border-subtle object-cover"
                          />
                        ) : null}
                        <span>
                          <Link
                            to={`/admin/products/${product.id}`}
                            className="block font-sans text-body-sm font-medium text-text-primary transition-colors duration-200 hover:text-brand-primary"
                          >
                            {product.name || "Untitled piece"}
                          </Link>
                          <span className="block font-sans text-caption text-text-muted">
                            {product.sku || "No SKU"} · {product.id}
                          </span>
                        </span>
                      </span>
                    </Table.Cell>
                    <Table.Cell className="text-text-secondary">
                      {product.categoryName ?? "—"}
                    </Table.Cell>
                    <Table.Cell align="right">
                      {typeof product.price === "number"
                        ? formatter.format(product.price)
                        : "—"}
                    </Table.Cell>
                    <Table.Cell>
                      <Badge variant={availabilityMeta.variant}>
                        {availabilityMeta.label}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge variant={statusMeta.variant} dot>
                        {statusMeta.label}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell className="text-caption text-text-muted">
                      {formatDate(product.governance?.updatedAt)}
                    </Table.Cell>
                    <Table.Cell align="right">
                      <Button variant="ghost" size="sm" to={`/admin/products/${product.id}`}>
                        View
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table>
          )}
        </AsyncBoundary>

        <p className="font-sans text-caption text-text-muted">
          Approvals and publishing remain with the Super Admin.
          {canDo(CAPABILITIES.CATALOGUE_MANAGE)
            ? " You can operate pricing, availability and submit pieces for review."
            : ""}
        </p>
      </div>
    </>
  );
}
