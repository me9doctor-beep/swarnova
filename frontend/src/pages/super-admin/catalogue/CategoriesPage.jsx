import { useState } from "react";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import Button from "../../../components/ui/Button.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import Dialog from "../../../components/ui/Dialog.jsx";
import Input from "../../../components/ui/Input.jsx";
import Select from "../../../components/ui/Select.jsx";
import Textarea from "../../../components/ui/Textarea.jsx";
import Checkbox from "../../../components/ui/Checkbox.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import AsyncBoundary from "../../../components/ui/AsyncBoundary.jsx";
import Table from "../../../components/ui/Table.jsx";
import { useGovernanceCategories } from "../../../hooks/useGovernanceCatalogue.js";
import { useGovernanceProducts } from "../../../hooks/useGovernanceProducts.js";
import { useMediaLibrary } from "../../../hooks/useGovernanceMedia.js";
import { useGovernanceMutation } from "../../../hooks/useGovernanceMutation.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { catalogueGovernanceService } from "../../../services/catalogueGovernanceService.js";

/**
 * CATEGORY GOVERNANCE — view, create, edit and enable/disable categories.
 *
 * Categories answer "what type of jewellery is this?" — a flat, meaningful
 * list, not a nested tree. Each row shows how many canonical products carry
 * the category and whether it is visible on the storefront.
 */
export default function CategoriesPage() {
  useDocumentTitle("Categories — Swarnova Super Admin");

  const { status, data: categories, error, retry } = useGovernanceCategories();
  const products = useGovernanceProducts({});
  const [editing, setEditing] = useState(null); // category | "new" | null

  const countByCategory = (categoryId) =>
    (products.data ?? []).filter((product) => product.categoryId === categoryId).length;

  return (
    <>
      <PageHeader
        eyebrow="Catalogue Governance"
        title="Categories"
        description="The types of jewellery the house sells. Disabling a category hides it from the storefront without touching its products."
        actions={
          <Button size="sm" onClick={() => setEditing("new")}>
            New Category
          </Button>
        }
      />

      <div className="mt-6">
        <AsyncBoundary
          status={status === "loading" ? "loading" : status === "error" ? "error" : "success"}
          error={error}
          onRetry={retry}
          errorMessage="Categories could not be loaded."
        >
          {!categories || categories.length === 0 ? (
            <EmptyState title="No categories yet">Create the first category to organise the catalogue.</EmptyState>
          ) : (
            <Table
              caption="Product categories"
              hideCaption
              headers={[
                { label: "Category" },
                { label: "Slug" },
                { label: "Products", align: "center" },
                { label: "Order", align: "center" },
                { label: "Storefront" },
                { label: "Actions", align: "right" },
              ]}
            >
              {[...categories]
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((category) => (
                  <Table.Row key={category.id}>
                    <Table.Cell>
                      <span className="flex items-center gap-3">
                        <span className="h-10 w-14 shrink-0 overflow-hidden bg-surface-secondary">
                          {category.image?.src ? (
                            <img src={category.image.src} alt="" className="h-full w-full object-cover" loading="lazy" />
                          ) : null}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-sans text-body-sm font-medium text-text-primary">{category.name}</span>
                          <span className="block font-sans text-caption text-text-muted">{category.tagline}</span>
                        </span>
                      </span>
                    </Table.Cell>
                    <Table.Cell className="font-sans text-caption text-text-secondary">/category/{category.slug}</Table.Cell>
                    <Table.Cell align="center">{countByCategory(category.id)}</Table.Cell>
                    <Table.Cell align="center" className="text-caption text-text-muted">{category.order ?? "—"}</Table.Cell>
                    <Table.Cell>
                      <Badge variant={category.enabled !== false ? "success" : "neutral"} dot>
                        {category.enabled !== false ? "Visible" : "Hidden"}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell align="right">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(category)}>
                        Edit
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ))}
            </Table>
          )}
        </AsyncBoundary>
      </div>

      {editing ? (
        <CategoryDialog
          category={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            retry();
          }}
        />
      ) : null}
    </>
  );
}

/* ---------------------------------------------------------------------- */
/* Create / edit dialog                                                    */
/* ---------------------------------------------------------------------- */

function CategoryDialog({ category, onClose, onSaved }) {
  const isNew = !category;
  const library = useMediaLibrary({ kind: "image" });
  const mutation = useGovernanceMutation();

  const [form, setForm] = useState({
    name: category?.name ?? "",
    tagline: category?.tagline ?? "",
    description: category?.description ?? "",
    imageSrc: category?.image?.src ?? "",
    enabled: category?.enabled !== false,
  });
  const [localError, setLocalError] = useState(null);

  const set = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const save = async (event) => {
    event.preventDefault();
    setLocalError(null);
    if (!form.name.trim()) {
      setLocalError("A category name is required.");
      return;
    }
    if (!form.imageSrc) {
      setLocalError("Categories need an image — choose one from the media library.");
      return;
    }
    try {
      if (isNew) {
        await mutation.run(catalogueGovernanceService.createCategory, form);
      } else {
        await mutation.run(catalogueGovernanceService.updateCategory, category.id, form);
      }
      onSaved();
    } catch {
      /* mutation.error carries the provider's message */
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={isNew ? "New Category" : `Edit — ${category.name}`}
      description={isNew ? "Categories organise the catalogue by jewellery type." : `${category.id} · /category/${category.slug}`}
    >
      <form onSubmit={save} className="space-y-4">
        <Input label="Name" required size="sm" value={form.name} onChange={set("name")} />
        <Input label="Tagline" size="sm" value={form.tagline} onChange={set("tagline")} />
        <Textarea label="Description" rows={3} value={form.description} onChange={set("description")} />
        <Select
          label="Category Image"
          required
          size="sm"
          value={form.imageSrc}
          onChange={set("imageSrc")}
        >
          <option value="">Choose from the media library…</option>
          {(library.data ?? []).map((item) => (
            <option key={item.id} value={item.src}>
              {item.id} — {item.name}
            </option>
          ))}
        </Select>
        <Checkbox
          label="Visible on the storefront"
          description="Hidden categories disappear from the homepage and collections pages; their products stay untouched in the catalogue."
          checked={form.enabled}
          onChange={(event) => setForm((prev) => ({ ...prev, enabled: event.target.checked }))}
        />

        {(localError || mutation.error) && (
          <p role="alert" className="border border-state-error/30 bg-state-error-soft px-4 py-3 font-sans text-caption text-state-error">
            {localError ?? mutation.error?.message}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={mutation.busy}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={mutation.busy}>
            {mutation.busy ? "Saving…" : isNew ? "Create Category" : "Save Changes"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
