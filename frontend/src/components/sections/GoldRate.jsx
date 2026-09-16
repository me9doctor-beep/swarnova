import PropTypes from "prop-types";
import Section from "../ui/Section.jsx";
import Container from "../ui/Container.jsx";
import Eyebrow from "../ui/Eyebrow.jsx";
import TextLink from "../ui/TextLink.jsx";
import AsyncBoundary from "../ui/AsyncBoundary.jsx";
import { useGoldRateBoard } from "../../hooks/useContent.js";

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

/** Refined editorial gold-rate block — no charts, no trading styling. */
export default function GoldRate({ content }) {
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
            <div className="border border-line bg-ivory/70 px-6 py-10 sm:px-12 sm:py-12">
              <div className="flex flex-col gap-3 border-b border-gold/20 pb-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <Eyebrow>{content.eyebrow}</Eyebrow>
                  <h2
                    id="gold-rate-title"
                    className="mt-3 font-serif text-[30px] font-medium text-ink"
                  >
                    {content.title}
                  </h2>
                </div>
                <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-ash">
                  Updated {dateFormatter.format(new Date(board.updatedAt))}
                </p>
              </div>

              <div className="grid divide-y divide-gold/20 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                {board.rates.map((rate, index) => (
                  <div
                    key={rate.karat}
                    className={`py-8 sm:px-10 ${index === 0 ? "sm:pl-0" : "sm:pr-0"}`}
                  >
                    <p className="font-sans text-[11px] font-medium uppercase tracking-[0.28em] text-gold-deep">
                      {rate.karat} Gold
                    </p>
                    <p className="mt-3 font-serif text-[40px] leading-none text-ink">
                      <span className="mr-1 text-[26px] align-top text-gold-deep">₹</span>
                      {new Intl.NumberFormat("en-IN").format(rate.pricePer10g)}
                    </p>
                    <p className="mt-2.5 font-sans text-[12px] tracking-wide text-ash">
                      per {board.unit} · {rate.description}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-2 space-y-1.5 border-t border-gold/20 pt-6">
                <p className="font-sans text-[11.5px] leading-relaxed text-ash">{board.note}</p>
                <p className="font-sans text-[11.5px] leading-relaxed text-ash">{board.includes}</p>
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

GoldRate.propTypes = {
  content: PropTypes.shape({
    eyebrow: PropTypes.string,
    title: PropTypes.string,
    cta: PropTypes.object,
  }).isRequired,
};
