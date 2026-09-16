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

        <div className="mt-14 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
          {content.items.map((item, index) => (
            <div
              key={item.title}
              className={`text-center lg:px-7 ${
                index !== 0 ? "lg:border-l lg:border-cream/10" : ""
              }`}
            >
              <Icon name={item.icon} size={34} className="mx-auto text-champagne" />
              <h3 className="mt-5 font-sans text-[12px] font-medium uppercase tracking-[0.26em] text-cream">
                {item.title}
              </h3>
              <p className="mx-auto mt-3 max-w-[15rem] text-[13.5px] leading-relaxed text-cream/65">
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
