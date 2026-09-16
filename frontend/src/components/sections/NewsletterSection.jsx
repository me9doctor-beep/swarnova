import PropTypes from "prop-types";
import Section from "../ui/Section.jsx";
import Container from "../ui/Container.jsx";
import NewsletterForm from "../forms/NewsletterForm.jsx";

export default function NewsletterSection({ content }) {
  return (
    <Section id="newsletter" background="paper" className="border-y border-line">
      <Container className="max-w-2xl text-center">
        <h2 className="font-serif text-[32px] font-medium leading-tight text-ink sm:text-[38px]">
          {content.title}
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-ash">
          {content.body}
        </p>
        <NewsletterForm
          variant="full"
          placeholder={content.placeholder}
          buttonLabel={content.buttonLabel}
          successMessage={content.successMessage}
          className="mx-auto mt-8"
        />
        <p className="mx-auto mt-4 max-w-md text-[11.5px] leading-relaxed text-mist">
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
