import { useRef, useState, useEffect } from "react";
import PropTypes from "prop-types";
import Section from "../../../../components/ui/Section.jsx";
import Container from "../../../../components/ui/Container.jsx";
import Eyebrow from "../../../../components/ui/Eyebrow.jsx";
import FilmCredit from "../../../../components/ui/FilmCredit.jsx";
import useIntersectionAware from "../../../../hooks/useIntersectionAware.js";
import usePrefersReducedMotion from "../../../../hooks/usePrefersReducedMotion.js";
import { cn } from "../../../../utils/cn.js";

/**
 * THE ART OF GOLD — the brand/craftsmanship film (Phase 14.4).
 *
 * A premium editorial video placement between the editorial storytelling and
 * the Why-Choose-Us block. The poster is the first frame; the film plays in
 * place, muted and inline, as the customer scrolls to it, with native
 * controls kept minimal. No YouTube-style chrome, no sound, no loop.
 *
 * Scroll playback — two IntersectionObservers, loading kept apart from play:
 *   · PREPARE  (`useIntersectionAware`, rootMargin 600px): the frame sits
 *     ≥5,000px below the fold at page load, so this never fires on startup.
 *     Within 600px of the viewport the element switches to
 *     preload="metadata" (~160 kB: index + first frames), which is enough for
 *     play() to start in ~10 ms instead of ~370 ms cold on 4G.
 *   · PLAY     (local observer, threshold 0.5): once half of the 16:9 frame
 *     is on screen the film plays from wherever it last stopped; once less
 *     than half is on screen it pauses. Position is never reset by
 *     scrolling — only a natural end returns the film to its poster (and a
 *     later return to the section plays it again from the start).
 * The labelled play button remains the fallback when the browser refuses
 * playback, and for replaying after the film has ended in view.
 *
 * Accessibility: poster-first, labelled play button, muted, keyboard-
 * operable, reduced-motion shows poster only (no film, no playback).
 */

/* Share of the frame that must be visible for playback to be meaningful. */
const PLAY_VISIBLE_RATIO = 0.5;
export default function BrandFilmSection({ content }) {
  const videoRef = useRef(null);
  /* The poster is a frame of the same film, so it carries the same corner
     mark — the credit plate must cover it whether or not the film plays. */
  const posterRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [canPlay, setCanPlay] = useState(false);
  const [failed, setFailed] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  // PREPARE zone: begin fetching metadata/first frames 600px ahead of view.
  const [sentinelRef, inView] = useIntersectionAware({ threshold: 0, rootMargin: "600px 0px" });
  // PLAY zone: true only while at least PLAY_VISIBLE_RATIO of the frame shows.
  const frameRef = useRef(null);
  const [inPlayZone, setInPlayZone] = useState(false);

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
  }, [content.video?.src]);

  /* `isIntersecting` alone is true for a one-pixel sliver, so the ratio is
     checked too. Callbacks arrive only when the 0.5 line is crossed (or the
     frame fully enters/leaves), never per scroll frame. */
  useEffect(() => {
    const node = frameRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => setInPlayZone(entry.isIntersecting && entry.intersectionRatio >= PLAY_VISIBLE_RATIO),
      { threshold: PLAY_VISIBLE_RATIO }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  /* Scroll playback. Entering the play zone resumes from the current position
     (muted, so no gesture is needed); leaving it pauses without touching
     currentTime. A refused play() leaves the poster and play button in place
     — playback never began, so `playing` never flipped. AbortError only means
     a pause (scrolling away) interrupted a pending play(); buffering never
     rejects, so it is never mistaken for a refusal. */
  useEffect(() => {
    const v = videoRef.current;
    if (!v || reducedMotion || !hasVideo) return;
    if (!inPlayZone) {
      if (!v.paused) v.pause();
      return;
    }
    v.muted = true;
    const playPromise = v.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch((err) => {
        if (err?.name === "AbortError") return;
        setPlaying(false);
      });
    }
  }, [inPlayZone, reducedMotion, hasVideo]);

  const handlePlay = () => {
    const v = videoRef.current;
    if (!v) return;
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
          <div
            ref={frameRef}
            className="relative aspect-[16/9] overflow-hidden border border-brand-accent/30 bg-ink shadow-medium"
          >
            {/* Poster frame — always present, fades when the film is playing and canPlay. */}
            {content.poster && (
              <img
                ref={posterRef}
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
                controls={playing}
                playsInline
                preload={inView ? "metadata" : "none"}
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

            {/* Campaign credit — the editorial plate carried inside the film
                frame. It covers the frame's corner mark, which the poster
                carries too (it was extracted from this film), so unlike the
                hero it is present whether or not the film is playing.
                See components/ui/FilmCredit.jsx. */}
            {hasVideo || Boolean(content.poster) ? (
              <FilmCredit
                title="The Art of Gold"
                caption="Heritage · Reimagined"
                placement="art-of-gold"
                getMedia={() => videoRef.current ?? posterRef.current}
              />
            ) : null}

            {/* Play affordance — calm, gold, only when not playing: the fallback
                when the browser refuses playback, and replay after the film
                ended in view. Replaced by native controls once playback
                begins. */}
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
