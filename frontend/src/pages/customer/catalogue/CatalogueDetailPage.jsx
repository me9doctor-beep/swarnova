import { useMemo } from "react";
import PropTypes from "prop-types";
import { useParams, useSearchParams } from "react-router-dom";
import AsyncBoundary from "../../../components/ui/AsyncBoundary.jsx";
import Button from "../../../components/ui/Button.jsx";
import Container from "../../../components/ui/Container.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import CatalogueControls from "../../../components/catalogue/CatalogueControls.jsx";
import CatalogueHeader from "../../../components/catalogue/CatalogueHeader.jsx";
import ProductGrid from "../../../components/catalogue/ProductGrid.jsx";
import { DEFAULT_SORT, PRICE_RANGES, SORT_OPTIONS } from "../../../components/catalogue/config.js";
import { useCategories } from "../../../hooks/useCategories.js";
import { useCollections } from "../../../hooks/useCollections.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { useProducts } from "../../../hooks/useProducts.js";

/**
 * COLLECTION / CATEGORY DETAIL — one catalogue listing page for both
 * `/collections/:slug` (curated collections) and `/category/:slug`
 * (jewellery categories), so the two share a single listing implementation.
 *
 * `/collections/:slug` resolves a category slug as a fallback, so the
 * category discovery links that predate the dedicated route keep working.
 * Browsing state (sort, price) lives in the URL query string.
 */
export default function CatalogueDetailPage({ scope }) {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const collectionsState = useCollections();
  const categoriesState = useCategories();

  const ready =
    collectionsState.status === "success" && categoriesState.status === "success";

  const entity = useMemo(() => {
    if (!ready) return null;
    if (scope === "collection") {
      const collection = collectionsState.data?.find((item) => item.slug === slug);
      if (collection) return { kind: "collection", ...collection };
      const category = categoriesState.data?.find((item) => item.slug === slug);
      return category ? { kind: "category", ...category } : null;
    }
    const category = categoriesState.data?.find((item) => item.slug === slug);
    return category ? { kind: "category", ...category } : null;
  }, [ready, scope, slug, collectionsState.data, categoriesState.data]);

  useDocumentTitle(
    entity ? `${entity.name} — Swarnova` : scope === "collection" ? "Collections — Swarnova" : "Jewellery — Swarnova"
  );

  const sort = SORT_OPTIONS.some((option) => option.value === searchParams.get("sort"))
    ? searchParams.get("sort")
    : DEFAULT_SORT;
  const price = PRICE_RANGES.some((range) => range.value === searchParams.get("price"))
    ? searchParams.get("price")
    : "";

  const isCategory = entity?.kind === "category";
  const band = PRICE_RANGES.find((range) => range.value === price);

  const query = useMemo(() => {
    if (!entity) return {};
    const base =
      entity.kind === "collection" ? { collectionId: entity.id } : { categoryId: entity.id };
    return {
      ...base,
      ...(entity.kind === "category" && band
        ? {
            ...(band.min != null ? { priceMin: band.min } : {}),
            ...(band.max != null ? { priceMax: band.max } : {}),
          }
        : {}),
      ...(sort !== DEFAULT_SORT ? { sort } : {}),
    };
  }, [entity, band, sort]);

  const productsState = useProducts(query);

  const lookupError = collectionsState.error ?? categoriesState.error;
  const status = !ready ? (lookupError ? "error" : "loading") : productsState.status;
  const error = status === "error" ? (lookupError ?? productsState.error) : undefined;
  const retry = () => {
    if (collectionsState.error) collectionsState.retry();
    if (categoriesState.error) categoriesState.retry();
    if (productsState.error) productsState.retry();
  };

  const products = productsState.data ?? [];
  const hasFilters = isCategory && Boolean(price);

  const update = (patch) => {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        Object.entries(patch).forEach(([key, val]) => (val ? next.set(key, val) : next.delete(key)));
        return next;
      },
      { replace: true }
    );
  };
  const reset = () => setSearchParams(new URLSearchParams(), { replace: true });

  return (
    <>
      {status === "success" && entity ? (
        <>
          <CatalogueHeader
            eyebrow={isCategory ? "Category" : "Collection"}
            title={entity.name}
            description={entity.description}
            count={products.length}
          />
          <Container className="pb-20 sm:pb-28">
            <AsyncBoundary
              status={productsState.status}
              error={productsState.error}
              onRetry={productsState.retry}
              className="min-h-[320px] py-0"
            >
              <CatalogueControls
                value={{ sort, price: isCategory ? price : "", category: "", q: "" }}
                onChange={update}
                onReset={reset}
                showPrice={isCategory}
              />
              <div className="mt-10 sm:mt-12">
                {products.length === 0 ? (
                  <EmptyState
                    title={
                      hasFilters
                        ? "No pieces match your selection"
                        : isCategory
                          ? "This category is being curated"
                          : "This collection is being curated"
                    }
                    action={
                      hasFilters ? (
                        <Button variant="outline" size="sm" onClick={reset}>
                          Reset filters
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" href="/products">
                          View All Jewellery
                        </Button>
                      )
                    }
                  >
                    {hasFilters
                      ? "Try choosing a wider price range."
                      : "Pieces are being prepared — please revisit us shortly."}
                  </EmptyState>
                ) : (
                  <ProductGrid products={products} />
                )}
              </div>
            </AsyncBoundary>
          </Container>
        </>
      ) : (
        <AsyncBoundary
          status={status}
          error={error}
          onRetry={retry}
          className="min-h-[420px] py-0"
        >
          {/* Known route, unknown slug — the catalogue's own not-found state. */}
          <Container className="pt-[160px] pb-20 sm:pb-28">
            <EmptyState
              title={scope === "collection" ? "Collection not found" : "Category not found"}
              action={
                <Button variant="outline" size="sm" href="/collections">
                  Browse Collections
                </Button>
              }
            >
              The {scope === "collection" ? "collection" : "category"} you are looking for is not
              part of the current catalogue.
            </EmptyState>
          </Container>
        </AsyncBoundary>
      )}
    </>
  );
}

CatalogueDetailPage.propTypes = {
  /** "collection" for /collections/:slug, "category" for /category/:slug. */
  scope: PropTypes.oneOf(["collection", "category"]).isRequired,
};
