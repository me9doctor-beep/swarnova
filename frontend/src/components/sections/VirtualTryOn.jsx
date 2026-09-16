import PropTypes from "prop-types";
import { Check } from "lucide-react";
import Section from "../ui/Section.jsx";
import Container from "../ui/Container.jsx";
import Button from "../ui/Button.jsx";
import TextLink from "../ui/TextLink.jsx";
import Eyebrow from "../ui/Eyebrow.jsx";

/** The luxury fitting room, brought online — editorial split composition. */
export default function VirtualTryOn({ content }) {
  return (
    <Section id="try-on" background="cream" ariaLabelledby="tryon-title">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="order-2 lg:order-1">
            <div className="border border-gold/30 bg-paper p-2.5 sm:p-3">
              <div className="overflow-hidden">
                <img
                  src={content.image.src}
                  alt={content.image.alt}
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>
            </div>
            <p className="mt-4 text-center font-serif text-lg italic text-ash">
              Your mirror. Your jewellery. Your choice.
            </p>
          </div>

          <div className="order-1 lg:order-2">
            <Eyebrow>{content.eyebrow}</Eyebrow>
            <h2
              id="tryon-title"
              className="mt-5 font-serif text-[34px] font-medium leading-[1.14] sm:text-[42px]"
            >
              {content.title.lines.map((line, index) => (
                <span key={`${line.text}-${index}`} className="block">
                  <span className={line.emphasis ? "italic text-gold-deep" : undefined}>
                    {line.text}
                  </span>
                </span>
              ))}
            </h2>
            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-ash">
              {content.body}
            </p>

            <ul className="mt-8 space-y-3.5">
              {content.points.map((point) => (
                <li key={point} className="flex items-start gap-3 text-[14px] text-ink/85">
                  <Check
                    size={17}
                    strokeWidth={1.6}
                    className="mt-0.5 shrink-0 text-gold-deep"
                    aria-hidden="true"
                  />
                  {point}
                </li>
              ))}
            </ul>

            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Button href={content.cta.href}>{content.cta.label}</Button>
              <TextLink href={content.secondaryCta.href} tone="wine">
                {content.secondaryCta.label}
              </TextLink>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

VirtualTryOn.propTypes = {
  content: PropTypes.shape({
    eyebrow: PropTypes.string,
    title: PropTypes.object.isRequired,
    body: PropTypes.string,
    points: PropTypes.arrayOf(PropTypes.string),
    cta: PropTypes.object,
    secondaryCta: PropTypes.object,
    image: PropTypes.object,
  }).isRequired,
};
