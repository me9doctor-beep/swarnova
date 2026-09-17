import { Link, useParams } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import Button from "../../../components/ui/Button.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import AsyncBoundary from "../../../components/ui/AsyncBoundary.jsx";
import ReadinessPanel from "../../../components/super-admin/ReadinessPanel.jsx";
import ProductGovernanceActions from "../../../components/super-admin/ProductGovernanceActions.jsx";
import { useGovernanceProduct } from "../../../hooks/useGovernanceProducts.js";
import { useGovernanceMutation } from "../../../hooks/useGovernanceMutation.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { productGovernanceService } from "../../../services/governanceService.js";
import {
  AVAILABILITY_META,
  PRODUCT_STATUS_META,
} from "../../../features/super-admin/governance.js";
import { formatDateTime } from "../../../utils/format.js";

/**
 * PRODUCT GOVERNANCE DETAIL — read, review and decide one product.
 *
 * The review experience in three places:
 *   1. the piece itself — media, description, catalogue facts
 *   2. readiness — the provider's own checklist of what publish requires
 *   3. lifecycle — current state, history, and the actions valid right now
 *
 * Everything the reviewer checks is on one screen; nothing is manual that
 * the model can answer.
 */
export default function ProductDetailPage() {
  const { id } = useParams();
  const { status, data: product, error, retry } = useGovernanceProduct(id);
  const mutation = useGovernanceMutation();

  useDocumentTitle(
    product?.name ? `${product.name} — Products — Swarnova Super Admin` : "Product — Swarnova Super Admin"
  );

  const transition = async (action, payload) => {
    await mutation.run(productGovernanceService.transition, id, action, payload);
    retry();
  };

  const statusMeta = product
    ? PRODUCT_STATUS_META[product.status] ?? PRODUCT_STATUS_META.draft
    : null;

  return (
    <>
      <PageHeader
        eyebrow="Product Governance"
        title={product?.name ?? "Product"}
        description={
          product
            ? `${product.id} · ${product.sku || "No SKU"} · ${statusMeta.description}`
            : "The piece, its readiness and its lifecycle controls."
        }
        actions={
          product ? (
            <>
              {product.status === "published" && product.href ? (
                <Button variant="secondary" size="sm" href={product.href}>
                  <ExternalLink size={14} strokeWidth={1.5} aria-hidden="true" />
                  View on Storefront
                </Button>
              ) : null}
              <Button variant="outline" size="sm" href={`/super-admin/products/${product.id}/edit`}>
                Edit Product
              </Button>
            </>
          ) : null
        }
      />

      <AsyncBoundary
        status={status === "loading" ? "loading" : status === "error" ? "error" : "success"}
        error={error}
        onRetry={retry}
        errorMessage="This product could not be loaded."
      >
        {!product ? (
          <EmptyState
            title="This product could not be found"
            action={
              <Button size="sm" href="/super-admin/products">
                Back to Products
              </Button>
            }
          >
            The catalogue holds no product with the id “{id}”. It may have
            been removed, or the link may be out of date.
          </EmptyState>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
            {/* ---------- The piece ------------------------------------ */}
            <div className="space-y-6">
              <section
                aria-label="Product media"
                className="border border-border-default bg-surface-primary p-panel"
              >
                <h2 className="font-sans text-label uppercase tracking-[0.22em] text-text-secondary">
                  Media
                </h2>
                {product.images?.[0]?.src ? (
                  <div className="mt-4 space-y-3">
                    <div className="overflow-hidden bg-surface-secondary">
                      <img
                        src={product.images[0].src}
                        alt={product.images[0].alt ?? `${product.name} primary image`}
                        className="max-h-[420px] w-full object-cover"
                      />
                    </div>
                    <p className="font-sans text-caption text-text-muted">
                      Primary image · gallery of {product.images.length}{" "}
                      {product.images.length === 1 ? "image" : "images"}
                    </p>
                  </div>
                ) : (
                  <p className="mt-4 border border-dashed border-border-default bg-surface-secondary px-5 py-8 text-center font-sans text-body-sm text-text-muted">
                    No image is attached to this product yet. Attach one from
                    the{" "}
                    <Link to="/super-admin/media" className="text-brand-primary underline underline-offset-4">
                      media library
                    </Link>
                    .
                  </p>
                )}
              </section>

              <section
                aria-label="Product description"
                className="border border-border-default bg-surface-primary p-panel"
              >
                <h2 className="font-sans text-label uppercase tracking-[0.22em] text-text-secondary">
                  Description
                </h2>
                <p className="mt-4 font-serif text-body leading-relaxed text-text-primary">
                  {product.description || "No description yet."}
                </p>
              </section>

              <section
                aria-label="Catalogue facts"
                className="border border-border-default bg-surface-primary p-panel"
              >
                <h2 className="font-sans text-label uppercase tracking-[0.22em] text-text-secondary">
                  Catalogue Facts
                </h2>
                <dl className="mt-4 grid grid-cols-1 gap-x-8 sm:grid-cols-2">
                  <Fact label="Category" value={product.categoryName ?? "—"} />
                  <Fact label="Collection" value={product.collectionName ?? "—"} />
                  <Fact label="Purity" value={product.purity ?? "—"} />
                  <Fact label="Weight" value={product.weight || "—"} />
                  <Fact
                    label="Price"
                    value={
                      typeof product.price === "number"
                        ? `₹ ${product.price.toLocaleString("en-IN")}`
                        : "Not set"
                    }
                  />
                  <Fact label="Currency" value={product.currency ?? "INR"} />
                  <Fact
                    label="Availability"
                    value={(AVAILABILITY_META[product.availability] ?? AVAILABILITY_META.available).label}
                  />
                  <Fact
                    label="Discovery"
                    value={
                      [
                        product.featured && "Featured",
                        product.bestseller && "Bestseller",
                        product.tryOnAvailable && "Try-On available",
                      ]
                        .filter(Boolean)
                        .join(" · ") || "Standard listing"
                    }
                  />
                </dl>
              </section>
            </div>

            {/* ---------- Governance -------------------------------------- */}
            <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              <section
                aria-label="Lifecycle state"
                className="border border-border-default bg-surface-primary p-panel"
              >
                <div className="flex items-center justify-between gap-4">
                  <h2 className="font-sans text-label uppercase tracking-[0.22em] text-text-secondary">
                    Lifecycle
                  </h2>
                  <Badge variant={statusMeta.variant} dot>
                    {statusMeta.label}
                  </Badge>
                </div>

                {product.governance?.rejection ? (
                  <div
                    role="alert"
                    className="mt-4 border border-state-error/30 bg-state-error-soft px-4 py-3"
                  >
                    <p className="font-sans text-label uppercase text-state-error">
                      Rejected — {formatDateTime(product.governance.rejection.at)}
                    </p>
                    <p className="mt-1.5 font-sans text-body-sm text-text-primary">
                      {product.governance.rejection.reason}
                    </p>
                  </div>
                ) : null}

                <dl className="mt-5 space-y-0">
                  <HistoryRow label="Created by" value={product.governance?.createdBy ?? "—"} />
                  <HistoryRow label="Last updated" value={formatDateTime(product.governance?.updatedAt)} />
                  <HistoryRow label="Submitted" value={formatDateTime(product.governance?.submittedAt)} />
                  <HistoryRow label="Approved" value={formatDateTime(product.governance?.approvedAt)} />
                  <HistoryRow label="Published" value={formatDateTime(product.governance?.publishedAt)} />
                </dl>

                <div className="mt-5 border-t border-border-subtle pt-5">
                  <ProductGovernanceActions
                    product={product}
                    onTransition={transition}
                    busy={mutation.busy}
                    error={mutation.error}
                  />
                </div>
              </section>

              <ReadinessPanel readiness={product.readiness} />
            </div>
          </div>
        )}
      </AsyncBoundary>
    </>
  );
}

function Fact({ label, value }) {
  return (
    <div className="border-b border-border-subtle py-2.5">
      <dt className="font-sans text-label uppercase tracking-[0.16em] text-text-muted">{label}</dt>
      <dd className="mt-0.5 font-sans text-body-sm text-text-primary">{value}</dd>
    </div>
  );
}

function HistoryRow({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border-subtle py-2">
      <dt className="font-sans text-label uppercase tracking-[0.16em] text-text-muted">{label}</dt>
      <dd className="font-sans text-caption text-text-primary">{value}</dd>
    </div>
  );
}
