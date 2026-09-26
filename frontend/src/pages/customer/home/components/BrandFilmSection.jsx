import { useRef, useState } from "react";
import PropTypes from "prop-types";
import Section from "../../../../components/ui/Section.jsx";
import Container from "../../../../components/ui/Container.jsx";
import Eyebrow from "../../../../components/ui/Eyebrow.jsx";
import useIntersectionAware from "../../../../hooks/useIntersectionAware.js";
import usePrefersReducedMotion from "../../../../hooks/usePrefersReducedMotion.js";
import { cn } from "../../../../utils/cn.js";

/**
 * THE ART OF GOLD — the brand/craftsmanship film (Phase 14.4).
 *
 * A premium editorial video placement between the editorial storytelling and
 * the Why-Choose-Us block. Initial state shows the cinematic poster with a
 * restrained play affordance; pressing play begins the film in place, with
 * native controls kept minimal. No YouTube-style chrome, no auto-play with
 * sound, no decorative carousel. The film is a quiet invitation, not an
 * auto-starting billboard.
 *
 * Accessibility: poster-first, labelled play button, muted, keyboard-
 * operable, reduced-motion shows poster only.
 */
export default function BrandFilmSection({ content }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [canPlay, setCanPlay] = useState(false);
  const [failed, setFailed] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const [sentinelRef, inView] = useIntersectionAware();

  const hasVideo = Boolean(content.video?.src) && !failed;
  const showPoster = !playing || !canPlay || failed || reducedMotion;

  const handlePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = false;
    v.play()
      .then(() => setPlaying(true))
      .catch(() => {
        /* If unmuted autoplay is rejected (common), retry muted. */
        v.muted = true;
        v.play().then(() => setPlaying(true)).catch(() => {});
      });
  };

  const handlePause = () => {
    setPlaying(false);
  };

  const handleEnded = () => {
    setPlaying(false);
    if (videoRef.current) videoRef.current.currentTime = 0;
  };

  return (
    <Section
      id="art-of-gold"
      background="cream"
      ariaLabelledby="brand-film-title"
      className="overflow-hidden"
    >
      <Container>
        <div className="mx-auto max-w-4xl text-center">
          <Eyebrow>{content.eyebrow}</Eyebrow>
          <h2
            id="brand-film-title"
            className="mt-5 font-serif text-h1 font-medium leading-[1.14] sm:text-display"
          >
            {content.title}
          </h2>
          <p className="mx-auto mt-5 max-w-xl font-serif text-h4 italic leading-relaxed text-brand-accent-strong">
            {content.lead}
          </p>
        </div>

        <div
          ref={sentinelRef}
          className="relative mx-auto mt-12 max-w-5xl"
        >
          <div className="relative aspect-[16/9] overflow-hidden border border-brand-accent/30 bg-ink shadow-medium">
            {/* Poster frame — always present, fades when the film is playing. */}
            {content.poster && (
              <img
                src={content.poster}
                alt={content.video?.alt ?? content.title}
                className={cn(
                  "absolute inset-0 h-full w-full object-cover transition-opacity duration-700",
                  !showPoster ? "opacity-0" : "opacity-100"
                )}
                loading="lazy"
              />
            )}

            {/* The film */}
            {hasVideo && !reducedMotion && (
              <video
                ref={videoRef}
                className={cn(
                  "absolute inset-0 h-full w-full object-cover transition-opacity duration-700",
                  playing && canPlay ? "opacity-100" : "opacity-0"
                )}
                src={content.video.src}
                poster={content.poster}
                controls={playing}
                playsInline
                preload={inView ? "metadata" : "none"}
                onCanPlay={() => setCanPlay(true)}
                onPlay={() => setPlaying(true)}
                onPause={handlePause}
                onEnded={handleEnded}
                onError={() => setFailed(true)}
                aria-label={content.video?.alt ?? content.title}
              />
            )}

            {/* Subtle vignette for film feel */}
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-ink/10"
              aria-hidden="true"
            />

            {/* Play affordance — calm, gold, only when not playing. Replaced by
                native controls once playback begins. */}
            {!playing && !reducedMotion && hasVideo && (
              <button
                type="button"
                onClick={handlePlay}
                aria-label={content.playLabel ?? "Play the art of gold film"}
                className="group absolute inset-0 z-10 flex items-center justify-center transition-colors duration-500 hover:bg-ink/20"
              >
                <span className="flex h-20 w-20 items-center justify-center rounded-full border border-brand-accent-soft/80 bg-ink/40 backdrop-blur-[2px] transition-transform duration-500 group-hover:scale-105">
                  <svg
                    width="22"
                    height="24"
                    viewBox="0 0 22 24"
                    fill="none"
                    aria-hidden="true"
                    className="ml-1 text-brand-accent-soft"
                  >
                    <path d="M1 1.5L21 12L1 22.5V1.5Z" fill="currentColor" />
                  </svg>
                </span>
              </button>
            )}
          </div>

          {/* Caption */}
          <p className="mt-5 text-center font-sans text-label uppercase tracking-[0.24em] text-text-muted">
            {content.caption}
          </p>
        </div>
      </Container>
    </Section>
  );
}

BrandFilmSection.propTypes = {
  content: PropTypes.shape({
    eyebrow: PropTypes.string,
    title: PropTypes.string.isRequired,
    lead: PropTypes.string,
    caption: PropTypes.string,
    poster: PropTypes.string,
    playLabel: PropTypes.string,
    video: PropTypes.shape({
      src: PropTypes.string,
      alt: PropTypes.string,
    }),
  }).isRequired,
};
