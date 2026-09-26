import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { cn } from "../../utils/cn.js";

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
 *   - Mobile src (`mobileSrc`) is served to narrow viewports via media query,
 *     saving bandwidth on phones.
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

  /* Reduced-motion detection — one read at mount. When the customer asks
     for reduced motion we never autoplay; the poster is the experience. */
  const prefersReducedMotion = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    prefersReducedMotion.current = mql.matches;
  }, []);

  /* Autoplay promise handling — a rejected autoplay (iOS low-power, etc.)
     flips us into "tap to play" mode rather than leaving a broken frame. */
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !autoplay || paused || prefersReducedMotion.current || userPaused) return;

    const tryPlay = () => {
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          setNeedsTap(true);
        });
      }
    };

    if (canPlay) tryPlay();
  }, [canPlay, autoplay, paused, userPaused]);

  /* External pause control (e.g. off-screen IntersectionObserver pausing). */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (paused || !canPlay) {
      video.pause();
    } else if (autoplay && !prefersReducedMotion.current && !userPaused && !needsTap) {
      video.play().catch(() => {});
    }
  }, [paused, canPlay, autoplay, userPaused, needsTap]);

  const handleCanPlay = () => {
    setCanPlay(true);
    setFailed(false);
    onReady?.();
  };

  const handleError = () => {
    setFailed(true);
    onError?.();
  };

  const handleTapToPlay = () => {
    const video = videoRef.current;
    if (!video) return;
    setNeedsTap(false);
    setUserPaused(false);
    video.muted = muted;
    video.play().catch(() => setNeedsTap(true));
  };

  const objectFit = fit;
  const objectPosition = position;

  return (
    <div className={cn("cinematic-media-wrap absolute inset-0 h-full w-full overflow-hidden", className)}>
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
        />
      )}

      {/* Native video — never rendered when src is missing or in reduced motion
          unless the customer explicitly taps play. */}
      {src && !failed && (
        <video
          ref={videoRef}
          className={cn(
            "cinematic-media transition-opacity duration-700",
            canPlay ? "opacity-100" : "opacity-0"
          )}
          style={{ objectFit, objectPosition }}
          src={mobileSrc ? undefined : src}
          poster={poster}
          autoPlay={autoplay && !prefersReducedMotion.current}
          loop={loop}
          muted={muted}
          playsInline={playsInline}
          preload={preload}
          disablePictureInPicture
          controls={false}
          onCanPlay={handleCanPlay}
          onLoadedData={handleCanPlay}
          onError={handleError}
          aria-hidden="true"
          tabIndex={-1}
        >
          {mobileSrc && (
            <source src={mobileSrc} media="(max-width: 767px)" type="video/mp4" />
          )}
          {src && <source src={src} type="video/mp4" />}
        </video>
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
