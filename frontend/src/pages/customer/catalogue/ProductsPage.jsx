import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import AsyncBoundary from "../../../components/ui/AsyncBoundary.jsx";
import Button from "../../../components/ui/Button.jsx";
import Container from "../../../components/ui/Container.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import CatalogueControls from "../../../components/catalogue/CatalogueControls.jsx";
import CatalogueHeader from "../../../components/catalogue/CatalogueHeader.jsx";
import ProductGrid from "../../../components/catalogue/ProductGrid.jsx";
import { DEFAULT_SORT, PRICE_RANGES, SORT_OPTIONS } from "../../../components/catalogue/config.js";
import { useCategories } from "../../../hooks/useCategories.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { useProducts } from "../../../hooks/useProducts.js";

/**
 * ALL JEWELLERY — the full customer catalogue: search, category and price
 * filters, sort and the result count.
 *
 * All browsing state lives in the URL query string (?q=, ?category=,
 * ?price=, ?sort=), so a filtered view is shareable and survives a refresh.
 * The provider query uses the backend-friendly shape: categoryId + numeric
 * price bounds + search term + sort key.
 */
export default function ProductsPage() {
  useDocumentTitle("All Jewellery — Swarnova");
  const [searchParams, setSearchParams] = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const sort = SORT_OPTIONS.some((option) => option.value === searchParams.get("sort"))
    ? searchParams.get("sort")
    : DEFAULT_SORT;
  const price = PRICE_RANGES.some((range) => range.value === searchParams.get("price"))
    ? searchParams.get("price")
    : "";

  const categoriesState = useCategories();
  const category =
    categoriesState.status === "success" &&
    categoriesState.data?.some((item) => item.slug === searchParams.get("category"))
      ? searchParams.get("category")
      : "";
  const categoryId = category
    ? categoriesState.data.find((item) => item.slug === category)?.id
    : undefined;

  const band = PRICE_RANGES.find((range) => range.value === price);
  const query = useMemo(
    () => ({
      ...(categoryId ? { categoryId } : {}),
      ...(band
        ? {
            ...(band.min != null ? { priceMin: band.min } : {}),
            ...(band.max != null ? { priceMax: band.max } : {}),
          }
        : {}),
      ...(q ? { search: q } : {}),
      ...(sort !== DEFAULT_SORT ? { sort } : {}),
    }),
    [categoryId, band, q, sort]
  );

  const productsState = useProducts(query);

  const status = [productsState.status, categoriesState.status].includes("error")
    ? "error"
    : [productsState.status, categoriesState.status].every((item) => item === "success")
      ? "success"
      : "loading";
  const error = productsState.error ?? categoriesState.error;
  const retry = () => {
    if (productsState.error) productsState.retry();
    if (categoriesState.error) categoriesState.retry();
  };

  /* The header's search icon links here as /products#search — hand it focus. */
  useEffect(() => {
    if (window.location.hash === "#search") {
      document.getElementById("search")?.focus();
    }
  }, []);

  const products = productsState.data ?? [];
  const hasFilters = Boolean(category || price || q);

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
      <CatalogueHeader
        eyebrow="The Swarnova Catalogue"
        title="All Jewellery"
        description="Every hallmarked piece in the Swarnova house — browse the full catalogue, or narrow it by category, price or name."
        count={status === "success" ? products.length : null}
      />
      <Container className="pb-20 sm:pb-28">
        <AsyncBoundary
          status={status}
          error={error}
          onRetry={retry}
          className="min-h-[320px] py-0"
        >
          <CatalogueControls
            value={{ sort, price, category, q }}
            onChange={update}
            onReset={reset}
            showSearch
            showCategory
            showPrice
          />
          <div className="mt-10 sm:mt-12">
            {products.length === 0 ? (
              <EmptyState
                title="No pieces match your selection"
                action={
                  hasFilters ? (
                    <Button variant="outline" size="sm" onClick={reset}>
                      Reset filters
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" href="/collections">
                      Browse Collections
                    </Button>
                  )
                }
              >
                {hasFilters
                  ? "Try removing a filter, choosing a wider price range or clearing your search."
                  : "The catalogue is being prepared — please revisit us shortly."}
              </EmptyState>
            ) : (
              <ProductGrid products={products} />
            )}
          </div>
        </AsyncBoundary>
      </Container>
    </>
  );
}
