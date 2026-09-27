import { useRef, useState, useEffect } from "react";
import PropTypes from "prop-types";
import Section from "../../../../components/ui/Section.jsx";
import Container from "../../../../components/ui/Container.jsx";
import Eyebrow from "../../../../components/ui/Eyebrow.jsx";
import MediaSticker from "../../../../components/ui/MediaSticker.jsx";
import useIntersectionAware from "../../../../hooks/useIntersectionAware.js";
import usePrefersReducedMotion from "../../../../hooks/usePrefersReducedMotion.js";
import { cn } from "../../../../utils/cn.js";

/**
 * THE ART OF GOLD — the brand/craftsmanship film (Phase 14.4 / 14.4D).
 *
 * A premium editorial video placement between the editorial storytelling and
 * the Why-Choose-Us block. The film begins by itself, muted, as the customer
 * scrolls towards it: `preload` flips to "auto" and playback starts one
 * viewport-margin (300px) before the frame is on screen, so what arrives in
 * view is a film already running — never a poster waiting for a tap, and
 * never a stall while the first frames buffer. Scrolling away pauses it;
 * scrolling back resumes from the same frame.
 *
 * The play affordance is no longer the way in — it is the fallback for the
 * only case that needs one: a genuinely refused autoplay (low-power mode,
 * data saver), or a replay after the film has ended. No player chrome: the
 * delivery has no audio track, so there is nothing to control but the pause
 * the scroll already does.
 *
 * Accessibility: poster-first, muted, inline, reduced-motion shows poster
 * only, and the fallback button stays a labelled, keyboard-operable control.
 */
export default function BrandFilmSection({ content }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [canPlay, setCanPlay] = useState(false);
  const [failed, setFailed] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);
  const [ended, setEnded] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const [sentinelRef, inView] = useIntersectionAware({ threshold: 0.1, rootMargin: "300px 0px" });

  const hasVideo = Boolean(content.video?.src) && !failed;
  // Poster visible until film is actually playing and canPlay, or when failed/reducedMotion
  // We keep poster visible while canPlay is false to avoid black frame during load
  const showPoster = !playing || !canPlay || failed || reducedMotion;

  // Reset state when src changes or when reduced motion toggles
  useEffect(() => {
    if (reducedMotion) {
      setPlaying(false);
    }
  }, [reducedMotion]);

  useEffect(() => {
    setCanPlay(false);
    setPlaying(false);
    setFailed(false);
    setNeedsTap(false);
    setEnded(false);
  }, [content.video?.src]);

  /* Autoplay: muted, inline, and only once the browser has parsed enough of
     the file to advance frames. Starting it one margin ahead of the viewport
     is what makes the arrival smooth — the film is already moving when the
     customer gets there. A rejected play() means a real policy block, so we
     surface the calm tap affordance rather than leave a paused frame. */
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hasVideo || !inView || !canPlay || ended || reducedMotion) return undefined;
    if (!video.paused) return undefined;
    video.muted = true;
    let cancelled = false;
    const attempt = video.play();
    if (attempt && typeof attempt.catch === "function") {
      attempt.catch((err) => {
        if (cancelled || err?.name === "AbortError") return;
        setNeedsTap(true);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [hasVideo, inView, canPlay, ended, reducedMotion]);

  /* Pausing is this effect's only job; starting playback belongs to the one
     above, so the two can never fight over the same element. Leaving the
     section also re-arms the film, so a later scroll back replays it. */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if ((!inView || reducedMotion || failed) && !video.paused) {
      video.pause();
    }
    if (!inView) setEnded(false);
  }, [inView, reducedMotion, failed]);

  const handlePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    setNeedsTap(false);
    setEnded(false);
    // Ensure video is ready to play — if preload was none, this will trigger loading
    // Try unmuted first (user gesture allows sound), fallback to muted if blocked
    v.muted = false;
    const playPromise = v.play();
    if (playPromise && typeof playPromise.then === "function") {
      playPromise
        .then(() => {
          setPlaying(true);
        })
        .catch(() => {
          // If unmuted autoplay is rejected (common), retry muted
          v.muted = true;
          const retry = v.play();
          if (retry && typeof retry.then === "function") {
            retry
              .then(() => setPlaying(true))
              .catch(() => {
                // If even muted fails, stay on poster — no broken UI
                setPlaying(false);
              });
          } else {
            // Fallback for browsers without promise
            setPlaying(true);
          }
        });
    } else {
      // Older browsers without promise
      setPlaying(true);
    }
  };

  const handlePause = () => {
    setPlaying(false);
  };

  const handleEnded = () => {
    setPlaying(false);
    setEnded(true);
    if (videoRef.current) {
      try {
        videoRef.current.currentTime = 0;
      } catch {
        // Ignore if currentTime not settable
      }
    }
  };

  const handleCanPlay = () => {
    setCanPlay(true);
    setFailed(false);
  };

  const handleError = () => {
    setFailed(true);
    setCanPlay(false);
    setPlaying(false);
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
            {/* Poster frame — always present, fades when the film is playing and canPlay. */}
            {content.poster && (
              <img
                src={content.poster}
                alt={content.video?.alt ?? content.title}
                className={cn(
                  "absolute inset-0 h-full w-full object-cover transition-opacity duration-700",
                  !showPoster ? "opacity-0" : "opacity-100"
                )}
                loading="lazy"
                decoding="async"
              />
            )}

            {/* The film — native video with explicit ref handling and promise-aware play() */}
            {hasVideo && !reducedMotion && (
              <video
                ref={videoRef}
                className={cn(
                  "absolute inset-0 h-full w-full object-cover transition-opacity duration-700",
                  playing && canPlay ? "opacity-100" : "opacity-0"
                )}
                src={content.video.src}
                poster={content.poster}
                playsInline
                muted
                preload={inView ? "auto" : "none"}
                onCanPlay={handleCanPlay}
                onLoadedData={handleCanPlay}
                onLoadedMetadata={handleCanPlay}
                onCanPlayThrough={handleCanPlay}
                onPlay={() => setPlaying(true)}
                /* `playing` — not `play` — is the event that proves frames are
                   actually advancing; it is the gate for revealing the film
                   over the poster, so the UI never claims a playback that
                   stalled at the first frame. */
                onPlaying={() => setPlaying(true)}
                onPause={handlePause}
                onEnded={handleEnded}
                onError={handleError}
                aria-label={content.video?.alt ?? content.title}
              />
            )}

            {/* Subtle vignette for film feel */}
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-ink/10"
              aria-hidden="true"
            />

            {/* House seal over the film's corner — the delivered footage carries
                a small star mark there. */}
            {hasVideo ? <MediaSticker corner="bottom-right" size="sm" /> : null}

            {/* Play affordance — a fallback, not the way in: shown only when a
                real policy block refused autoplay, or to replay a finished
                film. While the film runs there is no chrome of any kind. */}
            {(needsTap || ended) && !playing && !reducedMotion && hasVideo && (
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
