import PropTypes from "prop-types";
import { Check } from "lucide-react";
import Button from "../ui/Button.jsx";
import Eyebrow from "../ui/Eyebrow.jsx";

/** Split editorial — copy on the left, full-height lifestyle image right. */
export default function BrandPromise({ content }) {
  return (
    <section id="our-story" aria-labelledby="promise-title" className="scroll-mt-28 bg-paper">
      <div className="grid lg:grid-cols-2">
        <div className="flex items-center py-16 lg:py-24">
          <div className="mx-auto w-full max-w-2xl px-5 sm:px-8 lg:mx-0 lg:pl-12 lg:pr-14 xl:pl-16">
            <Eyebrow>{content.eyebrow}</Eyebrow>
            <h2
              id="promise-title"
              className="mt-5 font-serif text-[34px] font-medium leading-[1.14] text-ink sm:text-[40px]"
            >
              {content.title.lines.map((line, index) => (
                <span key={`${line.text}-${index}`} className="block">
                  {line.text}
                </span>
              ))}
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-ash">{content.body}</p>

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

            <div className="mt-9">
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

BrandPromise.propTypes = {
  content: PropTypes.shape({
    eyebrow: PropTypes.string,
    title: PropTypes.object.isRequired,
    body: PropTypes.string,
    points: PropTypes.arrayOf(PropTypes.string),
    cta: PropTypes.object,
    image: PropTypes.object,
  }).isRequired,
};
