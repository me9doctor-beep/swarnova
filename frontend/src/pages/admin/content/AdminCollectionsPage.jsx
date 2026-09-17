import PageHeader from "../../../components/layout/PageHeader.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import AsyncBoundary from "../../../components/ui/AsyncBoundary.jsx";
import Table from "../../../components/ui/Table.jsx";
import { useGovernanceCollections } from "../../../hooks/useGovernanceCatalogue.js";
import { useGovernanceProducts } from "../../../hooks/useGovernanceProducts.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";

/**
 * COLLECTIONS — READ VIEW (Phase 9)
 *
 * Which curated stories exist and how many pieces carry each one — the
 * context head office needs when thinking about catalogue placement.
 * Creating and editing collections stays with Super Admin catalogue
 * governance; this screen never duplicates those controls.
 */
export default function AdminCollectionsPage() {
  useDocumentTitle("Collections — Swarnova Admin");

  const { status, data: collections, error, retry } = useGovernanceCollections();
  const products = useGovernanceProducts({});

  const countByCollection = (collectionId) =>
    (products.data ?? []).filter((product) => product.collectionId === collectionId)
      .length;

  return (
    <>
      <PageHeader
        eyebrow="Content"
        title="Collections"
        description="The curated groupings pieces are merchandised by. Collection structure is governed by the platform — this is the operational read view."
      />

      <div className="mt-6">
        <AsyncBoundary
          status={status === "loading" ? "loading" : status === "error" ? "error" : "success"}
          error={error}
          onRetry={retry}
          errorMessage="Collections could not be loaded."
        >
          {!collections || collections.length === 0 ? (
            <EmptyState title="No collections yet">
              The catalogue has no curated collections yet.
            </EmptyState>
          ) : (
            <Table
              caption="Curated collections"
              hideCaption
              headers={[
                { label: "Collection" },
                { label: "Storefront Route" },
                { label: "Products", align: "center" },
              ]}
            >
              {collections.map((collection) => (
                <Table.Row key={collection.id}>
                  <Table.Cell>
                    <span className="block font-sans text-body-sm font-medium text-text-primary">
                      {collection.name}
                    </span>
                    <span className="block font-sans text-caption text-text-muted">
                      {collection.description}
                    </span>
                  </Table.Cell>
                  <Table.Cell className="font-sans text-caption text-text-secondary">
                    /collections/{collection.slug}
                  </Table.Cell>
                  <Table.Cell align="center">
                    {countByCollection(collection.id)}
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
