import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import Button from "../../../../components/ui/Button.jsx";
import Eyebrow from "../../../../components/ui/Eyebrow.jsx";
import CinematicVideo from "../../../../components/ui/CinematicVideo.jsx";
import usePrefersReducedMotion from "../../../../hooks/usePrefersReducedMotion.js";
import { cn } from "../../../../utils/cn.js";

/**
 * Campaign-led hero — large model imagery / cinematic footage dominates the
 * frame, copy lives in the negative space on the left, CTA treatment matches
 * the reference.
 *
 * Phase 14.4: the static hero photograph becomes a cinematic background video
 * with a graceful poster-first lifecycle. The copy remains real HTML above
 * the media layer; the composition, type hierarchy, veils and CTA behaviour
 * are unchanged.
 *
 * Media priority:
 *   1. Poster image is painted immediately (fetchPriority high).
 *   2. Cinematic video begins muted-autoplaying only after canplay, then
 *      crossfades in over the poster.
 *   3. If video fails, or reduced-motion is enabled, or autoplay is rejected,
 *      the poster remains — no black frame, no broken icon, no degradation
 *      of copy legibility.
 */
export default function HeroSection({ content }) {
  const { title, eyebrow, body, primaryCta, secondaryCta, image, video } = content;
  const reducedMotion = usePrefersReducedMotion();
  const [entered, setEntered] = useState(false);

  /* Stagger the copy entrance so the brand word-mark arrives first, then the
     headline, then body, then CTAs — a quiet editorial reveal. */
  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const hasVideo = Boolean(video?.src) && !reducedMotion;

  return (
    <section
      aria-label="Featured campaign"
      className="hero relative overflow-hidden bg-ink"
    >
      {/* Cinematic media layer: video when available, poster always first.
          showPlayFallback ensures a calm tap affordance appears if autoplay is blocked
          (iOS low-power, data-saver) rather than leaving a paused-looking frame. */}
      {hasVideo ? (
        <CinematicVideo
          src={video.src}
          mobileSrc={video.mobileSrc}
          poster={image.src}
          alt={image.alt}
          className="hero__media"
          fit="cover"
          position="64% 26%"
          preload="metadata"
          autoplay
          loop
          muted
          playsInline
          showPlayFallback
        />
      ) : (
        <img
          src={image.src}
          alt={image.alt}
          className={cn("hero__media block w-full h-auto", "motion-ken-burns")}
          fetchPriority="high"
          aria-hidden="true"
        />
      )}

      {/* Gradient veil over the media so copy stays legible. Decorative over the
          media layer: pointer-events-none so clicks fall through to the
          tap-to-play affordance beneath when autoplay is blocked. */}
      <div
        className="hero__veil pointer-events-none absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/40 to-transparent"
        aria-hidden="true"
      />
      {/* Subtle top fade for nav readability */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-ink/30 to-transparent"
        aria-hidden="true"
      />

      {/* Copy block — in flow, vertically centred in whatever height the hero
          takes, so it is never cropped by the section. */}
      <div className="hero__copy flex items-center">
        <div className="hero__copy-inner shell relative w-full pb-20">
          <div className={cn("max-w-[520px]", entered && "motion-reveal")}>

            {/* Ornamental top rule */}
            <div
              className={cn("mb-6 flex items-center gap-3", entered && "motion-reveal")}
              data-delay="1"
              aria-hidden="true"
            >
              <div className="h-px w-8 bg-brand-accent/60" />
              <div className="h-[5px] w-[5px] rotate-45 border border-brand-accent/60" />
            </div>

            {eyebrow && (
              <Eyebrow
                tone="gold"
                className={cn(
                  "text-brand-accent-soft/80 tracking-[0.38em]",
                  entered && "motion-reveal"
                )}
                data-delay="1"
              >
                {eyebrow}
              </Eyebrow>
            )}

            <h1
              className={cn(
                "hero__title mt-5 font-serif font-medium leading-[1.06] text-h1 text-text-inverse sm:text-display lg:text-[3.5rem]",
                entered && "motion-reveal"
              )}
              data-delay="2"
            >
              {title.lines.map((line, index) => (
                <span key={`${line.text}-${index}`} className="block">
                  <span className={line.emphasis ? "italic text-brand-accent" : undefined}>
                    {line.text}
                  </span>
                </span>
              ))}
            </h1>

            {/* Ornamental divider below headline */}
            <div
              className={cn("mt-7 mb-6 flex items-center gap-4", entered && "motion-reveal")}
              data-delay="3"
              aria-hidden="true"
            >
              <div className="h-px flex-1 max-w-[80px] bg-brand-accent/40" />
              <div className="h-px flex-1 max-w-[200px] bg-surface-muted/10" />
            </div>

            <p
              className={cn(
                "hero__body max-w-sm text-body leading-[1.9] text-text-inverse/70 font-light tracking-wide",
                entered && "motion-reveal"
              )}
              data-delay="3"
            >
              {body}
            </p>

            <div
              className={cn(
                "mt-10 flex flex-wrap items-center gap-x-4 gap-y-4",
                entered && "motion-reveal"
              )}
              data-delay="4"
            >
              {primaryCta ? <Button href={primaryCta.href}>{primaryCta.label}</Button> : null}
              {secondaryCta ? (
                <Button href={secondaryCta.href} variant="outlineInverse">
                  {secondaryCta.label}
                </Button>
              ) : null}
            </div>

            {/* Bottom badge / trust micro-copy */}
            <p
              className={cn(
                "hero__micro mt-10 text-label font-light uppercase tracking-[0.3em] text-text-inverse/45",
                entered && "motion-reveal"
              )}
              data-delay="5"
            >
              BIS Hallmarked &nbsp;·&nbsp; Lifetime Exchange &nbsp;·&nbsp; Free Shipping
            </p>
          </div>
        </div>
      </div>

      {/* Gold hairline at the bottom */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-brand-accent/50 via-brand-accent/20 to-transparent"
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
    video: PropTypes.shape({
      src: PropTypes.string,
      mobileSrc: PropTypes.string,
      poster: PropTypes.string,
    }),
  }).isRequired,
};
