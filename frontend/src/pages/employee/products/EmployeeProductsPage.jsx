import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import Button from "../../../components/ui/Button.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import AsyncBoundary from "../../../components/ui/AsyncBoundary.jsx";
import Table from "../../../components/ui/Table.jsx";
import FilterBar from "../../../components/super-admin/FilterBar.jsx";
import { useEmployeeCatalogue } from "../../../hooks/useEmployeeOperations.js";
import { useEmployeeCategories } from "../../../hooks/useEmployeeOperations.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { useCapability } from "../../../features/authentication/useCapability.js";
import { CAPABILITIES } from "../../../features/authentication/capabilities.js";
import { STOCK_FILTER_OPTIONS, STOCK_STATE_META } from "../../../features/admin/operations.js";
import { AVAILABILITY_META, AVAILABILITY_OPTIONS } from "../../../features/super-admin/governance.js";
import { formatter } from "../../../components/ui/Price.jsx";

/**
 * CATALOGUE LOOKUP (Phase 10)
 * -----------------------------------------------------------------------------
 * What a counter colleague needs about a piece: what it is, its SKU, its
 * price, whether the house can supply it — and, when the account also holds
 * inventory visibility, its position on this branch's floor. Drafts and
 * governance states never appear here: employees operate the catalogue, they
 * do not govern it.
 */
export default function EmployeeProductsPage() {
  useDocumentTitle("Products — Swarnova Employee");

  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("categoryId") ?? "all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState(searchParams.get("stock") ?? "all");
  const { can: canDo } = useCapability();
  const canSeeStock = canDo(CAPABILITIES.INVENTORY_VIEW);

  useEffect(() => {
    setCategoryFilter(searchParams.get("categoryId") ?? "all");
  }, [searchParams]);

  const query = useMemo(
    () => ({
      search: search.trim() || undefined,
      categoryId: categoryFilter === "all" ? undefined : categoryFilter,
      availability: availabilityFilter === "all" ? undefined : availabilityFilter,
      stock: canSeeStock && stockFilter !== "all" ? stockFilter : undefined,
    }),
    [search, categoryFilter, availabilityFilter, stockFilter, canSeeStock]
  );

  const { status, data: products, error, retry } = useEmployeeCatalogue(query);
  const categories = useEmployeeCategories();

  const categoryOptions = [
    { value: "all", label: "All categories" },
    ...(categories.data ?? []).map((category) => ({
      value: category.id,
      label: category.name,
    })),
  ];

  const filters = [
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
  ];

  /* Branch stock is an inventory capability — the filter only exists for an
     account that can already read the figures. */
  if (canSeeStock) {
    filters.push({
      id: "stock",
      label: "Branch stock",
      value: stockFilter,
      onChange: setStockFilter,
      options: STOCK_FILTER_OPTIONS,
    });
  }

  return (
    <>
      <PageHeader
        eyebrow="My Work · Products"
        title="Products"
        description="Catalogue lookup for the counter — price, purity, availability and what this boutique holds."
      />

      <div className="mt-6 space-y-5">
        <FilterBar
          searchLabel="Search products"
          searchPlaceholder="Name, SKU or product id…"
          searchValue={search}
          onSearchChange={setSearch}
          filters={filters}
        />

        <AsyncBoundary
          status={status === "loading" ? "loading" : status === "error" ? "error" : "success"}
          error={error}
          onRetry={retry}
          errorMessage="The catalogue could not be loaded."
        >
          {!products || products.length === 0 ? (
            <EmptyState title="No pieces match">
              Adjust the search or filters — or clear them to see the whole
              catalogue.
            </EmptyState>
          ) : (
            <Table
              caption="Branch catalogue"
              hideCaption
              headers={[
                { label: "Piece" },
                { label: "Purity" },
                { label: "Price", align: "right" },
                { label: "Availability" },
                ...(canSeeStock
                  ? [
                      { label: "Branch Stock", align: "right" },
                      { label: "State" },
                    ]
                  : []),
                { label: "", align: "right" },
              ]}
            >
              {products.map((product) => {
                const availability =
                  AVAILABILITY_META[product.availability] ?? AVAILABILITY_META.available;
                const stockState = product.stock
                  ? STOCK_STATE_META[product.stock.state] ?? STOCK_STATE_META.ok
                  : null;

                return (
                  <Table.Row key={product.id}>
                    <Table.Cell>
                      <span className="flex items-center gap-3">
                        {product.images?.[0]?.src ? (
                          <img
                            src={product.images[0].src}
                            alt=""
                            loading="lazy"
                            className="h-11 w-11 shrink-0 border border-border-subtle object-cover"
                          />
                        ) : null}
                        <span>
                          <Link
                            to={`/employee/products/${product.id}`}
                            className="block font-sans text-body-sm font-medium text-text-primary transition-colors duration-200 hover:text-brand-primary"
                          >
                            {product.name}
                          </Link>
                          <span className="block font-sans text-caption text-text-muted">
                            {product.sku} · {product.categoryName ?? "—"}
                          </span>
                        </span>
                      </span>
                    </Table.Cell>
                    <Table.Cell className="text-text-secondary">{product.purity}</Table.Cell>
                    <Table.Cell align="right">
                      {product.price != null ? formatter.format(product.price) : "—"}
                    </Table.Cell>
                    <Table.Cell>
                      <Badge variant={availability.variant}>{availability.label}</Badge>
                    </Table.Cell>
                    {canSeeStock ? (
                      <>
                        <Table.Cell align="right">
                          {product.stock ? product.stock.available : "—"}
                        </Table.Cell>
                        <Table.Cell>
                          {stockState ? (
                            <Badge variant={stockState.variant} dot>
                              {stockState.label}
                            </Badge>
                          ) : (
                            <span className="font-sans text-caption text-text-muted">
                              Not stocked
                            </span>
                          )}
                        </Table.Cell>
                      </>
                    ) : null}
                    <Table.Cell align="right">
                      <Button variant="ghost" size="sm" to={`/employee/products/${product.id}`}>
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
