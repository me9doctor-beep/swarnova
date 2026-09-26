/**
 * HERO REEL SERVICE — Phase 14.4A
 * -----------------------------------------------------------------------------
 * Pure resolution rules for the cinematic homepage hero. The hero document is
 * fetched through the normal chain (HomePage → useHomepage → contentService →
 * DataProvider → mock provider → mock data); this module only interprets the
 * `videos` records that arrive on the hero section, so a future CMS/DAM can
 * supply the same records without any UI change.
 *
 * Every record reuses the existing media contract:
 *
 *   { id, title, src, mobileSrc, poster, alt,
 *     autoplay, loop, muted, playsInline, placement }
 *
 * A record is *playable* only when it carries a real `src`. Records whose
 * footage has not been delivered yet keep `src: null` — they are never
 * simulated with CSS motion and never rotate in as a still slideshow; the hero
 * simply shows the Signature poster (the existing campaign photograph).
 *
 * No React, no DOM: everything here is unit-testable under `node --test`.
 */

/** Breakpoint below which `mobileSrc` is preferred (matches CinematicVideo). */
export const HERO_MOBILE_QUERY = "(max-width: 767px)";

/** Default rotation timing: ~10 s clips, slow cinematic crossfade.
 *
 * The dissolve is motion-to-motion: the next film is *staged* (mounted
 * invisibly, preloading) `stageLeadMs` before the active film ends, and the
 * crossfade begins `crossfadeMs` before the end — while the active film is
 * still playing — so the reel reads as one continuous campaign film instead
 * of a slideshow of frozen frames. `stageLeadMs` must exceed `crossfadeMs`
 * so the incoming film is buffered before it fades in. */
export const HERO_ROTATION_DEFAULTS = Object.freeze({
  enabled: true,
  /** Upper bound per clip — rotation normally advances on the video's `ended`
      event; this is the watchdog in case `ended` never arrives. */
  maxClipMs: 14000,
  /** Crossfade between the outgoing film (still playing) and the incoming
      film. */
  crossfadeMs: 2200,
  /** How long before the active film ends the NEXT film is staged — mounted
      invisibly with `preload="auto"` so it is fully buffered, then played the
      moment its dissolve begins. */
  stageLeadMs: 3200,
});

const CONTRACT_DEFAULTS = Object.freeze({
  autoplay: true,
  loop: true,
  muted: true,
  playsInline: true,
  placement: "hero",
});

const hasText = (value) => typeof value === "string" && value.trim().length > 0;

/**
 * Normalise one record to the full media contract. Autoplaying hero media is
 * always muted and inline — an unmuted autoplay would be refused by every
 * browser, and a non-inline one would hijack the iOS screen.
 */
export function normalizeHeroVideo(record, fallbackPoster = null) {
  if (!record || typeof record !== "object") return null;
  const src = hasText(record.src) ? record.src : null;
  const mobileSrc = hasText(record.mobileSrc) ? record.mobileSrc : null;
  const poster = hasText(record.poster) ? record.poster : fallbackPoster;
  return {
    ...CONTRACT_DEFAULTS,
    ...record,
    src,
    mobileSrc,
    poster,
    alt: hasText(record.alt) ? record.alt : "",
    muted: true,
    playsInline: true,
    playable: Boolean(src),
  };
}

/**
 * Pick the source for the current viewport. Mobile prefers `mobileSrc` and
 * falls back to `src`; desktop always uses `src`. Returns null when the
 * record has no footage.
 */
export function resolveHeroVideoSource(record, { isMobile = false } = {}) {
  if (!record) return null;
  if (isMobile && hasText(record.mobileSrc)) return record.mobileSrc;
  return hasText(record.src) ? record.src : null;
}

/**
 * Resolve the hero section's reel.
 *
 * @param {object} content  hero section content from the homepage document
 * @param {object} options  { reducedMotion, failedIds }
 * @returns {{
 *   videos: object[],        all normalised records (display order)
 *   playable: object[],      records that can genuinely play right now
 *   mode: "video" | "poster",
 *   poster: { src, alt },    the first-paint / fallback still
 *   rotation: object,        timing
 *   rotates: boolean,        true only when ≥2 records can play
 * }}
 */
export function resolveHeroReel(content, { reducedMotion = false, failedIds = [] } = {}) {
  const fallbackPoster = content?.image?.src ?? null;
  const videos = (Array.isArray(content?.videos) ? content.videos : [])
    .map((record) => normalizeHeroVideo(record, fallbackPoster))
    .filter(Boolean);

  const failed = new Set(failedIds);
  const playable = videos.filter((video) => video.playable && !failed.has(video.id));

  const rotation = { ...HERO_ROTATION_DEFAULTS, ...(content?.rotation ?? {}) };
  const mode = !reducedMotion && playable.length > 0 ? "video" : "poster";
  const rotates = mode === "video" && rotation.enabled !== false && playable.length > 1;

  /* Poster: the Signature record's still, which is the existing campaign
     photograph — the hero's visual source of truth. */
  const lead = videos[0];
  const poster = {
    src: lead?.poster ?? fallbackPoster,
    alt: content?.image?.alt ?? lead?.alt ?? "",
  };

  return { videos, playable, mode, poster, rotation, rotates };
}

/** Next index in a rotation of `count` playable records (wraps 4 → 1). */
export function nextHeroIndex(current, count) {
  if (!Number.isInteger(count) || count <= 0) return 0;
  const safe = Number.isInteger(current) && current >= 0 ? current : -1;
  return (safe + 1) % count;
}

export const heroReelService = {
  normalizeHeroVideo,
  resolveHeroVideoSource,
  resolveHeroReel,
  nextHeroIndex,
};

export default heroReelService;
