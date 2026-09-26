import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { cn } from "../../utils/cn.js";
import usePrefersReducedMotion from "../../hooks/usePrefersReducedMotion.js";
import useIntersectionAware from "../../hooks/useIntersectionAware.js";

/**
 * CINEMATIC VIDEO — a lightweight wrapper over the native `<video>` element,
 * built for Swarnova's hero and brand-film placements.
 *
 * Behaviour:
 *   - Muted autoplay + loop + playsInline by default (mobile-safe).
 *   - Renders `poster` first; the video reveals only after `canplay` so a
 *     slow connection never shows a black frame.
 *   - If autoplay is rejected (iOS low-power mode, data-saver, reduced motion),
 *     the poster stays visible and (when `showPlayFallback`) a calm play
 *     affordance appears instead of a broken-looking frame.
 *   - Respects `prefers-reduced-motion`: disables autoplay and shows poster.
 *     Uses the prefersReducedMotion hook (which checks prefers-reduced-motion)
 *     so the poster is the experience when the user asks for reduced motion.
 *   - Mobile src (`mobileSrc`) is resolved in React via viewport matchMedia,
 *     saving bandwidth on phones and avoiding unreliable <source media> behavior.
 *   - Off-screen videos are paused via IntersectionObserver to avoid decoding
 *     cost when the film is scrolled past.
 *   - Graceful error: if the video cannot load the poster still stands; no
 *     broken icon, no console-crasher.
 *
 * This component is NOT a YouTube-style media player. It renders one video
 * layer beneath the page's own (HTML) copy, exactly as the spec prescribes.
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
  const [needsTap, setNeedsTap] = useState(false);
  const [failed, setFailed] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const reducedMotion = usePrefersReducedMotion();
  const [rootRef, inView] = useIntersectionAware({ threshold: 0.1, rootMargin: "100px 0px" });

  // Mobile viewport detection — robust alternative to <source media>
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
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

  // Reset playback state when source changes (e.g., mobile ↔ desktop switch)
  useEffect(() => {
    setCanPlay(false);
    setFailed(false);
    setNeedsTap(false);
    setUserPaused(false);
  }, [effectiveSrc]);

  // Autoplay promise handling — a rejected autoplay (iOS low-power, etc.)
  // flips us into "tap to play" mode rather than leaving a broken frame.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !autoplay || paused || reducedMotion || userPaused || !inView) return;
    if (!canPlay || failed) return;

    const tryPlay = () => {
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch((err) => {
          // Only show fallback for meaningful autoplay blocks, not for abort
          // AbortError happens when pause() is called quickly after play()
          if (err && err.name === "AbortError") return;
          setNeedsTap(true);
        });
      }
    };

    tryPlay();
  }, [canPlay, autoplay, paused, reducedMotion, userPaused, inView, failed]);

  // External pause control + off-screen pausing
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const shouldPause = paused || !inView || !canPlay || failed || userPaused || (reducedMotion && autoplay);

    if (shouldPause) {
      // Avoid calling pause on already paused to reduce AbortError noise
      if (!video.paused) {
        video.pause();
      }
    } else if (autoplay && !reducedMotion && !needsTap) {
      const p = video.play();
      if (p && typeof p.catch === "function") {
        p.catch((err) => {
          if (err && err.name === "AbortError") return;
          setNeedsTap(true);
        });
      }
    }
  }, [paused, inView, canPlay, autoplay, reducedMotion, userPaused, needsTap, failed]);

  const handleCanPlay = () => {
    setCanPlay(true);
    setFailed(false);
    onReady?.();
  };

  const handleLoadedMetadata = () => {
    // Metadata loaded is enough to know dimensions/duration, but we wait for canplay for visual readiness
    // Still, if canplay hasn't fired, we can consider it playable for opacity transition after a short delay
    // The actual opacity transition is driven by canPlay, but we keep this as a safety net
  };

  const handleError = () => {
    setFailed(true);
    setCanPlay(false);
    onError?.();
  };

  const handleTapToPlay = () => {
    const video = videoRef.current;
    if (!video) return;
    setNeedsTap(false);
    setUserPaused(false);
    setFailed(false);
    video.muted = muted;
    const p = video.play();
    if (p && typeof p.catch === "function") {
      p.catch(() => setNeedsTap(true));
    }
  };

  const objectFit = fit;
  const objectPosition = position;

  return (
    <div
      ref={rootRef}
      className={cn("cinematic-media-wrap absolute inset-0 h-full w-full overflow-hidden", className)}
    >
      {/* Poster — always rendered; the video fades in over it when ready. */}
      {poster && (
        <img
          src={poster}
          alt={alt}
          aria-hidden="true"
          className={cn(
            "cinematic-media transition-opacity duration-700",
            canPlay && !failed ? "opacity-0" : "opacity-100"
          )}
          style={{ objectFit, objectPosition }}
          loading="eager"
          decoding="async"
        />
      )}

      {/* Native video — uses resolved effectiveSrc (mobile vs desktop) for reliability.
          Never rendered when src is missing, when failed, or when reduced-motion disables autoplay
          unless the customer explicitly taps play. */}
      {effectiveSrc && !failed && !(reducedMotion && autoplay && !needsTap) && (
        <video
          ref={videoRef}
          className={cn(
            "cinematic-media transition-opacity duration-700",
            canPlay ? "opacity-100" : "opacity-0"
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
          onCanPlay={handleCanPlay}
          onLoadedData={handleCanPlay}
          onLoadedMetadata={handleLoadedMetadata}
          onCanPlayThrough={handleCanPlay}
          onError={handleError}
          aria-hidden="true"
          tabIndex={-1}
        />
      )}

      {/* When reduced motion is on and autoplay would have played, show poster only — no video element.
          This is handled by the conditional above, but we keep a fallback poster visible. */}
      {reducedMotion && autoplay && poster && !failed && (
        <img
          src={poster}
          alt={alt}
          aria-hidden="true"
          className={cn("cinematic-media opacity-100")}
          style={{ objectFit, objectPosition }}
        />
      )}

      {/* Calm tap-to-play affordance, shown when autoplay was blocked. A single
          subtle gold circle with "Play" — no YouTube-style chrome. */}
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
  onReady: PropTypes.func,
  onError: PropTypes.func,
};
