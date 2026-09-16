import PropTypes from "prop-types";
import Section from "../../../../components/ui/Section.jsx";
import Container from "../../../../components/ui/Container.jsx";
import SectionHeading from "../../../../components/ui/SectionHeading.jsx";
import Button from "../../../../components/ui/Button.jsx";
import AsyncBoundary from "../../../../components/ui/AsyncBoundary.jsx";
import ProductCard from "../../../../components/cards/ProductCard.jsx";
import { useProducts } from "../../../../hooks/useProducts.js";

/** Bestsellers / featured catalogue grid. Query is CMS-configured. */
export default function FeaturedProductsSection({ content }) {
  const { status, data: products, error, retry } = useProducts(content.query);

  return (
    <Section id="bestsellers" background="paper" ariaLabelledby="bestsellers-title">
      <Container>
        <SectionHeading
          eyebrow={content.eyebrow}
          title={content.title}
          headingLevel={2}
        />
        <div className="mt-12">
          <AsyncBoundary
            status={status}
            error={error}
            onRetry={retry}
            isEmpty={status === "success" && products?.length === 0}
            emptyMessage={content.emptyMessage}
            className="py-12"
          >
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
              {(products ?? []).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </AsyncBoundary>
        </div>
        <div className="mt-14 text-center">
          <Button variant="outline" href={content.cta.href}>
            {content.cta.label}
          </Button>
        </div>
      </Container>
    </Section>
  );
}

FeaturedProductsSection.propTypes = {
  content: PropTypes.shape({
    eyebrow: PropTypes.string,
    title: PropTypes.string,
    query: PropTypes.object,
    cta: PropTypes.object,
    emptyMessage: PropTypes.string,
  }).isRequired,
};
