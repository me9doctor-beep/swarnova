import { useState } from "react";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import Button from "../../../components/ui/Button.jsx";
import Dialog from "../../../components/ui/Dialog.jsx";
import Input from "../../../components/ui/Input.jsx";
import Textarea from "../../../components/ui/Textarea.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import AsyncBoundary from "../../../components/ui/AsyncBoundary.jsx";
import Table from "../../../components/ui/Table.jsx";
import { useGovernanceCollections } from "../../../hooks/useGovernanceCatalogue.js";
import { useGovernanceProducts } from "../../../hooks/useGovernanceProducts.js";
import { useGovernanceMutation } from "../../../hooks/useGovernanceMutation.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { catalogueGovernanceService } from "../../../services/catalogueGovernanceService.js";

/**
 * COLLECTION GOVERNANCE — the curated editorial groupings.
 *
 * Categories say what kind of jewellery a piece is; collections say which
 * curated story it belongs to (Vadhu Bridal, Virasat Heritage…). Small
 * surface on purpose: name, description, and how many pieces carry it.
 */
export default function CollectionsGovernancePage() {
  useDocumentTitle("Collections — Swarnova Super Admin");

  const { status, data: collections, error, retry } = useGovernanceCollections();
  const products = useGovernanceProducts({});
  const [editing, setEditing] = useState(null); // collection | "new" | null

  const countByCollection = (collectionId) =>
    (products.data ?? []).filter((product) => product.collectionId === collectionId).length;

  return (
    <>
      <PageHeader
        eyebrow="Content Governance"
        title="Collections"
        description="Curated groupings above the categories — the editorial stories products are merchandised by."
        actions={
          <Button size="sm" onClick={() => setEditing("new")}>
            New Collection
          </Button>
        }
      />

      <div className="mt-6">
        <AsyncBoundary
          status={status === "loading" ? "loading" : status === "error" ? "error" : "success"}
          error={error}
          onRetry={retry}
          errorMessage="Collections could not be loaded."
        >
          {!collections || collections.length === 0 ? (
            <EmptyState title="No collections yet">Create the first curated collection for the catalogue.</EmptyState>
          ) : (
            <Table
              caption="Curated collections"
              hideCaption
              headers={[
                { label: "Collection" },
                { label: "Slug" },
                { label: "Products", align: "center" },
                { label: "Actions", align: "right" },
              ]}
            >
              {collections.map((collection) => (
                <Table.Row key={collection.id}>
                  <Table.Cell>
                    <span className="block font-sans text-body-sm font-medium text-text-primary">{collection.name}</span>
                    <span className="block font-sans text-caption text-text-muted">{collection.description}</span>
                  </Table.Cell>
                  <Table.Cell className="font-sans text-caption text-text-secondary">/collections/{collection.slug}</Table.Cell>
                  <Table.Cell align="center">{countByCollection(collection.id)}</Table.Cell>
                  <Table.Cell align="right">
                    <Button variant="ghost" size="sm" onClick={() => setEditing(collection)}>
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
        <CollectionDialog
          collection={editing === "new" ? null : editing}
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

function CollectionDialog({ collection, onClose, onSaved }) {
  const isNew = !collection;
  const mutation = useGovernanceMutation();
  const [form, setForm] = useState({
    name: collection?.name ?? "",
    description: collection?.description ?? "",
  });
  const [localError, setLocalError] = useState(null);

  const save = async (event) => {
    event.preventDefault();
    setLocalError(null);
    if (!form.name.trim()) {
      setLocalError("A collection name is required.");
      return;
    }
    try {
      if (isNew) {
        await mutation.run(catalogueGovernanceService.createCollection, form);
      } else {
        await mutation.run(catalogueGovernanceService.updateCollection, collection.id, form);
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
      title={isNew ? "New Collection" : `Edit — ${collection.name}`}
      description={isNew ? "Collections group pieces into curated stories." : `${collection.id} · /collections/${collection.slug}`}
    >
      <form onSubmit={save} className="space-y-4">
        <Input
          label="Name"
          required
          size="sm"
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
        />
        <Textarea
          label="Description"
          rows={3}
          value={form.description}
          onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
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
            {mutation.busy ? "Saving…" : isNew ? "Create Collection" : "Save Changes"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
