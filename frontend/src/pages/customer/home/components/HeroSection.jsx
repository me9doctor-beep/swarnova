import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import Button from "../../../../components/ui/Button.jsx";
import Eyebrow from "../../../../components/ui/Eyebrow.jsx";
import CinematicVideo from "../../../../components/ui/CinematicVideo.jsx";
import { useHeroReel } from "../../../../hooks/useHeroReel.js";
import { cn } from "../../../../utils/cn.js";

/**
 * Campaign-led hero — large model imagery / cinematic footage dominates the
 * frame, copy lives in the negative space on the left, CTA treatment matches
 * the reference.
 *
 * Phase 14.4A — CINEMATIC HERO REEL. The hero plays real campaign footage:
 * four ~10 s films (Signature · Bridal · Contemporary · Heritage) that rotate
 * one at a time with a slow crossfade. The abstract champagne-gold placeholder
 * and the Ken Burns drift are gone — when footage plays, the footage is the
 * motion; when it cannot, the campaign photograph stands still.
 *
 * Media priority:
 *   1. The Signature poster (the existing campaign photograph) is painted
 *      immediately as a plain <img> (fetchPriority high) — always present.
 *   2. The active film mounts above it (muted, inline, autoplay) and is
 *      revealed only on the browser's real `playing` event.
 *   3. Reduced motion, no delivered footage, a decode/network failure, or a
 *      refused autoplay all leave the photograph in place; a refused autoplay
 *      also shows the calm play affordance. No black frame, no broken icon.
 *
 * The copy, CTAs, trust line, veils and spacing are unchanged.
 * Rotation/resolution rules: hooks/useHeroReel → services/heroReelService.
 */
export default function HeroSection({ content }) {
  const { title, eyebrow, body, primaryCta, secondaryCta } = content;
  const reel = useHeroReel(content);
  const [entered, setEntered] = useState(false);

  /* Stagger the copy entrance so the brand word-mark arrives first, then the
     headline, then body, then CTAs — a quiet editorial reveal. */
  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const hasVideo = reel.mode === "video" && Boolean(reel.activeSrc);
  const layers = hasVideo
    ? [
        ...(reel.previous ? [{ record: reel.previous, src: reel.previous.resolvedSrc, outgoing: true }] : []),
        { record: reel.active, src: reel.activeSrc, outgoing: false },
      ]
    : [];

  return (
    <section
      aria-label="Featured campaign"
      className="hero relative overflow-hidden bg-ink"
      data-hero-mode={hasVideo ? "video" : "poster"}
      data-hero-active={hasVideo ? reel.active.id : undefined}
    >
      {/* First paint and permanent fallback: the campaign photograph, static.
          No drift, no shimmer — motion comes only from real footage. */}
      <img
        src={reel.poster.src}
        alt={reel.poster.alt}
        className="hero__media hero__poster block w-full h-auto"
        fetchPriority="high"
        decoding="async"
      />

      {/* Cinematic reel: only the active film is mounted as a playing video.
          During a rotation the outgoing film rests on its final frame while
          the incoming one crossfades in above it. */}
      {layers.map(({ record, src, outgoing }) => (
        <div
          key={record.id}
          className={cn(
            "hero__reel-layer absolute inset-0",
            !outgoing && reel.previous && "hero__reel-layer--entering"
          )}
          style={{
            "--hero-crossfade": `${reel.rotation.crossfadeMs}ms`,
            ...(record.focal?.mobile ? { "--hero-focal": record.focal.mobile } : null),
            ...(record.focal?.desktop ? { "--hero-focal-desktop": record.focal.desktop } : null),
          }}
          data-hero-video={record.id}
          data-hero-outgoing={outgoing ? "true" : undefined}
          aria-hidden="true"
        >
          <CinematicVideo
            src={src}
            poster={record.poster}
            alt={record.alt}
            className="hero__media"
            fit="cover"
            position={null}
            preload={outgoing ? "none" : "auto"}
            autoplay={record.autoplay}
            loop={!reel.rotates && record.loop}
            muted
            playsInline
            paused={outgoing}
            holdFinalFrame={reel.rotates}
            showPlayFallback={!outgoing}
            onEnded={outgoing ? undefined : reel.advance}
            onError={() => reel.markFailed(record.id)}
          />
        </div>
      ))}

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

      {/* Reel position — four hairlines, deliberately faint and
          non-interactive; present only while more than one film can play. */}
      {hasVideo && reel.rotates ? (
        <div className="hero__reel-index pointer-events-none absolute bottom-6 right-6 z-[2] flex gap-2 sm:right-10" aria-hidden="true">
          {reel.playable.map((record, index) => (
            <span
              key={record.id}
              className={cn(
                "block h-px w-5 transition-colors duration-[1200ms]",
                index === reel.activeIndex ? "bg-brand-accent-soft/70" : "bg-surface-muted/20"
              )}
            />
          ))}
        </div>
      ) : null}

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
    rotation: PropTypes.shape({
      enabled: PropTypes.bool,
      maxClipMs: PropTypes.number,
      crossfadeMs: PropTypes.number,
    }),
    /** Phase 14.4A reel — each record is the shared media contract. */
    videos: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        title: PropTypes.string,
        src: PropTypes.string,
        mobileSrc: PropTypes.string,
        poster: PropTypes.string,
        alt: PropTypes.string,
        autoplay: PropTypes.bool,
        loop: PropTypes.bool,
        muted: PropTypes.bool,
        playsInline: PropTypes.bool,
        placement: PropTypes.string,
      })
    ),
  }).isRequired,
};
