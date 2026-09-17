import PropTypes from "prop-types";
import AsyncBoundary from "../../../components/ui/AsyncBoundary.jsx";
import Button from "../../../components/ui/Button.jsx";
import ContentLink from "../../../components/ui/ContentLink.jsx";
import Container from "../../../components/ui/Container.jsx";
import SectionHeading from "../../../components/ui/SectionHeading.jsx";
import CollectionCard from "../../../components/cards/CollectionCard.jsx";
import CatalogueHeader from "../../../components/catalogue/CatalogueHeader.jsx";
import { useCategories } from "../../../hooks/useCategories.js";
import { useCollections } from "../../../hooks/useCollections.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { useProducts } from "../../../hooks/useProducts.js";

/**
 * COLLECTIONS INDEX — the catalogue landing page.
 *
 * First the curated collections (editorial groupings, each tile led by the
 * first piece in the collection — imagery derived from product data, no
 * separate collection assets), then the jewellery categories reusing the
 * homepage's CollectionCard, and a quiet exit to the full catalogue.
 */
export default function CollectionsPage() {
  useDocumentTitle("Collections — Swarnova");

  const collectionsState = useCollections();
  const categoriesState = useCategories();
  /* One fetch supplies both the per-collection counts and the tile imagery. */
  const productsState = useProducts({});

  const statuses = [collectionsState.status, categoriesState.status, productsState.status];
  const status = statuses.includes("error")
    ? "error"
    : statuses.every((item) => item === "success")
      ? "success"
      : "loading";
  const error = collectionsState.error ?? categoriesState.error ?? productsState.error;
  const retry = () => {
    if (collectionsState.error) collectionsState.retry();
    if (categoriesState.error) categoriesState.retry();
    if (productsState.error) productsState.retry();
  };

  const collections = collectionsState.data ?? [];
  const categories = categoriesState.data ?? [];
  const products = productsState.data ?? [];
  const countFor = (id) => products.filter((product) => product.collectionId === id).length;
  const imageFor = (id) => products.find((product) => product.collectionId === id)?.images?.[0];

  return (
    <>
      <CatalogueHeader
        eyebrow="The Swarnova Catalogue"
        title="Collections"
        description="Curated worlds within the Swarnova house — explore by collection, or find your piece by jewellery type."
      />
      <Container className="pb-20 sm:pb-28">
        <AsyncBoundary
          status={status}
          error={error}
          onRetry={retry}
          isEmpty={status === "success" && collections.length === 0}
          emptyMessage="Our collections are being curated. Please check back shortly."
          className="min-h-[320px] py-0"
        >
          <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {collections.map((collection) => (
              <CollectionTile
                key={collection.id}
                collection={collection}
                count={countFor(collection.id)}
                image={imageFor(collection.id)}
              />
            ))}
          </div>

          {categories.length > 0 && (
            <div className="mt-20 sm:mt-24">
              <SectionHeading
                eyebrow="Jewellery by Type"
                title="Browse by Category"
                headingLevel={2}
              />
              <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
                {categories.map((category) => (
                  <CollectionCard key={category.id} category={category} />
                ))}
              </div>
              <div className="mt-14 text-center">
                <Button variant="outline" href="/products">
                  View All Jewellery
                </Button>
              </div>
            </div>
          )}
        </AsyncBoundary>
      </Container>
    </>
  );
}

/* Frameless editorial tile — the same register as the category tiles below. */
function CollectionTile({ collection, image, count }) {
  const href = `/collections/${collection.slug}`;
  return (
    <article className="group text-center">
      <ContentLink
        href={href}
        aria-label={`View the ${collection.name} collection`}
        className="block overflow-hidden bg-surface-secondary"
      >
        <img
          src={image?.src}
          alt={image?.alt ?? collection.name}
          loading="lazy"
          className="aspect-[4/5] w-full object-cover"
        />
      </ContentLink>
      <h3 className="mt-5 font-serif text-h3 leading-snug">
        <ContentLink href={href} className="transition-colors duration-200 hover:text-brand-primary">
          {collection.name}
        </ContentLink>
      </h3>
      {collection.description && (
        <p className="mx-auto mt-2 max-w-[300px] text-body-sm leading-relaxed text-text-secondary">
          {collection.description}
        </p>
      )}
      <p className="mt-3 font-sans text-label uppercase tracking-[0.18em] text-text-muted">
        {count} {count === 1 ? "piece" : "pieces"}
      </p>
    </article>
  );
}

CollectionTile.propTypes = {
  collection: PropTypes.shape({
    id: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
  }).isRequired,
  image: PropTypes.shape({ src: PropTypes.string, alt: PropTypes.string }),
  count: PropTypes.number.isRequired,
};
