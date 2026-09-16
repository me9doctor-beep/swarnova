import PropTypes from "prop-types";
import { Diamond } from "lucide-react";
import Section from "../../../../components/ui/Section.jsx";
import Container from "../../../../components/ui/Container.jsx";
import TextLink from "../../../../components/ui/TextLink.jsx";
import Eyebrow from "../../../../components/ui/Eyebrow.jsx";

/** Magazine-style "Art of Gold" storytelling block. */
export default function EditorialSection({ content }) {
  return (
    <Section id="editorial" background="paper" ariaLabelledby="editorial-title">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <div className="border border-brand-accent/30 bg-surface-primary p-2.5 sm:p-3">
              <div className="overflow-hidden">
                <img
                  src={content.image.src}
                  alt={content.image.alt}
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <Eyebrow>{content.eyebrow}</Eyebrow>
            <h2
              id="editorial-title"
              className="mt-5 font-serif text-h1 font-medium leading-[1.14] sm:text-display"
            >
              {content.title.lines.map((line, index) => (
                <span key={`${line.text}-${index}`} className="block">
                  {line.text}
                </span>
              ))}
            </h2>
            <p className="mt-5 font-serif text-h4 italic leading-relaxed text-brand-accent-strong">
              {content.lead}
            </p>
            {content.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className="mt-4 text-body leading-relaxed text-text-secondary">
                {paragraph}
              </p>
            ))}

            <div className="mt-8 space-y-4 border-t border-border-default pt-7">
              {content.motifs.map((motif) => (
                <div key={motif.label} className="flex items-start gap-3">
                  <Diamond
                    size={12}
                    strokeWidth={1.5}
                    className="mt-1.5 shrink-0 rotate-90 text-brand-accent"
                    aria-hidden="true"
                  />
                  <p className="text-body text-text-primary/85">
                    <span className="mr-2 font-sans text-nav font-medium uppercase tracking-[0.22em] text-brand-accent-strong">
                      {motif.label}
                    </span>
                    <span className="text-text-secondary">{motif.text}</span>
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <TextLink href={content.cta.href}>{content.cta.label}</TextLink>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

EditorialSection.propTypes = {
  content: PropTypes.shape({
    eyebrow: PropTypes.string,
    title: PropTypes.object.isRequired,
    lead: PropTypes.string,
    paragraphs: PropTypes.arrayOf(PropTypes.string),
    motifs: PropTypes.arrayOf(PropTypes.object),
    cta: PropTypes.object,
    image: PropTypes.object,
  }).isRequired,
};
