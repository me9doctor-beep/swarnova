import PropTypes from "prop-types";
import Section from "../../../../components/ui/Section.jsx";
import Container from "../../../../components/ui/Container.jsx";
import SectionHeading from "../../../../components/ui/SectionHeading.jsx";
import Button from "../../../../components/ui/Button.jsx";
import AsyncBoundary from "../../../../components/ui/AsyncBoundary.jsx";
import JournalCard from "../../../../components/cards/JournalCard.jsx";
import { useJournalArticles } from "../../../../hooks/useJournalArticles.js";

/** Editorial journal — magazine rhythm, three stories. */
export default function JournalSection({ content }) {
  const { status, data: articles, error, retry } = useJournalArticles(content.query);

  return (
    <Section id="journal" background="ivory" ariaLabelledby="journal-title">
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
            isEmpty={status === "success" && articles?.length === 0}
            emptyMessage="New stories from the atelier are on their way."
            className="py-12"
          >
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
              {(articles ?? []).map((article) => (
                <JournalCard key={article.id} article={article} />
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

JournalSection.propTypes = {
  content: PropTypes.shape({
    eyebrow: PropTypes.string,
    title: PropTypes.string,
    query: PropTypes.object,
    cta: PropTypes.object,
  }).isRequired,
};
