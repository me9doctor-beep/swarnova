import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import usePrefersReducedMotion from "./usePrefersReducedMotion.js";
import {
  HERO_MOBILE_QUERY,
  nextHeroIndex,
  resolveHeroReel,
  resolveHeroVideoSource,
} from "../services/heroReelService.js";

function readMobile() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(HERO_MOBILE_QUERY).matches;
}

/**
 * useHeroReel — Phase 14.4A.
 *
 * Owns the rotation state of the cinematic homepage hero. Resolution rules
 * (which records can play, which source a viewport gets, what the next clip
 * is) live in `services/heroReelService.js`; this hook adds only the browser
 * facts (reduced motion, viewport, runtime failures) and the timing.
 *
 *   Video 1 → Video 2 → Video 3 → Video 4 → Video 1
 *
 * Only ONE clip is mounted as a playing video at a time. During the
 * crossfade the outgoing layer is kept for `crossfadeMs` — it has already
 * ended, so it rests on its final frame (paused) while the incoming poster
 * and film fade in above it. Nothing else is fetched: the next clip is not
 * mounted until it becomes active.
 */
export function useHeroReel(content) {
  const reducedMotion = usePrefersReducedMotion();
  const [isMobile, setIsMobile] = useState(readMobile);
  const [failedIds, setFailedIds] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [previous, setPrevious] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mql = window.matchMedia(HERO_MOBILE_QUERY);
    const update = () => setIsMobile(mql.matches);
    update();
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", update);
      return () => mql.removeEventListener("change", update);
    }
    return undefined;
  }, []);

  const reel = useMemo(
    () => resolveHeroReel(content, { reducedMotion, failedIds }),
    [content, reducedMotion, failedIds]
  );

  const count = reel.playable.length;
  const safeIndex = count > 0 ? activeIndex % count : 0;
  const active = reel.mode === "video" ? reel.playable[safeIndex] ?? null : null;
  const activeSrc = active ? resolveHeroVideoSource(active, { isMobile }) : null;

  const advance = useCallback(() => {
    if (!reel.rotates) return;
    const outgoing = reel.playable[safeIndex];
    setPrevious(outgoing ? { ...outgoing, resolvedSrc: resolveHeroVideoSource(outgoing, { isMobile }) } : null);
    setActiveIndex(nextHeroIndex(safeIndex, count));
  }, [reel, safeIndex, count, isMobile]);

  /* Clear the outgoing layer once the crossfade has completed. */
  useEffect(() => {
    if (!previous) return undefined;
    const timer = setTimeout(() => setPrevious(null), reel.rotation.crossfadeMs + 100);
    return () => clearTimeout(timer);
  }, [previous, reel.rotation.crossfadeMs]);

  /* Watchdog: rotation normally advances on the clip's `ended` event; if a
     clip never reports it (e.g. a stalled network), move on anyway. */
  const advanceRef = useRef(advance);
  advanceRef.current = advance;
  useEffect(() => {
    if (!reel.rotates || !active) return undefined;
    const timer = setTimeout(() => advanceRef.current(), reel.rotation.maxClipMs);
    return () => clearTimeout(timer);
  }, [reel.rotates, active, reel.rotation.maxClipMs]);

  const markFailed = useCallback((id) => {
    if (!id) return;
    setFailedIds((ids) => (ids.includes(id) ? ids : [...ids, id]));
  }, []);

  return {
    mode: reel.mode,
    poster: reel.poster,
    videos: reel.videos,
    playable: reel.playable,
    rotates: reel.rotates,
    rotation: reel.rotation,
    reducedMotion,
    isMobile,
    active,
    activeIndex: safeIndex,
    activeSrc,
    previous: previous && previous.id !== active?.id ? previous : null,
    advance,
    markFailed,
  };
}

export default useHeroReel;
