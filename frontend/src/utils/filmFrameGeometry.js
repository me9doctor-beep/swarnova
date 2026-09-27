/**
 * FILM FRAME GEOMETRY
 * -----------------------------------------------------------------------------
 * Where a rectangle of the *source* film lands inside an `object-fit: cover`
 * element as it is actually rendered on screen.
 *
 * The hero and the Art of Gold film are both rendered with
 * `object-fit: cover` + an `object-position` focal point, so the browser
 * scales the source up until it covers the element box and then crops the
 * overflow away. A point at 90 % of the source frame is therefore NOT at 90 %
 * of the element: on a narrow box most of the source's width is cropped off,
 * on a wide box most of its height is. Anything that has to sit on a known
 * part of the picture — the campaign credit plate — must be placed in the
 * *rendered* frame, not in the source frame and not in the page.
 *
 * Everything here is pure arithmetic (no DOM) so it can be unit-tested
 * against the real measured boxes of every supported viewport; the DOM read
 * lives in `components/ui/FilmCredit.jsx`.
 */

/* ---------------------------------------------------------------------------
   THE CORNER MARK — measured, not guessed
   ---------------------------------------------------------------------------
   Every delivered film (the four hero films and the Art of Gold film) carries
   the same generator mark in the same place, as fractions of the source
   frame:

     hero films      1280×720  · mark 48×48 px, its right edge 96 px from the
                               right of the frame and its bottom edge 96 px
                               from the bottom →
                               x 1136…1184 (0.8875…0.9242)
                               y  576… 624 (0.8000…0.8667)
     Art of Gold     1920×1080 · the same mark at the same fractions
                               (measured at 1740,900 with a 72×72 footprint,
                               i.e. the 1280×720 geometry scaled ×1.5)

   The box below is that measurement widened by ~6 source px on every side, so
   the plate covers the mark's antialiased and upscale-softened edge as well as
   its solid core.
   --------------------------------------------------------------------------- */
export const FILM_MARK_FRAME = Object.freeze({
  left: 0.882,
  top: 0.792,
  right: 0.93,
  bottom: 0.874,
});

/** Default source aspect (16:9) — used until the element reports its own. */
export const DEFAULT_SOURCE_ASPECT = 16 / 9;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export function rectWidth(rect) {
  return Math.max(rect.right - rect.left, 0);
}

export function rectHeight(rect) {
  return Math.max(rect.bottom - rect.top, 0);
}

export function rectArea(rect) {
  return rectWidth(rect) * rectHeight(rect);
}

/**
 * Intersect two rectangles. Returns `null` when they do not overlap, which is
 * how "this part of the film is cropped out of frame" is expressed.
 */
export function intersectRect(a, b) {
  const rect = {
    left: Math.max(a.left, b.left),
    top: Math.max(a.top, b.top),
    right: Math.min(a.right, b.right),
    bottom: Math.min(a.bottom, b.bottom),
  };
  return rectWidth(rect) > 0 && rectHeight(rect) > 0 ? rect : null;
}

/**
 * Parse a computed `object-position` value into horizontal/vertical anchors.
 *
 *   "64% 26%"  → { x: 0.64, y: 0.26, unit: "ratio" }
 *   "18px 4px" → { x: 18,   y: 4,    unit: "px" }
 *   "center"   → { x: 0.5,  y: 0.5,  unit: "ratio" }
 *
 * Percentages are relative to the *free* space (element box − scaled source),
 * exactly as CSS defines them; pixel values are offsets from the same origin.
 */
export function parseObjectPosition(value) {
  const fallback = { x: 0.5, y: 0.5, unit: "ratio" };
  if (typeof value !== "string" || !value.trim()) return fallback;

  const keywords = {
    left: 0,
    center: 0.5,
    right: 1,
    top: 0,
    bottom: 1,
  };

  const tokens = value.trim().split(/\s+/);
  const read = (token) => {
    if (token in keywords) return { value: keywords[token], unit: "ratio" };
    const px = /^(-?[\d.]+)px$/i.exec(token);
    if (px) return { value: Number.parseFloat(px[1]), unit: "px" };
    const percent = /^(-?[\d.]+)%$/.exec(token);
    if (percent) return { value: Number.parseFloat(percent[1]) / 100, unit: "ratio" };
    return { value: 0.5, unit: "ratio" };
  };

  const first = read(tokens[0] ?? "center");
  const second = tokens.length > 1 ? read(tokens[1]) : null;
  const sameUnit = !second || second.unit === first.unit;
  return {
    x: first.value,
    y: second ? second.value : first.value,
    unit: sameUnit ? first.unit : "ratio",
  };
}

/**
 * The `object-fit: cover` mapping: how much of the source frame is visible,
 * and where that visible window starts inside the source.
 *
 * All values are in source pixels except `scale`, which converts source px to
 * element px.
 */
export function coverGeometry({
  boxWidth,
  boxHeight,
  sourceWidth,
  sourceHeight,
  positionX = 0.5,
  positionY = 0.5,
  positionUnit = "ratio",
}) {
  if (!(boxWidth > 0) || !(boxHeight > 0) || !(sourceWidth > 0) || !(sourceHeight > 0)) {
    return null;
  }

  const scale = Math.max(boxWidth / sourceWidth, boxHeight / sourceHeight);
  const scaledWidth = sourceWidth * scale;
  const scaledHeight = sourceHeight * scale;
  const freeX = Math.max(scaledWidth - boxWidth, 0);
  const freeY = Math.max(scaledHeight - boxHeight, 0);
  const anchorX = positionUnit === "px" ? clamp(positionX, 0, freeX || positionX) : freeX * positionX;
  const anchorY = positionUnit === "px" ? clamp(positionY, 0, freeY || positionY) : freeY * positionY;

  return {
    scale,
    /* Visible window of the source, in source pixels. */
    originX: anchorX / scale,
    originY: anchorY / scale,
    visibleWidth: boxWidth / scale,
    visibleHeight: boxHeight / scale,
  };
}

/**
 * Map a rectangle expressed in *fractions of the source frame* onto the
 * element box, in element pixels. `null` when the frame cannot be resolved.
 */
export function frameRectToElementRect(frame, sourceWidth, sourceHeight, geometry) {
  if (!geometry) return null;
  const { scale, originX, originY } = geometry;
  return {
    left: (frame.left * sourceWidth - originX) * scale,
    top: (frame.top * sourceHeight - originY) * scale,
    right: (frame.right * sourceWidth - originX) * scale,
    bottom: (frame.bottom * sourceHeight - originY) * scale,
  };
}

/**
 * Where the corner mark lands inside the element box, in element pixels.
 */
export function filmMarkRect({
  boxWidth,
  boxHeight,
  sourceWidth,
  sourceHeight,
  positionX,
  positionY,
  positionUnit,
  frame = FILM_MARK_FRAME,
}) {
  const geometry = coverGeometry({
    boxWidth,
    boxHeight,
    sourceWidth,
    sourceHeight,
    positionX,
    positionY,
    positionUnit,
  });
  if (!geometry) return null;
  return {
    rect: frameRectToElementRect(frame, sourceWidth, sourceHeight, geometry),
    geometry,
  };
}

/**
 * The absolute-position values for the credit plate.
 *
 * The plate is anchored to the bottom-right of the *mark* (never to the page,
 * section or viewport) and then clamped into the frame, so:
 *
 *   · it always contains the mark that is on screen;
 *   · it can never spill outside the film frame, cause a horizontal
 *     scrollbar or a layout shift — it is absolutely positioned and the
 *     frame clips it (`overflow-hidden` on the hero and on the film frame);
 *   · it grows leftward/upward from its anchor, so responsive type changes
 *     never push it off the mark.
 *
 * Returns `null` when the mark is not (meaningfully) visible in the rendered
 * frame — i.e. when the crop has already taken it off screen.
 */
export function creditPlatePlacement({
  boxWidth,
  boxHeight,
  mark,
  paddingX = 16,
  paddingY = 12,
  margin = 12,
  minWidth = 0,
  minHeight = 0,
  minimumVisibleRatio = 0.2,
}) {
  if (!mark || !(boxWidth > 0) || !(boxHeight > 0)) return null;

  const visible = intersectRect(mark, { left: 0, top: 0, right: boxWidth, bottom: boxHeight });
  const markArea = rectArea(mark);
  if (!visible || (markArea > 0 && rectArea(visible) / markArea < minimumVisibleRatio)) return null;

  /* Cover the visible part of the mark (and the mark itself where it is on
     screen) plus the plate's own inner breathing room. */
  const desired = {
    left: Math.min(visible.left, mark.left) - paddingX,
    top: Math.min(visible.top, mark.top) - paddingY,
    right: Math.max(visible.right, mark.right) + paddingX,
    bottom: Math.max(visible.bottom, mark.bottom) + paddingY,
  };

  /* Coverage first, aesthetics second: the plate must reach the part of the
     mark that is on screen even when the crop has pushed the mark almost to
     the frame's edge — the preferred `margin` is then given up, never the
     coverage. */
  const coverRight = Math.min(visible.right, boxWidth);
  const coverBottom = Math.min(visible.bottom, boxHeight);
  const limitRight = Math.max(boxWidth - Math.min(margin, boxWidth - coverRight), coverRight);
  const limitBottom = Math.max(boxHeight - Math.min(margin, boxHeight - coverBottom), coverBottom);

  const rightEdge = clamp(Math.max(desired.right, coverRight), coverRight, limitRight);
  const bottomEdge = clamp(Math.max(desired.bottom, coverBottom), coverBottom, limitBottom);
  const maxWidth = Math.max(rightEdge - margin, 0);
  const maxHeight = Math.max(bottomEdge - margin, 0);

  return {
    /* CSS offsets from the frame's right / bottom edges. */
    right: Math.max(boxWidth - rightEdge, 0),
    bottom: Math.max(boxHeight - bottomEdge, 0),
    minWidth: Math.min(Math.max(rightEdge - desired.left, minWidth), Math.max(maxWidth, 0)),
    minHeight: Math.min(Math.max(bottomEdge - desired.top, minHeight), Math.max(maxHeight, 0)),
    maxWidth: maxWidth || undefined,
    maxHeight: maxHeight || undefined,
  };
}
