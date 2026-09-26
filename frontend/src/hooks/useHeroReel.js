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

/* timeupdate fires roughly every 250 ms; the staging thresholds lead by a
   little more than that so the dissolve completes just before the active
   film ends, never after it. */
const TIMEUPDATE_GRACE_MS = 300;

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
 * The dissolve is motion-to-motion, so the reel reads as one continuous
 * luxury campaign rather than a sequence of separate videos:
 *
 *   · `stageLeadMs` before the active film ends, the NEXT film is staged —
 *     mounted invisibly (opacity 0, pointer-events none) with
 *     `preload="auto"`, so it is fully buffered before it is needed.
 *   · `crossfadeMs` before the end, the dissolve begins: the staged film
 *     starts playing and fades in above the active film while that film is
 *     STILL PLAYING — never a frozen frame into a still poster.
 *   · The active film ends just as the dissolve completes, so it is moving
 *     for every frame it is on screen. Its `ended` event (with the watchdog
 *     as backstop) then promotes the incoming film and the old layer is
 *     unmounted.
 *
 * Staging is driven by the active film's own `timeupdate` (the real
 * playhead), not by wall-clock timers, so the timing self-corrects even
 * though each film begins playing slightly before it is promoted. Outside
 * the crossfade window exactly one video plays, and only one film is ever
 * being fetched at a time — the staged fetch begins long after the active
 * film's own fetch has completed.
 */
export function useHeroReel(content) {
  const reducedMotion = usePrefersReducedMotion();
  const [isMobile, setIsMobile] = useState(readMobile);
  const [failedIds, setFailedIds] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [previous, setPrevious] = useState(null);
  /* The film staged for the next dissolve, and the id of the layer currently
     entering (kept until the next dissolve so the finished animation holds
     its final opacity through the promotion). */
  const [staged, setStaged] = useState(null);
  const [enteringId, setEnteringId] = useState(null);

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
    const nextIndex = nextHeroIndex(safeIndex, count);
    setPrevious(outgoing ? { ...outgoing, resolvedSrc: resolveHeroVideoSource(outgoing, { isMobile }) } : null);
    setActiveIndex(nextIndex);
    setStaged(null);
    /* Keep the entering state of the film that just dissolved in (its
       animation has completed; the class holds the final opacity through
       the role change). On the watchdog path there was no dissolve yet, so
       start one now — the incoming film fades in over the outgoing layer. */
    setEnteringId(reel.playable[nextIndex]?.id ?? null);
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

  /* Stage the next film and begin its dissolve from the active film's real
     playhead. Called on the active film's `timeupdate` only. */
  const handleActiveProgress = useCallback(
    (currentTime, duration) => {
      if (!reel.rotates || !Number.isFinite(duration) || duration <= 0) return;
      const next = reel.playable[nextHeroIndex(safeIndex, count)];
      if (!next || next.id === active?.id) return;
      const remainingMs = (duration - currentTime) * 1000;
      if (remainingMs <= reel.rotation.stageLeadMs + TIMEUPDATE_GRACE_MS) {
        setStaged((current) =>
          current?.id === next.id
            ? current
            : { ...next, resolvedSrc: resolveHeroVideoSource(next, { isMobile }) }
        );
      }
      if (remainingMs <= reel.rotation.crossfadeMs + TIMEUPDATE_GRACE_MS) {
        setEnteringId((current) => (current === next.id ? current : next.id));
      }
    },
    [reel, safeIndex, count, active?.id, isMobile]
  );

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
    staged: staged && staged.id !== active?.id ? staged : null,
    enteringId,
    advance,
    markFailed,
    handleActiveProgress,
  };
}

export default useHeroReel;
