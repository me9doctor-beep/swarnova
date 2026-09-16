import PropTypes from "prop-types";
import Section from "../../../../components/ui/Section.jsx";
import Container from "../../../../components/ui/Container.jsx";
import Eyebrow from "../../../../components/ui/Eyebrow.jsx";
import TextLink from "../../../../components/ui/TextLink.jsx";
import AsyncBoundary from "../../../../components/ui/AsyncBoundary.jsx";
import { useGoldRateBoard } from "../../../../hooks/useGoldRateBoard.js";

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

/** Refined editorial gold-rate block — no charts, no trading styling. */
export default function GoldRateSection({ content }) {
  const { status, data: board, error, retry } = useGoldRateBoard();

  return (
    <Section id="gold-rate" background="paper" ariaLabelledby="gold-rate-title">
      <Container className="max-w-5xl">
        <AsyncBoundary
          status={status}
          error={error}
          onRetry={retry}
          isEmpty={status === "success" && !board}
          emptyMessage="Today's gold rates are being refreshed. Please check back shortly."
          className="py-10"
        >
          {board && (
            <div className="border border-border-default bg-surface-secondary/70 px-6 py-10 sm:px-12 sm:py-12">
              <div className="flex flex-col gap-3 border-b border-brand-accent/20 pb-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <Eyebrow>{content.eyebrow}</Eyebrow>
                  <h2
                    id="gold-rate-title"
                    className="mt-3 font-serif text-h2 font-medium text-text-primary sm:text-h1"
                  >
                    {content.title}
                  </h2>
                </div>
                <p className="font-sans text-nav uppercase tracking-[0.2em] text-text-secondary">
                  Updated {dateFormatter.format(new Date(board.updatedAt))}
                </p>
              </div>

              <div className="grid divide-y divide-brand-accent/20 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                {board.rates.map((rate, index) => (
                  <div
                    key={rate.karat}
                    className={`py-8 sm:px-10 ${index === 0 ? "sm:pl-0" : "sm:pr-0"}`}
                  >
                    <p className="font-sans text-nav font-medium uppercase tracking-[0.28em] text-brand-accent-strong">
                      {rate.karat} Gold
                    </p>
                    <p className="mt-3 font-serif text-h1 leading-none text-text-primary sm:text-display">
                      <span className="mr-1 text-h3 align-top text-brand-accent-strong">₹</span>
                      {new Intl.NumberFormat("en-IN").format(rate.pricePer10g)}
                    </p>
                    <p className="mt-2.5 font-sans text-caption tracking-wide text-text-secondary">
                      per {board.unit} · {rate.description}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-2 space-y-1.5 border-t border-brand-accent/20 pt-6">
                <p className="font-sans text-caption leading-relaxed text-text-secondary">{board.note}</p>
                <p className="font-sans text-caption leading-relaxed text-text-secondary">{board.includes}</p>
              </div>

              <div className="mt-6">
                <TextLink href={content.cta.href}>{content.cta.label}</TextLink>
              </div>
            </div>
          )}
        </AsyncBoundary>
      </Container>
    </Section>
  );
}

GoldRateSection.propTypes = {
  content: PropTypes.shape({
    eyebrow: PropTypes.string,
    title: PropTypes.string,
    cta: PropTypes.object,
  }).isRequired,
};
