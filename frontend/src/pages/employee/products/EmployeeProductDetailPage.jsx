import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import AsyncBoundary from "../../../components/ui/AsyncBoundary.jsx";
import { useEmployeeProduct } from "../../../hooks/useEmployeeOperations.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { STOCK_STATE_META } from "../../../features/admin/operations.js";
import { AVAILABILITY_META } from "../../../features/super-admin/governance.js";
import { formatter } from "../../../components/ui/Price.jsx";

/**
 * CATALOGUE PIECE (Phase 10)
 * -----------------------------------------------------------------------------
 * One piece as the counter sees it: the media the house shot, the price, the
 * SKU and purity, availability — and, for an account with inventory
 * visibility, exactly what this boutique holds. Read-only: pricing, placement
 * and publishing are governed by head office and the platform owner.
 */
export default function EmployeeProductDetailPage() {
  const { id } = useParams();
  const { status, data: product, error, retry } = useEmployeeProduct(id);

  useDocumentTitle(`${product?.name ?? "Product"} — Swarnova Employee`);

  return (
    <>
      <p className="mb-4">
        <Link
          to="/employee/products"
          className="inline-flex items-center gap-1.5 font-sans text-label uppercase tracking-[0.18em] text-text-secondary transition-colors duration-200 hover:text-brand-primary"
        >
          <ArrowLeft size={12} strokeWidth={1.5} aria-hidden="true" />
          All Products
        </Link>
      </p>

      <AsyncBoundary
        status={status === "loading" ? "loading" : status === "error" ? "error" : "success"}
        error={error}
        onRetry={retry}
        errorMessage="This piece could not be loaded."
      >
        {!product ? (
          <EmptyState title="Piece not found" className="mt-6">
            No published piece matches this reference. It may have been retired
            from the catalogue.
          </EmptyState>
        ) : (
          <>
            {(() => {
              const availability =
                AVAILABILITY_META[product.availability] ?? AVAILABILITY_META.available;
              return (
                <PageHeader
                  eyebrow={`${product.sku} · Products`}
                  title={product.name}
                  description={`${product.purity} · ${product.categoryName ?? "Catalogue"}${
                    product.collectionName ? ` · ${product.collectionName}` : ""
                  }`}
                  actions={<Badge variant={availability.variant}>{availability.label}</Badge>}
                />
              );
            })()}

            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                {product.images?.[0]?.src ? (
                  <img
                    src={product.images[0].src}
                    alt={product.images[0].alt ?? product.name}
                    className="aspect-[4/3] w-full border border-border-default object-cover"
                  />
                ) : (
                  <EmptyState title="No imagery available">
                    This piece has not been photographed yet.
                  </EmptyState>
                )}
                {product.description ? (
                  <section
                    aria-label="About this piece"
                    className="border border-border-default bg-surface-primary p-panel"
                  >
                    <h2 className="font-sans text-label uppercase tracking-[0.22em] text-text-secondary">
                      About This Piece
                    </h2>
                    <p className="mt-3 font-sans text-body-sm text-text-secondary">
                      {product.description}
                    </p>
                  </section>
                ) : null}
              </div>

              <div className="space-y-6">
                <section
                  aria-label="Piece details"
                  className="border border-border-default bg-surface-primary p-panel"
                >
                  <h2 className="font-sans text-label uppercase tracking-[0.22em] text-text-secondary">
                    Details
                  </h2>
                  <dl className="mt-4 space-y-2.5">
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="font-sans text-caption text-text-muted">Price</dt>
                      <dd className="font-sans text-price font-medium text-text-primary">
                        {product.price != null ? formatter.format(product.price) : "On request"}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="font-sans text-caption text-text-muted">SKU</dt>
                      <dd className="font-sans text-caption text-text-primary">{product.sku}</dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="font-sans text-caption text-text-muted">Purity</dt>
                      <dd className="font-sans text-caption text-text-primary">{product.purity}</dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="font-sans text-caption text-text-muted">Weight</dt>
                      <dd className="font-sans text-caption text-text-primary">
                        {product.weight ?? "—"}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="font-sans text-caption text-text-muted">Category</dt>
                      <dd className="font-sans text-caption text-text-primary">
                        {product.categoryName ?? "—"}
                      </dd>
                    </div>
                    {product.tryOnAvailable ? (
                      <div className="flex items-baseline justify-between gap-4">
                        <dt className="font-sans text-caption text-text-muted">Try-On</dt>
                        <dd>
                          <Badge variant="brand">Available</Badge>
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </section>

                {product.stock ? (
                  <section
                    aria-label="Branch stock"
                    className="border border-border-default bg-surface-primary p-panel"
                  >
                    <h2 className="font-sans text-label uppercase tracking-[0.22em] text-text-secondary">
                      At This Boutique
                    </h2>
                    <dl className="mt-4 space-y-2.5">
                      <div className="flex items-baseline justify-between gap-4">
                        <dt className="font-sans text-caption text-text-muted">Available</dt>
                        <dd className="font-sans text-body-sm font-medium text-text-primary">
                          {product.stock.available}
                        </dd>
                      </div>
                      <div className="flex items-baseline justify-between gap-4">
                        <dt className="font-sans text-caption text-text-muted">Reserved</dt>
                        <dd className="font-sans text-caption text-text-primary">
                          {product.stock.reserved}
                        </dd>
                      </div>
                      <div className="flex items-baseline justify-between gap-4">
                        <dt className="font-sans text-caption text-text-muted">Reorder level</dt>
                        <dd className="font-sans text-caption text-text-primary">
                          {product.stock.reorderLevel}
                        </dd>
                      </div>
                      <div className="flex items-baseline justify-between gap-4">
                        <dt className="font-sans text-caption text-text-muted">State</dt>
                        <dd>
                          {(() => {
                            const meta =
                              STOCK_STATE_META[product.stock.state] ?? STOCK_STATE_META.ok;
                            return (
                              <Badge variant={meta.variant} dot>
                                {meta.label}
                              </Badge>
                            );
                          })()}
                        </dd>
                      </div>
                    </dl>
                    <Link
                      to="/employee/inventory"
                      className="mt-5 inline-flex font-sans text-label uppercase tracking-[0.18em] text-brand-primary transition-colors duration-200 hover:text-brand-accent-strong"
                    >
                      Branch inventory
                    </Link>
                  </section>
                ) : null}
              </div>
            </div>
          </>
        )}
      </AsyncBoundary>
    </>
  );
}
