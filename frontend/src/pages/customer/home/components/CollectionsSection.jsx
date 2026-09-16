import PropTypes from "prop-types";
import Section from "../../../../components/ui/Section.jsx";
import Container from "../../../../components/ui/Container.jsx";
import SectionHeading from "../../../../components/ui/SectionHeading.jsx";
import Button from "../../../../components/ui/Button.jsx";
import AsyncBoundary from "../../../../components/ui/AsyncBoundary.jsx";
import CollectionCard from "../../../../components/cards/CollectionCard.jsx";
import { useCategories } from "../../../../hooks/useCategories.js";

export default function CollectionsSection({ content }) {
  const { status, data: categories, error, retry } = useCategories();

  return (
    <Section id="collections" background="paper" ariaLabelledby="collections-title">
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
            isEmpty={status === "success" && categories?.length === 0}
            emptyMessage="Our collections are being curated. Please check back shortly."
            className="py-12"
          >
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
              {(categories ?? []).map((category) => (
                <CollectionCard key={category.id} category={category} />
              ))}
            </div>
          </AsyncBoundary>
        </div>
        <div className="mt-12 text-center">
          <Button variant="outline" href={content.cta.href}>
            {content.cta.label}
          </Button>
        </div>
      </Container>
    </Section>
  );
}

CollectionsSection.propTypes = {
  content: PropTypes.shape({
    eyebrow: PropTypes.string,
    title: PropTypes.string,
    cta: PropTypes.object,
  }).isRequired,
};
