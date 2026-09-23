import PropTypes from "prop-types";
import Button from "../ui/Button.jsx";
import Container from "../ui/Container.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import Section from "../ui/Section.jsx";
import CatalogueHeader from "../catalogue/CatalogueHeader.jsx";

/**
 * The storefront's unavailable state for a platform feature the house has
 * paused. The route still exists — a direct link is not a 404 — but the
 * experience is not entered.
 */
export default function FeatureUnavailable({ eyebrow, title, description }) {
  return (
    <>
      <CatalogueHeader eyebrow={eyebrow} title={title} description={description} />
      <Section background="ivory" ariaLabel={title}>
        <Container className="max-w-xl">
          <EmptyState
            title="Paused by the house"
            action={<Button href="/">Return to the Storefront</Button>}
          >
            This experience is not available to customers right now. The rest of
            the house — catalogue, boutiques and your account — remains open.
          </EmptyState>
        </Container>
      </Section>
    </>
  );
}

FeatureUnavailable.propTypes = {
  eyebrow: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
};
