import { Diamond } from "lucide-react";
import Section from "../../../../components/ui/Section.jsx";
import Container from "../../../../components/ui/Container.jsx";
import Button from "../../../../components/ui/Button.jsx";
import TextLink from "../../../../components/ui/TextLink.jsx";
import Eyebrow from "../../../../components/ui/Eyebrow.jsx";
import AsyncBoundary from "../../../../components/ui/AsyncBoundary.jsx";
import { useAiStudio } from "../../../../hooks/useAiStudio.js";

/**
 * AI as the modern jewellery artisan — presented entirely in the house's
 * editorial split-section language. No dashboards, no prompt windows.
 */
export default function AiStudioSection() {
  const { status, data: studio, error, retry } = useAiStudio();

  return (
    <Section id="ai-studio" background="ivory" ariaLabelledby="ai-studio-title">
      <Container>
        <AsyncBoundary
          status={status}
          error={error}
          onRetry={retry}
          isEmpty={status === "success" && !studio}
          emptyMessage="The AI Jewellery Studio is being prepared. Please revisit us shortly."
          className="py-12"
        >
          {studio && (
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <div>
                <Eyebrow>{studio.eyebrow}</Eyebrow>
                <h2
                  id="ai-studio-title"
                  className="mt-5 font-serif text-h1 font-medium leading-[1.14] sm:text-display"
                >
                  {studio.titleLines.map((line, index) => (
                    <span key={line} className="block">
                      <span className={index === studio.titleLines.length - 1 ? "italic text-brand-accent-strong" : undefined}>
                        {line}
                      </span>
                    </span>
                  ))}
                </h2>
                <p className="mt-5 max-w-lg text-body-lg text-text-secondary">
                  {studio.body}
                </p>

                <ul className="mt-8 space-y-3">
                  {studio.points.map((point) => (
                    <li key={point} className="flex items-start gap-3 text-body text-text-primary/85">
                      <Diamond
                        size={13}
                        strokeWidth={1.5}
                        className="mt-1.5 shrink-0 rotate-90 text-brand-accent"
                        aria-hidden="true"
                      />
                      {point}
                    </li>
                  ))}
                </ul>

                <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
                  <Button href={studio.cta.href}>{studio.cta.label}</Button>
                  <TextLink href={studio.secondaryCta.href} tone="gold">
                    {studio.secondaryCta.label}
                  </TextLink>
                </div>
              </div>

              <figure>
                <div className="border border-brand-accent/30 bg-surface-primary p-2.5 sm:p-3">
                  <div className="overflow-hidden">
                    <img
                      src={studio.triptych.src}
                      alt={studio.triptych.alt}
                      loading="lazy"
                      className="aspect-[3/2] w-full object-cover"
                    />
                  </div>
                </div>
                <figcaption className="mt-5 grid grid-cols-3 gap-3 text-center">
                  {studio.steps.map((step) => (
                    <div key={step.code} className="border-t border-brand-accent/25 pt-3">
                      <p className="font-serif text-h4 italic text-brand-accent-strong">{step.code}</p>
                      <p className="mt-1 font-sans text-label font-medium uppercase tracking-[0.2em] text-text-primary">
                        {step.label}
                      </p>
                      <p className="mt-2 hidden text-caption leading-snug text-text-secondary lg:block">
                        {step.caption}
                      </p>
                    </div>
                  ))}
                </figcaption>
              </figure>
            </div>
          )}
        </AsyncBoundary>
      </Container>
    </Section>
  );
}
