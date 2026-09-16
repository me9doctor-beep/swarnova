import PropTypes from "prop-types";
import { Check } from "lucide-react";
import Button from "../../../../components/ui/Button.jsx";
import Eyebrow from "../../../../components/ui/Eyebrow.jsx";

/** Split editorial — copy on the left, full-height lifestyle image right. */
export default function BrandPromiseSection({ content }) {
  return (
    <section id="our-story" aria-labelledby="promise-title" className="scroll-mt-28 bg-surface-primary">
      <div className="grid lg:grid-cols-2">
        <div className="flex items-center py-16 lg:py-24">
          <div className="mx-auto w-full max-w-2xl px-5 sm:px-8 lg:mx-0 lg:pl-12 lg:pr-12 xl:pl-16">
            <Eyebrow>{content.eyebrow}</Eyebrow>
            <h2
              id="promise-title"
              className="mt-5 font-serif text-h1 font-medium leading-[1.14] text-text-primary sm:text-display"
            >
              {content.title.lines.map((line, index) => (
                <span key={`${line.text}-${index}`} className="block">
                  {line.text}
                </span>
              ))}
            </h2>
            <p className="mt-5 text-body-lg text-text-secondary">{content.body}</p>

            <ul className="mt-8 space-y-3">
              {content.points.map((point) => (
                <li key={point} className="flex items-start gap-3 text-body text-text-primary/85">
                  <Check
                    size={17}
                    strokeWidth={1.6}
                    className="mt-0.5 shrink-0 text-brand-accent-strong"
                    aria-hidden="true"
                  />
                  {point}
                </li>
              ))}
            </ul>

            <div className="mt-10">
              <Button href={content.cta.href}>{content.cta.label}</Button>
            </div>
          </div>
        </div>

        <div className="relative min-h-[340px] lg:min-h-0">
          <img
            src={content.image.src}
            alt={content.image.alt}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover object-top"
          />
        </div>
      </div>
    </section>
  );
}

BrandPromiseSection.propTypes = {
  content: PropTypes.shape({
    eyebrow: PropTypes.string,
    title: PropTypes.object.isRequired,
    body: PropTypes.string,
    points: PropTypes.arrayOf(PropTypes.string),
    cta: PropTypes.object,
    image: PropTypes.object,
  }).isRequired,
};
