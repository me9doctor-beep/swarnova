import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, PencilLine } from "lucide-react";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import Button from "../../../components/ui/Button.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import Dialog from "../../../components/ui/Dialog.jsx";
import Input from "../../../components/ui/Input.jsx";
import Select from "../../../components/ui/Select.jsx";
import Checkbox from "../../../components/ui/Checkbox.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import AsyncBoundary from "../../../components/ui/AsyncBoundary.jsx";
import ConfirmDialog from "../../../components/super-admin/ConfirmDialog.jsx";
import ReadinessPanel from "../../../components/super-admin/ReadinessPanel.jsx";
import Table from "../../../components/ui/Table.jsx";
import { useGovernanceProduct } from "../../../hooks/useGovernanceProducts.js";
import { useAdminInventory } from "../../../hooks/useAdminOperations.js";
import { useGovernanceMutation } from "../../../hooks/useGovernanceMutation.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { useAuth } from "../../../features/authentication/useAuth.js";
import { useCapability } from "../../../features/authentication/useCapability.js";
import { CAPABILITIES } from "../../../features/authentication/capabilities.js";
import { actorLabel } from "../../../features/authentication/roles.js";
import { productGovernanceService } from "../../../services/governanceService.js";
import {
  AVAILABILITY_META,
  PRODUCT_ACTIONS,
  PRODUCT_STATUS_META,
} from "../../../features/super-admin/governance.js";
import { STOCK_STATE_META } from "../../../features/admin/operations.js";
import { formatter } from "../../../components/ui/Price.jsx";
import { formatDateTime } from "../../../utils/format.js";

/**
 * PRODUCT OPERATIONS DETAIL (Phase 9) — one piece, run from head office.
 *
 * The operational surface only: readiness, pricing, availability,
 * placement flags, stock across branches and the one lifecycle move an
 * Admin owns — Submit for Review. Approve, reject and publish stay with
 * the Super Admin; their state is shown here, never performed.
 */
export default function AdminProductDetailPage() {
  const { id } = useParams();
  const { user, role } = useAuth();
  const { can: canDo } = useCapability();
  const { status, data: product, error, retry } = useGovernanceProduct(id);
  const inventory = useAdminInventory({ productId: id });
  const mutation = useGovernanceMutation();
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(false);

  useDocumentTitle(`${product?.name ?? "Product"} — Swarnova Admin`);

  const canManage = canDo(CAPABILITIES.CATALOGUE_MANAGE);
  const canSubmit = canManage && (product?.actions ?? []).includes("submit");

  const submitForReview = async () => {
    try {
      await mutation.run(
        productGovernanceService.transition,
        product.id,
        "submit",
        {},
        actorLabel(user, role)
      );
      setSubmitting(false);
      retry();
    } catch {
      /* Dialog stays open with the provider's message. */
    }
  };

  return (
    <>
      <p className="mb-4">
        <Link
          to="/admin/products"
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
        errorMessage="This product could not be loaded."
      >
        {!product ? (
          <EmptyState title="Product not found" className="mt-6">
            No catalogue piece matches this id. It may have been removed.
          </EmptyState>
        ) : (
          <>
            {(() => {
              const statusMeta = PRODUCT_STATUS_META[product.status] ?? PRODUCT_STATUS_META.draft;
              return (
                <PageHeader
                  eyebrow={`${product.sku || product.id} · Catalogue`}
                  title={product.name || "Untitled piece"}
                  description={statusMeta.description}
                  actions={
                    <>
                      {canManage ? (
                        <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
                          <PencilLine size={13} strokeWidth={1.5} aria-hidden="true" />
                          Edit Operations
                        </Button>
                      ) : null}
                      {canSubmit ? (
                        <Button size="sm" onClick={() => setSubmitting(true)}>
                          {PRODUCT_ACTIONS.submit.label}
                        </Button>
                      ) : null}
                    </>
                  }
                />
              );
            })()}

            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* ----- Piece ------------------------------------------------ */}
              <div className="space-y-6 lg:col-span-2">
                <section
                  aria-label="Product media and story"
                  className="border border-border-default bg-surface-primary"
                >
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0].src}
                      alt={product.images[0].alt ?? product.name}
                      className="aspect-[16/9] w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[16/9] w-full items-center justify-center bg-surface-secondary">
                      <p className="font-sans text-caption text-text-muted">
                        No image attached yet.
                      </p>
                    </div>
                  )}
                  <div className="p-panel">
                    <h2 className="font-sans text-label uppercase tracking-[0.22em] text-text-secondary">
                      The Piece
                    </h2>
                    <p className="mt-3 font-sans text-body text-text-secondary">
                      {product.description || "No description written yet."}
                    </p>
                    <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-border-subtle pt-5 sm:grid-cols-4">
                      <div>
                        <dt className="font-sans text-label uppercase text-text-muted">Purity</dt>
                        <dd className="mt-1 font-sans text-body-sm text-text-primary">
                          {product.purity || "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-sans text-label uppercase text-text-muted">Weight</dt>
                        <dd className="mt-1 font-sans text-body-sm text-text-primary">
                          {product.weight || "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-sans text-label uppercase text-text-muted">Category</dt>
                        <dd className="mt-1 font-sans text-body-sm text-text-primary">
                          {product.categoryName ?? "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-sans text-label uppercase text-text-muted">Collection</dt>
                        <dd className="mt-1 font-sans text-body-sm text-text-primary">
                          {product.collectionName ?? "—"}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </section>

                {/* ----- Stock across branches ------------------------------ */}
                <section aria-label="Stock across branches" className="space-y-4">
                  <h2 className="font-sans text-label uppercase tracking-[0.24em] text-text-secondary">
                    Stock Across Branches
                  </h2>
                  {(inventory.data ?? []).length === 0 ? (
                    <EmptyState title="No branch stock recorded">
                      No inventory lines exist for this piece yet.
                    </EmptyState>
                  ) : (
                    <Table
                      caption={`Branch stock for ${product.name}`}
                      hideCaption
                      headers={[
                        { label: "Branch" },
                        { label: "Available", align: "right" },
                        { label: "Reserved", align: "right" },
                        { label: "Reorder Level", align: "right" },
                        { label: "State" },
                      ]}
                    >
                      {(inventory.data ?? []).map((row) => {
                        const stockMeta = STOCK_STATE_META[row.state] ?? STOCK_STATE_META.ok;
                        return (
                          <Table.Row key={row.id}>
                            <Table.Cell>{row.branchName}</Table.Cell>
                            <Table.Cell align="right">{row.available}</Table.Cell>
                            <Table.Cell align="right">{row.reserved}</Table.Cell>
                            <Table.Cell align="right">{row.reorderLevel}</Table.Cell>
                            <Table.Cell>
                              <Badge variant={stockMeta.variant} dot>
                                {stockMeta.label}
                              </Badge>
                            </Table.Cell>
                          </Table.Row>
                        );
                      })}
                    </Table>
                  )}
                </section>
              </div>

              {/* ----- Status rail ------------------------------------------ */}
              <div className="space-y-6">
                <section
                  aria-label="Governance status"
                  className="border border-border-default bg-surface-primary p-panel"
                >
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="font-sans text-label uppercase tracking-[0.22em] text-text-secondary">
                      Governance Status
                    </h2>
                    {(() => {
                      const statusMeta =
                        PRODUCT_STATUS_META[product.status] ?? PRODUCT_STATUS_META.draft;
                      return (
                        <Badge variant={statusMeta.variant} dot>
                          {statusMeta.label}
                        </Badge>
                      );
                    })()}
                  </div>

                  <dl className="mt-5 space-y-2.5">
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="font-sans text-caption text-text-muted">Price</dt>
                      <dd className="font-sans text-body-sm text-text-primary">
                        {typeof product.price === "number"
                          ? formatter.format(product.price)
                          : "Not set"}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="font-sans text-caption text-text-muted">Availability</dt>
                      <dd>
                        <Badge
                          variant={
                            (AVAILABILITY_META[product.availability] ?? AVAILABILITY_META.available)
                              .variant
                          }
                        >
                          {(AVAILABILITY_META[product.availability] ?? AVAILABILITY_META.available)
                            .label}
                        </Badge>
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="font-sans text-caption text-text-muted">Last updated</dt>
                      <dd className="font-sans text-caption text-text-primary">
                        {formatDateTime(product.governance?.updatedAt)}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="font-sans text-caption text-text-muted">Created by</dt>
                      <dd className="font-sans text-caption text-text-primary">
                        {product.governance?.createdBy ?? "—"}
                      </dd>
                    </div>
                  </dl>

                  {product.governance?.rejection ? (
                    <p className="mt-4 border border-state-error/30 bg-state-error-soft px-4 py-3 font-sans text-caption text-state-error">
                      Rejected: {product.governance.rejection.reason}
                    </p>
                  ) : null}

                  <p className="mt-4 border-t border-border-subtle pt-4 font-sans text-caption text-text-muted">
                    {product.status === "submitted"
                      ? "Waiting in the Super Admin review queue."
                      : product.status === "approved"
                        ? "Approved — publishing is a Super Admin action."
                        : product.status === "published"
                          ? "Live on the storefront. Approve and publish remain Super Admin actions."
                          : "Submit for review when the piece is ready; approval and publishing stay with the Super Admin."}
                  </p>
                </section>

                <ReadinessPanel readiness={product.readiness} />
              </div>
            </div>

            {/* ----- Dialogs ------------------------------------------------ */}
            <ConfirmDialog
              open={submitting}
              onClose={() => setSubmitting(false)}
              onConfirm={submitForReview}
              title={PRODUCT_ACTIONS.submit.confirmTitle}
              body={PRODUCT_ACTIONS.submit.confirmBody}
              confirmLabel={PRODUCT_ACTIONS.submit.confirmLabel}
              confirmVariant="primary"
              busy={mutation.busy}
              error={mutation.error}
            />

            {editing ? (
              <OperationalEditDialog
                product={product}
                onClose={() => setEditing(false)}
                onSaved={() => {
                  setEditing(false);
                  retry();
                }}
              />
            ) : null}
          </>
        )}
      </AsyncBoundary>
    </>
  );
}

/**
 * Operational product edits — pricing, availability and storefront
 * placement flags. Deliberately narrower than the Super Admin editor: no
 * identity fields, no media, no lifecycle.
 */
function OperationalEditDialog({ product, onClose, onSaved }) {
  const { user, role } = useAuth();
  const mutation = useGovernanceMutation();
  const [form, setForm] = useState({
    price: product.price != null ? String(product.price) : "",
    availability: product.availability ?? "available",
    featured: Boolean(product.featured),
    bestseller: Boolean(product.bestseller),
  });
  const [localError, setLocalError] = useState(null);

  const save = async (event) => {
    event.preventDefault();
    setLocalError(null);

    const price = Number(form.price);
    if (form.price.trim() === "" || !Number.isFinite(price) || price <= 0) {
      setLocalError("Enter a valid price in whole rupees.");
      return;
    }

    try {
      await mutation.run(
        productGovernanceService.updateProduct,
        product.id,
        {
          price: Math.round(price),
          availability: form.availability,
          featured: form.featured,
          bestseller: form.bestseller,
        },
        actorLabel(user, role)
      );
      onSaved();
    } catch {
      /* mutation.error carries the provider's message */
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title="Edit Operational Details"
      description={`${product.id} · pricing, availability and placement only`}
    >
      <form onSubmit={save} className="space-y-4">
        <Input
          label="Price (INR)"
          required
          size="sm"
          inputMode="numeric"
          value={form.price}
          onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
          hint="Whole rupees — the storefront shows it with Indian formatting."
        />
        <Select
          label="Availability"
          size="sm"
          value={form.availability}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, availability: event.target.value }))
          }
        >
          <option value="available">Available</option>
          <option value="limited">Limited</option>
          <option value="unavailable">Unavailable</option>
        </Select>
        <div className="space-y-2">
          <Checkbox
            label="Featured on the storefront"
            description="Shows in the homepage featured placement."
            checked={form.featured}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, featured: event.target.checked }))
            }
          />
          <Checkbox
            label="Marked as a bestseller"
            description="Carries the bestseller flag across the catalogue."
            checked={form.bestseller}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, bestseller: event.target.checked }))
            }
          />
        </div>

        {(localError || mutation.error) && (
          <p
            role="alert"
            className="border border-state-error/30 bg-state-error-soft px-4 py-3 font-sans text-caption text-state-error"
          >
            {localError ?? mutation.error?.message}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={mutation.busy}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={mutation.busy}>
            {mutation.busy ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
