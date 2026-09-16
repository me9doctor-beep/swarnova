import PropTypes from "prop-types";
import Button from "../../../../components/ui/Button.jsx";
import Eyebrow from "../../../../components/ui/Eyebrow.jsx";

/**
 * Campaign-led hero — large model imagery dominates the frame, copy lives
 * in the negative space on the left, CTA treatment matches the reference.
 *
 * One composition at every width, held together by the `hero__*` hooks in
 * index.css: the photograph is a full-bleed cover layer, the section is a flex
 * column floored at the photograph's own aspect ratio, and the copy sits in
 * normal flow — so the hero grows to fit its copy instead of clipping it on
 * phones, tablets and laptops alike.
 */
export default function HeroSection({ content }) {
  const { title, eyebrow, body, primaryCta, secondaryCta, image } = content;

  return (
    <section
      aria-label="Featured campaign"
      className="hero relative overflow-hidden bg-ink"
    >
      {/* Full-bleed campaign photograph; its ratio sets the hero's floor. */}
      <img
        src={image.src}
        alt={image.alt}
        className="hero__media block w-full h-auto"
        fetchPriority="high"
        aria-hidden="true"
      />

      {/* Gradient veil over the image so copy stays legible */}
      <div
        className="hero__veil absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/40 to-transparent"
        aria-hidden="true"
      />
      {/* Subtle top fade for nav readability */}
      <div
        className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-ink/30 to-transparent"
        aria-hidden="true"
      />

      {/* Copy block — in flow, vertically centred in whatever height the hero
          takes, so it is never cropped by the section. */}
      <div className="hero__copy flex items-center">
        <div className="hero__copy-inner shell relative w-full pb-20 pt-[160px] sm:pt-[180px]">
          <div className="max-w-[520px]">

            {/* Ornamental top rule */}
            <div className="mb-6 flex items-center gap-3" aria-hidden="true">
              <div className="h-px w-8 bg-gold/60" />
              <div className="h-[5px] w-[5px] rotate-45 border border-gold/60" />
            </div>

            {eyebrow && (
              <Eyebrow tone="gold" className="text-champagne/80 tracking-[0.38em]">
                {eyebrow}
              </Eyebrow>
            )}

            <h1 className="hero__title mt-4 font-serif text-[52px] font-medium leading-[1.04] text-cream sm:text-[64px] lg:text-[76px]">
              {title.lines.map((line, index) => (
                <span key={`${line.text}-${index}`} className="block">
                  <span className={line.emphasis ? "italic text-gold" : undefined}>
                    {line.text}
                  </span>
                </span>
              ))}
            </h1>

            {/* Ornamental divider below headline */}
            <div className="mt-7 mb-6 flex items-center gap-4" aria-hidden="true">
              <div className="h-px flex-1 max-w-[80px] bg-gold/40" />
              <div className="h-px flex-1 max-w-[200px] bg-cream/10" />
            </div>

            <p className="hero__body max-w-sm text-[14.5px] leading-[1.9] text-cream/65 font-light tracking-wide">
              {body}
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-4">
              <Button href={primaryCta.href}>{primaryCta.label}</Button>
              <Button href={secondaryCta.href} variant="outlineInverse">
                {secondaryCta.label}
              </Button>
            </div>

            {/* Bottom badge / trust micro-copy */}
            <p className="hero__micro mt-10 text-[10px] font-sans uppercase tracking-[0.3em] text-cream/35">
              BIS Hallmarked &nbsp;·&nbsp; Lifetime Exchange &nbsp;·&nbsp; Free Shipping
            </p>
          </div>
        </div>
      </div>

      {/* Gold hairline at the bottom */}
      <div
        className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-gold/50 via-gold/20 to-transparent"
        aria-hidden="true"
      />
    </section>
  );
}

HeroSection.propTypes = {
  content: PropTypes.shape({
    eyebrow: PropTypes.string,
    title: PropTypes.object.isRequired,
    body: PropTypes.string,
    primaryCta: PropTypes.object,
    secondaryCta: PropTypes.object,
    image: PropTypes.object,
  }).isRequired,
};
