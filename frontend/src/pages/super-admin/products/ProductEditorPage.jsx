import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import Button from "../../../components/ui/Button.jsx";
import Input from "../../../components/ui/Input.jsx";
import Select from "../../../components/ui/Select.jsx";
import Textarea from "../../../components/ui/Textarea.jsx";
import Checkbox from "../../../components/ui/Checkbox.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import AsyncBoundary from "../../../components/ui/AsyncBoundary.jsx";
import { useGovernanceProduct } from "../../../hooks/useGovernanceProducts.js";
import { useGovernanceCategories, useGovernanceCollections } from "../../../hooks/useGovernanceCatalogue.js";
import { useMediaLibrary } from "../../../hooks/useGovernanceMedia.js";
import { useGovernanceMutation } from "../../../hooks/useGovernanceMutation.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { productGovernanceService } from "../../../services/governanceService.js";
import { PURITY_OPTIONS, PRODUCT_STATUS_META } from "../../../features/super-admin/governance.js";

/**
 * PRODUCT EDITOR — compose or amend a product.
 *
 * The whole editor is a single form grouped into the five sections a Super
 * Admin thinks in: Product Information, Jewellery Details, Pricing, Media
 * and Discovery. Saving preserves the product's lifecycle state — the
 * lifecycle is decided on the detail screen, not by editing.
 *
 * Fields map one-to-one to the provider's EDITABLE_FIELDS contract; anything
 * the model does not carry is not invented here.
 */
const EMPTY_FORM = {
  name: "",
  sku: "",
  description: "",
  categoryId: "",
  collectionId: "",
  purity: "22K",
  weight: "",
  price: "",
  currency: "INR",
  availability: "available",
  imageSrc: "",
  featured: false,
  bestseller: false,
  tryOnAvailable: false,
};

export default function ProductEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;

  useDocumentTitle(
    isNew ? "New Product — Swarnova Super Admin" : "Edit Product — Swarnova Super Admin"
  );

  const [form, setForm] = useState(EMPTY_FORM);
  const [galleryImages, setGalleryImages] = useState([]);
  const [hydrated, setHydrated] = useState(isNew);

  const existing = useGovernanceProduct(id ?? "__none__");
  const categories = useGovernanceCategories();
  const collections = useGovernanceCollections();
  const mediaLibrary = useMediaLibrary({ kind: "image" });
  const mutation = useGovernanceMutation();

  /* Hydrate the form once the product arrives (edit mode only). */
  useEffect(() => {
    if (isNew || hydrated || existing.status !== "success") return;
    if (!existing.data) return;
    const product = existing.data;
    setForm({
      name: product.name ?? "",
      sku: product.sku ?? "",
      description: product.description ?? "",
      categoryId: product.categoryId ?? "",
      collectionId: product.collectionId ?? "",
      purity: product.purity ?? "22K",
      weight: product.weight ?? "",
      price: typeof product.price === "number" ? String(product.price) : "",
      currency: product.currency ?? "INR",
      availability: product.availability ?? "available",
      imageSrc: product.images?.[0]?.src ?? "",
      featured: Boolean(product.featured),
      bestseller: Boolean(product.bestseller),
      tryOnAvailable: Boolean(product.tryOnAvailable),
    });
    setGalleryImages((product.images ?? []).slice(1));
    setHydrated(true);
  }, [isNew, hydrated, existing.status, existing.data]);

  const set = (field) => (event) =>
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  const setChecked = (field) => (event) =>
    setForm((prev) => ({ ...prev, [field]: event.target.checked }));

  const save = async () => {
    const priceNumber = Number(String(form.price).replace(/[₹,\s]/g, ""));
    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      description: form.description.trim(),
      categoryId: form.categoryId,
      collectionId: form.collectionId,
      purity: form.purity,
      weight: form.weight.trim(),
      price: Number.isFinite(priceNumber) && priceNumber > 0 ? priceNumber : null,
      currency: form.currency,
      availability: form.availability,
      featured: form.featured,
      bestseller: form.bestseller,
      tryOnAvailable: form.tryOnAvailable,
      /* Replacing the primary image never discards the gallery. */
      images: form.imageSrc
        ? [{ src: form.imageSrc, alt: form.name.trim() || "Product image" }, ...galleryImages]
        : [...galleryImages],
    };

    const saved = isNew
      ? await mutation.run(productGovernanceService.createProduct, payload)
      : await mutation.run(productGovernanceService.updateProduct, id, payload);

    navigate(`/super-admin/products/${saved.id}`, { replace: isNew });
  };

  const mediaOptions = (mediaLibrary.data ?? []).map((item) => ({
    value: item.src,
    label: `${item.id} — ${item.name}`,
  }));
  const selectedMedia = (mediaLibrary.data ?? []).find((item) => item.src === form.imageSrc);

  if (!isNew && existing.status === "success" && !existing.data) {
    return (
      <>
        <PageHeader eyebrow="Product Governance" title="Edit Product" />
        <p className="mt-6 font-sans text-body-sm text-text-secondary">
          No product with the id “{id}” exists.{" "}
          <Button variant="link" href="/super-admin/products">
            Back to Products
          </Button>
        </p>
      </>
    );
  }

  if (!isNew && existing.status !== "success") {
    return (
      <>
        <PageHeader eyebrow="Product Governance" title="Edit Product" />
        <AsyncBoundary
          status={existing.status === "loading" ? "loading" : "error"}
          error={existing.error}
          onRetry={existing.retry}
          errorMessage="The product could not be loaded for editing."
        />
      </>
    );
  }

  const statusMeta = !isNew && existing.data
    ? PRODUCT_STATUS_META[existing.data.status] ?? PRODUCT_STATUS_META.draft
    : null;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        save().catch(() => {});
      }}
    >
      <PageHeader
        eyebrow="Product Governance"
        title={isNew ? "New Product" : `Edit — ${form.name || "Untitled piece"}`}
        description={
          isNew
            ? "A new product starts as a draft. Complete it, save, then submit it for review from the product screen."
            : "Saving keeps the product in its current lifecycle state. Decisions — submit, review, publish — happen on the product screen."
        }
        actions={
          <div className="flex items-center gap-3">
            {statusMeta ? <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge> : null}
            <Button type="submit" size="sm" disabled={mutation.busy}>
              {mutation.busy ? "Saving…" : isNew ? "Create Draft" : "Save Changes"}
            </Button>
          </div>
        }
      />

      {mutation.error ? (
        <p role="alert" className="mt-6 border border-state-error/30 bg-state-error-soft px-5 py-3 font-sans text-body-sm text-state-error">
          {mutation.error.message}
        </p>
      ) : null}

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="space-y-6">
          <FormSection title="Product Information">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Product Name" required value={form.name} onChange={set("name")} size="sm" />
              <Input label="SKU" required value={form.sku} onChange={set("sku")} size="sm" placeholder="SWN-XXX-000" />
              <Select label="Category" required value={form.categoryId} onChange={set("categoryId")} size="sm">
                <option value="">Choose a category…</option>
                {(categories.data ?? []).map((category) => (
                  <option key={category.id} value={category.id} disabled={category.enabled === false}>
                    {category.name}
                    {category.enabled === false ? " (disabled)" : ""}
                  </option>
                ))}
              </Select>
              <Select label="Collection" value={form.collectionId} onChange={set("collectionId")} size="sm">
                <option value="">No collection</option>
                {(collections.data ?? []).map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.name}
                  </option>
                ))}
              </Select>
            </div>
            <Textarea
              label="Description"
              required
              rows={4}
              value={form.description}
              onChange={set("description")}
              hint="The piece's story — one or two sentences in the house voice."
            />
          </FormSection>

          <FormSection title="Jewellery Details">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select label="Purity" required value={form.purity} onChange={set("purity")} size="sm">
                {PURITY_OPTIONS.map((purity) => (
                  <option key={purity} value={purity}>
                    {purity}
                  </option>
                ))}
              </Select>
              <Input
                label="Weight"
                required
                value={form.weight}
                onChange={set("weight")}
                size="sm"
                placeholder="e.g. 8.6 g"
              />
            </div>
          </FormSection>

          <FormSection title="Pricing">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Price (INR, whole rupees)"
                required
                inputMode="numeric"
                value={form.price}
                onChange={set("price")}
                size="sm"
                placeholder="e.g. 72400"
              />
              <Input label="Currency" value={form.currency} readOnly size="sm" />
            </div>
          </FormSection>
        </div>

        <div className="space-y-6 lg:self-start">
          <FormSection title="Media">
            <Select
              label="Primary Image"
              value={form.imageSrc}
              onChange={set("imageSrc")}
              size="sm"
            >
              <option value="">No image attached</option>
              {mediaOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            {form.imageSrc ? (
              <div className="overflow-hidden bg-surface-secondary">
                <img
                  src={form.imageSrc}
                  alt={selectedMedia?.alt ?? "Selected primary image preview"}
                  className="max-h-52 w-full object-cover"
                />
              </div>
            ) : (
              <p className="border border-dashed border-border-default bg-surface-secondary px-4 py-6 text-center font-sans text-caption text-text-muted">
                Attach the primary image from the media library. Upload new
                images on the Media screen.
              </p>
            )}
          </FormSection>

          <FormSection title="Availability">
            <Select label="Availability" value={form.availability} onChange={set("availability")} size="sm">
              <option value="available">Available</option>
              <option value="limited">Limited</option>
              <option value="unavailable">Unavailable</option>
            </Select>
          </FormSection>

          <FormSection title="Discovery">
            <div className="space-y-2">
              <Checkbox
                label="Featured"
                description="May appear in editorial homepage placements."
                checked={form.featured}
                onChange={setChecked("featured")}
              />
              <Checkbox
                label="Bestseller"
                description="Appears in the Customer Favourites query."
                checked={form.bestseller}
                onChange={setChecked("bestseller")}
              />
              <Checkbox
                label="Virtual Try-On Available"
                description="Customers can wear this piece in the fitting room."
                checked={form.tryOnAvailable}
                onChange={setChecked("tryOnAvailable")}
              />
            </div>
          </FormSection>

          <div className="flex flex-col gap-2 border border-border-default bg-surface-primary p-panel sm:flex-row sm:justify-end">
            <Button variant="secondary" size="sm" href={isNew ? "/super-admin/products" : `/super-admin/products/${id}`}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={mutation.busy}>
              {mutation.busy ? "Saving…" : isNew ? "Create Draft" : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

function FormSection({ title, subtitle, children }) {
  return (
    <section
      aria-label={title}
      className="space-y-4 border border-border-default bg-surface-primary p-panel"
    >
      <div>
        <h2 className="font-sans text-label uppercase tracking-[0.22em] text-text-secondary">{title}</h2>
        {subtitle ? <p className="mt-1 font-sans text-caption text-text-muted">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}
