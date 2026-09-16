import PropTypes from "prop-types";
import Section from "../../../../components/ui/Section.jsx";
import Container from "../../../../components/ui/Container.jsx";
import SectionHeading from "../../../../components/ui/SectionHeading.jsx";
import Icon from "../../../../components/ui/Icon.jsx";

/** Signature deep-wine promise section. */
export default function WhyChooseUsSection({ content }) {
  return (
    <Section background="wine" ariaLabelledby="why-title" className="relative overflow-hidden">
      <Container>
        <SectionHeading
          eyebrow={content.eyebrow}
          title={content.title}
          tone="wine"
          headingLevel={2}
        />

        <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-10 sm:gap-x-6 sm:gap-y-12 lg:mt-16 lg:grid-cols-4">
          {content.items.map((item, index) => (
            <div
              key={item.title}
              className={`text-center lg:px-7 ${
                index !== 0 ? "lg:border-l lg:border-text-inverse/10" : ""
              }`}
            >
              <Icon name={item.icon} size={28} className="mx-auto text-brand-accent-soft" />
              <h3 className="mt-4 font-sans text-nav font-medium uppercase tracking-[0.2em] text-text-inverse sm:mt-5 sm:text-caption sm:tracking-[0.26em]">
                {item.title}
              </h3>
              <p className="mx-auto mt-3 max-w-[15rem] text-caption leading-relaxed text-text-inverse/70 sm:text-body-sm">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}

WhyChooseUsSection.propTypes = {
  content: PropTypes.shape({
    eyebrow: PropTypes.string,
    title: PropTypes.string,
    items: PropTypes.arrayOf(PropTypes.object),
  }).isRequired,
};
