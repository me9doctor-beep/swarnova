import PropTypes from "prop-types";
import Section from "../../../../components/ui/Section.jsx";
import Container from "../../../../components/ui/Container.jsx";
import NewsletterForm from "../../../../components/forms/NewsletterForm.jsx";

export default function NewsletterSection({ content }) {
  return (
    <Section id="newsletter" background="paper" className="border-y border-border-default">
      <Container className="max-w-2xl text-center">
        <div className="ornament mb-6" aria-hidden="true">
          <span />
        </div>
        <h2 className="font-serif text-h2 font-medium leading-tight text-text-primary sm:text-h1">
          {content.title}
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-body-lg text-text-secondary">
          {content.body}
        </p>
        <NewsletterForm
          variant="full"
          placeholder={content.placeholder}
          buttonLabel={content.buttonLabel}
          successMessage={content.successMessage}
          className="mx-auto mt-8"
        />
        <p className="mx-auto mt-4 max-w-md text-caption leading-relaxed text-text-muted">
          {content.privacyNote}
        </p>
      </Container>
    </Section>
  );
}

NewsletterSection.propTypes = {
  content: PropTypes.shape({
    title: PropTypes.string,
    body: PropTypes.string,
    placeholder: PropTypes.string,
    buttonLabel: PropTypes.string,
    successMessage: PropTypes.string,
    privacyNote: PropTypes.string,
  }).isRequired,
};
