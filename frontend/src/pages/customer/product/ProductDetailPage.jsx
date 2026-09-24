import { intakeLink } from "../../../utils/links.js";
import { useParams } from "react-router-dom";
import PropTypes from "prop-types";
import AsyncBoundary from "../../../components/ui/AsyncBoundary.jsx";
import Button from "../../../components/ui/Button.jsx";
import Container from "../../../components/ui/Container.jsx";
import ContentLink from "../../../components/ui/ContentLink.jsx";
import Eyebrow from "../../../components/ui/Eyebrow.jsx";
import Section from "../../../components/ui/Section.jsx";
import SectionHeading from "../../../components/ui/SectionHeading.jsx";
import CatalogueHeader from "../../../components/catalogue/CatalogueHeader.jsx";
import ProductGrid from "../../../components/catalogue/ProductGrid.jsx";
import ProductGallery from "../../../components/product/ProductGallery.jsx";
import ProductSummary from "../../../components/product/ProductSummary.jsx";
import { useCategories } from "../../../hooks/useCategories.js";
import { useCollections } from "../../../hooks/useCollections.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { useProduct } from "../../../hooks/useProduct.js";
import { useRelatedProducts } from "../../../hooks/useRelatedProducts.js";

/**
 * PRODUCT DETAIL — the individual piece, at `/product/:id`.
 *
 * The page resolves three things and composes them: the piece itself
 * (`useProduct`), and the category and collection its ids point at, so the
 * breadcrumb, the specifications and the eyebrow all speak the catalogue's
 * real hierarchy rather than an invented one.
 *
 * Layout is one composition at every width — gallery beside the information
 * column from `lg`, the same two blocks stacked below it — followed by the
 * piece's story and a curated rail of the closest pieces in the catalogue.
 */
export default function ProductDetailPage() {
  const { id } = useParams();

  const productState = useProduct(id);
  const categoriesState = useCategories();
  const collectionsState = useCollections();

  const statuses = [productState.status, categoriesState.status, collectionsState.status];
  const status = statuses.includes("error")
    ? "error"
    : statuses.every((item) => item === "success")
      ? "success"
      : "loading";
  const error = productState.error ?? categoriesState.error ?? collectionsState.error;
  const retry = () => {
    if (productState.error) productState.retry();
    if (categoriesState.error) categoriesState.retry();
    if (collectionsState.error) collectionsState.retry();
  };

  const product = status === "success" ? productState.data : undefined;
  const category = categoriesState.data?.find((item) => item.id === product?.categoryId);
  const collection = collectionsState.data?.find((item) => item.id === product?.collectionId);

  useDocumentTitle(product ? `${product.name} — Swarnova` : "Product Not Found — Swarnova");

  /* Curated from the catalogue the storefront already fetches, so the rail is
     ready by the time the piece is — and empty until then. */
  const relatedState = useRelatedProducts(product);

  if (status !== "success") {
    return (
      <Container className="pb-20 pt-[160px] sm:pb-28">
        <AsyncBoundary
          status={status}
          error={error}
          onRetry={retry}
          className="min-h-[320px] py-0"
        />
      </Container>
    );
  }

  /* Known route, unknown id — the catalogue's own not-found state. */
  if (!product) {
    return (
      <>
        <CatalogueHeader
          eyebrow="The Swarnova Catalogue"
          title="Product Not Found"
          description="The jewellery piece you are looking for could not be found. It may have been retired from the Swarnova catalogue."
        />
        <Container className="pb-20 text-center sm:pb-28">
          <Button href="/products">Explore Jewellery</Button>
        </Container>
      </>
    );
  }

  return (
    <>
      <Container className="pb-16 pt-[132px] sm:pb-20 sm:pt-[152px] lg:pt-[168px]">
        <Breadcrumb category={category} name={product.name} />

        <div className="mt-8 grid gap-x-16 gap-y-12 lg:mt-10 lg:grid-cols-2">
          <ProductGallery images={product.images ?? []} name={product.name} />
          <div className="space-y-6"><ProductSummary product={product} category={category} collection={collection} />
          <ContentLink className="inline-block underline underline-offset-4" href={intakeLink("custom", { productId: product.id })}>Enquire about a bespoke interpretation</ContentLink></div>
        </div>
      </Container>

      {product.description && (
        <Section background="ivory" ariaLabelledby="product-story-title">
          <Container>
            <div className="grid gap-8 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-4">
                <Eyebrow>{collection?.name ?? category?.name ?? "The Swarnova House"}</Eyebrow>
                <h2
                  id="product-story-title"
                  className="mt-4 font-serif text-h2 leading-snug"
                >
                  The Story
                </h2>
              </div>
              <div className="lg:col-span-8">
                <p className="max-w-2xl text-body-lg leading-relaxed text-text-secondary">
                  {product.description}
                </p>
              </div>
            </div>
          </Container>
        </Section>
      )}

      <Section ariaLabel="You may also like">
        <Container>
          <SectionHeading
            eyebrow="From the Swarnova House"
            title="You May Also Like"
            headingLevel={2}
          />
          <div className="mt-12">
            <AsyncBoundary
              status={relatedState.status}
              error={relatedState.error}
              onRetry={relatedState.retry}
              isEmpty={relatedState.data.length === 0}
              emptyMessage="The rest of the catalogue is being curated."
              className="py-12"
            >
              <ProductGrid products={relatedState.data} />
            </AsyncBoundary>
          </div>
        </Container>
      </Section>
    </>
  );
}

/**
 * Home / Collections / Category / Piece — the catalogue's real hierarchy, in
 * the console breadcrumb's own vocabulary (micro caps, `/` separator,
 * `aria-current` on the page you are on).
 */
function Breadcrumb({ category, name }) {
  const trail = [
    { label: "Home", href: "/" },
    { label: "Collections", href: "/collections" },
    ...(category ? [{ label: category.name, href: `/category/${category.slug}` }] : []),
  ];

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 font-sans text-label uppercase">
        {trail.map((crumb) => (
          <li key={crumb.href} className="flex items-center gap-2">
            <ContentLink
              href={crumb.href}
              className="py-1 text-text-secondary transition-colors duration-200 hover:text-brand-primary"
            >
              {crumb.label}
            </ContentLink>
            <span aria-hidden="true" className="text-text-muted">
              /
            </span>
          </li>
        ))}
        <li aria-current="page" className="py-1 text-text-primary">
          {name}
        </li>
      </ol>
    </nav>
  );
}

Breadcrumb.propTypes = {
  category: PropTypes.shape({ name: PropTypes.string, slug: PropTypes.string }),
  name: PropTypes.string.isRequired,
};
