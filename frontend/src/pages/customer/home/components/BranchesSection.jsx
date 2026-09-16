import PropTypes from "prop-types";
import Section from "../../../../components/ui/Section.jsx";
import Container from "../../../../components/ui/Container.jsx";
import SectionHeading from "../../../../components/ui/SectionHeading.jsx";
import Button from "../../../../components/ui/Button.jsx";
import AsyncBoundary from "../../../../components/ui/AsyncBoundary.jsx";
import BranchCard from "../../../../components/cards/BranchCard.jsx";
import { useBranches } from "../../../../hooks/useBranches.js";

/** Physical boutique experience — the house beyond the screen. */
export default function BranchesSection({ content }) {
  const { status, data: branches, error, retry } = useBranches(content.query);

  return (
    <Section id="stores" background="paper" ariaLabelledby="stores-title">
      <Container>
        <SectionHeading
          eyebrow={content.eyebrow}
          title={content.title}
          description={content.body}
          headingLevel={2}
        />
        <div className="mt-12">
          <AsyncBoundary
            status={status}
            error={error}
            onRetry={retry}
            isEmpty={status === "success" && branches?.length === 0}
            emptyMessage="Our boutiques will be listed here shortly."
            className="py-12"
          >
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
              {(branches ?? []).map((branch) => (
                <BranchCard key={branch.id} branch={branch} />
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

BranchesSection.propTypes = {
  content: PropTypes.shape({
    eyebrow: PropTypes.string,
    title: PropTypes.string,
    body: PropTypes.string,
    query: PropTypes.object,
    cta: PropTypes.object,
  }).isRequired,
};
