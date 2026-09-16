import PropTypes from "prop-types";
import Section from "../ui/Section.jsx";
import Container from "../ui/Container.jsx";
import SectionHeading from "../ui/SectionHeading.jsx";
import Button from "../ui/Button.jsx";
import AsyncBoundary from "../ui/AsyncBoundary.jsx";
import JournalCard from "../cards/JournalCard.jsx";
import { useJournalArticles } from "../../hooks/useJournal.js";

/** Editorial journal — magazine rhythm, three stories. */
export default function Journal({ content }) {
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
        <div className="mt-14 text-center">
          <Button variant="outline" href={content.cta.href}>
            {content.cta.label}
          </Button>
        </div>
      </Container>
    </Section>
  );
}

Journal.propTypes = {
  content: PropTypes.shape({
    eyebrow: PropTypes.string,
    title: PropTypes.string,
    query: PropTypes.object,
    cta: PropTypes.object,
  }).isRequired,
};
