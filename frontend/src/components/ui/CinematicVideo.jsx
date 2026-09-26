import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { cn } from "../../utils/cn.js";
import usePrefersReducedMotion from "../../hooks/usePrefersReducedMotion.js";
import useIntersectionAware from "../../hooks/useIntersectionAware.js";

/**
 * CINEMATIC VIDEO — a lightweight wrapper over the native `<video>` element,
 * built for Swarnova's hero and brand-film placements.
 *
 * ---------------------------------------------------------------------------
 * PLAYBACK STATE MACHINE (Phase 14.4 Hotfix 2)
 * ---------------------------------------------------------------------------
 *   LOADING → READY → PLAYING          the happy path
 *                 ↘ BLOCKED            autoplay was refused (needs a tap)
 *                 ↘ FAILED             decode/network error → poster remains
 *
 * The states are deliberately distinct, because conflating them is exactly
 * what made the hero look frozen:
 *
 *   • `canPlay` — the element has parsed enough of the file to *attempt*
 *                 playback. It is set by `loadedmetadata` as well as
 *                 `loadeddata`/`canplay`, because a hero served with
 *                 `preload="metadata"` can sit at HAVE_METADATA forever and
 *                 never fire `canplay` on its own. Gating play() on the
 *                 `canplay` event alone therefore deadlocked: no play() → no
 *                 buffering → no `canplay`.
 *
 *                 `canPlay` means "worth trying". It deliberately does NOT mean
 *                 "the film is on screen" — that is `playing`, and only
 *                 `playing` reveals the video.
 *   • `playing` — the browser fired the real `playing` event. Only this makes
 *                 the video visible. `ready` never does, so the component can
 *                 never claim playback that is not actually advancing.
 *   • `failed`  — the media pipeline errored. The `<video>` is removed and the
 *                 poster stands in, which is the designed fallback rather than
 *                 a black or broken frame.
 *
 * The resolved state is mirrored onto `data-playback-state` so the lifecycle
 * is observable in DevTools and in tests without reaching into React.
 *
 * ---------------------------------------------------------------------------
 * LAYERING
 * ---------------------------------------------------------------------------
 * Inside `.cinematic-media-wrap` the poster `<img>` sits at z-index 0 and the
 * `<video>` at z-index 1 (both rules live unlayered in index.css so they win
 * over Tailwind's layered utilities). The premium gradient veil is *outside*
 * this component, in the section that owns the composition.
 *
 * Other behaviour:
 *   - Muted autoplay + loop + playsInline (mobile-safe).
 *   - `mobileSrc` is resolved in React via a 767px matchMedia query rather than
 *     `<source media>`, which is unreliable across engines.
 *   - Off-screen media is paused via IntersectionObserver so a film the
 *     customer scrolled past costs no decode time.
 *   - Respects `prefers-reduced-motion`: read through the
 *     `usePrefersReducedMotion` hook, which exposes the `prefersReducedMotion`
 *     preference. No autoplay, no video element, poster is the experience.
 *
 * This is NOT a YouTube-style media player. It renders one media layer beneath
 * the page's own HTML copy, exactly as the spec prescribes.
 */
export default function CinematicVideo({
  src,
  mobileSrc,
  poster,
  alt,
  className,
  autoplay = true,
  loop = true,
  muted = true,
  playsInline = true,
  preload = "metadata",
  showPlayFallback = false,
  paused = false,
  fit = "cover",
  position = "center",
  onReady,
  onError,
}) {
  const videoRef = useRef(null);
  const [canPlay, setCanPlay] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);
  const [failed, setFailed] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const reducedMotion = usePrefersReducedMotion();
  const [rootRef, inView] = useIntersectionAware({ threshold: 0.1, rootMargin: "100px 0px" });

  // Mobile viewport detection — robust alternative to <source media>.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mql = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mql.matches);
    update();
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", update);
      return () => mql.removeEventListener("change", update);
    }
    if (typeof mql.addListener === "function") {
      mql.addListener(update);
      return () => mql.removeListener(update);
    }
    return undefined;
  }, []);

  const effectiveSrc = isMobile && mobileSrc ? mobileSrc : src;

  // Reset the lifecycle whenever the source changes (mobile ↔ desktop switch).
  useEffect(() => {
    setCanPlay(false);
    setPlaying(false);
    setFailed(false);
    setNeedsTap(false);
    setUserPaused(false);
  }, [effectiveSrc]);

  // Autoplay is muted-only and therefore permitted without a gesture on every
  // engine we target; a rejection means a genuine policy block (iOS low-power
  // mode, data-saver, an aggressive browser setting) and flips us to the calm
  // tap-to-play affordance rather than leaving a paused-looking frame.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;
    if (!autoplay || paused || reducedMotion || userPaused || failed) return undefined;
    if (!canPlay || !inView) return undefined;

    let cancelled = false;
    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch((err) => {
        if (cancelled) return;
        // AbortError only means pause() raced play() — not a policy block.
        if (err && err.name === "AbortError") return;
        setNeedsTap(true);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [autoplay, paused, reducedMotion, userPaused, failed, canPlay, inView]);

  // External pause control + off-screen pausing. Pausing only — starting
  // playback is the single responsibility of the effect above, so the two can
  // never fight over the same element.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const shouldPause = paused || !inView || failed || userPaused || reducedMotion || !canPlay;
    if (shouldPause && !video.paused) {
      video.pause();
    }
  }, [paused, inView, failed, userPaused, reducedMotion, canPlay]);

  // Keep the element's muted *property* in step with the prop. Some engines
  // read the property (not the attribute) when deciding whether autoplay is
  // permitted, and an unmuted element is refused.
  useEffect(() => {
    const video = videoRef.current;
    if (video) video.muted = muted;
  }, [muted]);

  /** Enough of the file has parsed that a play() attempt is worth making.
      Deliberately does NOT clear `needsTap`: a readiness event fires after a
      blocked autoplay too, and clearing the fallback here would swallow the
      calm play affordance before the customer ever sees it. Only a confirmed
      `playing` event (handlePlaying) or an explicit tap may clear it. */
  const handleCanPlay = () => {
    setCanPlay(true);
    setFailed(false);
  };

  /** The browser is genuinely advancing frames — the only honest reveal gate. */
  const handlePlaying = () => {
    setPlaying(true);
    setNeedsTap(false);
    setFailed(false);
    onReady?.();
  };

  const handlePause = () => setPlaying(false);

  const handleEnded = () => setPlaying(false);

  const handleError = () => {
    setFailed(true);
    setCanPlay(false);
    setPlaying(false);
    onError?.();
  };

  const handleTapToPlay = () => {
    const video = videoRef.current;
    if (!video) return;
    setNeedsTap(false);
    setUserPaused(false);
    setFailed(false);
    video.muted = muted;
    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => setNeedsTap(true));
    }
  };

  const playbackState = failed
    ? "failed"
    : playing
      ? "playing"
      : needsTap
        ? "blocked"
        : canPlay
          ? "ready"
          : reducedMotion
            ? "reduced-motion"
            : "loading";

  const objectFit = fit;
  const objectPosition = position;
  // The video is revealed only once the browser confirms it is advancing.
  const videoRevealed = playing && !failed;

  return (
    <div
      ref={rootRef}
      data-playback-state={playbackState}
      className={cn("cinematic-media-wrap absolute inset-0 h-full w-full overflow-hidden", className)}
    >
      {/* Poster — always rendered; the video fades in over it once playing. */}
      {poster && (
        <img
          src={poster}
          alt={alt}
          aria-hidden="true"
          className={cn(
            "cinematic-media transition-opacity duration-700",
            videoRevealed ? "opacity-0" : "opacity-100"
          )}
          style={{ objectFit, objectPosition }}
          loading="eager"
          decoding="async"
        />
      )}

      {/* Native video — uses the resolved effectiveSrc (mobile vs desktop).
          Not rendered when the source is missing, when the pipeline failed, or
          when reduced motion rules out autoplay and the customer has not
          opted in by tapping play. */}
      {effectiveSrc && !failed && !(reducedMotion && autoplay && !needsTap) && (
        <video
          ref={videoRef}
          className={cn(
            "cinematic-media transition-opacity duration-700",
            videoRevealed ? "opacity-100" : "opacity-0"
          )}
          style={{ objectFit, objectPosition }}
          src={effectiveSrc}
          poster={poster}
          autoPlay={autoplay && !reducedMotion}
          loop={loop}
          muted={muted}
          playsInline={playsInline}
          preload={preload}
          disablePictureInPicture
          controls={false}
          onLoadedMetadata={handleCanPlay}
          onLoadedData={handleCanPlay}
          onCanPlay={handleCanPlay}
          onCanPlayThrough={handleCanPlay}
          onPlaying={handlePlaying}
          onPause={handlePause}
          onEnded={handleEnded}
          onError={handleError}
          aria-hidden="true"
          tabIndex={-1}
        />
      )}

      {/* Calm tap-to-play affordance, shown only when autoplay was genuinely
          blocked. A single subtle gold circle — no player chrome. */}
      {showPlayFallback && needsTap && !failed && (
        <button
          type="button"
          onClick={handleTapToPlay}
          aria-label="Play film"
          className="absolute inset-0 z-10 flex items-center justify-center bg-ink/20 transition-colors duration-500 hover:bg-ink/30"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full border border-brand-accent-soft/70 bg-ink/40 backdrop-blur-[2px] transition-transform duration-500 hover:scale-105">
            <svg
              width="18"
              height="20"
              viewBox="0 0 18 20"
              fill="none"
              aria-hidden="true"
              className="text-brand-accent-soft ml-0.5"
            >
              <path d="M1 1.5L17 10L1 18.5V1.5Z" fill="currentColor" />
            </svg>
          </span>
        </button>
      )}
    </div>
  );
}

CinematicVideo.propTypes = {
  /** Desktop video URL. */
  src: PropTypes.string,
  /** Narrow-viewport video URL (mobile data saving). */
  mobileSrc: PropTypes.string,
  /** Poster image URL — always shown first, and the fallback. */
  poster: PropTypes.string.isRequired,
  /** Accessible alt text describing the film (applied to poster). */
  alt: PropTypes.string.isRequired,
  className: PropTypes.string,
  autoplay: PropTypes.bool,
  loop: PropTypes.bool,
  muted: PropTypes.bool,
  playsInline: PropTypes.bool,
  /** `preload` strategy — hero uses metadata or auto, below-fold uses none. */
  preload: PropTypes.oneOf(["none", "metadata", "auto"]),
  /** Show a calm tap-to-play affordance when autoplay is rejected. */
  showPlayFallback: PropTypes.bool,
  /** External pause control (e.g. off-screen pausing). */
  paused: PropTypes.bool,
  /** object-fit for both poster and video. */
  fit: PropTypes.oneOf(["cover", "contain"]),
  /** object-position focal point. */
  position: PropTypes.string,
  /** Called once the browser confirms the film is actually playing. */
  onReady: PropTypes.func,
  onError: PropTypes.func,
};
