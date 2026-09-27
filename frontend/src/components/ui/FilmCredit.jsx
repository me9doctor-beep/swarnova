import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { cn } from "../../utils/cn.js";
import {
  DEFAULT_SOURCE_ASPECT,
  creditPlatePlacement,
  filmMarkRect,
  parseObjectPosition,
} from "../../utils/filmFrameGeometry.js";

/**
 * FILM CREDIT — the campaign's editorial credit plate.
 * -----------------------------------------------------------------------------
 * A small champagne-ruled plate inside the film frame: the house word-mark, a
 * hairline and one line of campaign context ("Campaign Film" on the hero reel,
 * "Atelier Film" on the Art of Gold). It is part of the art direction — the
 * credit a luxury campaign film carries in the corner of frame.
 *
 * It also sits exactly where the delivered footage carries the generator's
 * corner mark, so the mark is never on screen: the plate is opaque and always
 * larger than the mark, at every viewport. That is a *positioning* property,
 * not a crop, blur or re-encode — the media files themselves are untouched.
 *
 * PLACEMENT (see utils/filmFrameGeometry.js for the arithmetic)
 * -----------------------------------------------------------------------------
 *   VIDEO FRAME  →  PATCH
 *
 * The plate is anchored to the mark **inside the rendered video frame**, never
 * to the page, the section or the viewport:
 *
 *   1. the `<video>` element's own box, intrinsic size and computed
 *      `object-position` are read from the DOM;
 *   2. `object-fit: cover` is reproduced in arithmetic, so the mark's
 *      source-frame position is mapped onto the frame the customer actually
 *      sees — including the horizontal crop on narrow boxes and the vertical
 *      crop on wide ones;
 *   3. the plate is anchored to that rect (grown by a padding), then clamped
 *      inside the frame, so it can never spill onto the page, cause a
 *      horizontal scrollbar or shift anything — it is absolutely positioned
 *      and both frames clip with `overflow: hidden`;
 *   4. when a crop takes the mark off screen entirely, nothing is rendered —
 *      there is no mark to credit over.
 *
 * Everything is re-measured on resize, on orientation change, when the film
 * element mounts/unmounts (reel rotation) and when its intrinsic size becomes
 * known — so a resize from 1536px down to 375px re-anchors the plate instead
 * of leaving it at a stale position.
 *
 * Sizing is deliberately *not* hard-coded here: the responsive type, padding,
 * margin and minimum size are CSS custom properties on `.film-credit` (see
 * index.css), and this component reads them back, so the responsive system
 * stays the single source of truth.
 */

const toPx = (value, fallback) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/** Read the plate's responsive metrics back out of its own CSS. */
function readPlateMetrics(plate) {
  const style = getComputedStyle(plate);
  return {
    paddingX: toPx(style.getPropertyValue("--fc-pad-x"), 16),
    paddingY: toPx(style.getPropertyValue("--fc-pad-y"), 12),
    margin: toPx(style.getPropertyValue("--fc-margin"), 12),
    minWidth: toPx(style.getPropertyValue("--fc-min-w"), 0),
    minHeight: toPx(style.getPropertyValue("--fc-min-h"), 0),
  };
}

/**
 * The absolute offsets for the plate, in CSS pixels relative to the plate's
 * containing block — or `null` when it must not be rendered.
 */
function measurePlacement(plate, host, getMedia, fallbackAspect) {
  /* Default anchor: the film itself. Placements whose *poster* carries the
     mark too (the Art of Gold poster is a frame of the same film) pass an
     explicit `getMedia` that falls back to the poster image. */
  const media = (typeof getMedia === "function" ? getMedia() : null) ?? host.querySelector("video");
  if (!media) return null;

  const rect = media.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) return null;

  const mediaStyle = getComputedStyle(media);
  const { x, y, unit } = parseObjectPosition(mediaStyle.objectPosition);
  /* The cover mapping only holds for `object-fit: cover`. An engine that
     reports no value at all is given the benefit of the doubt — both shipped
     placements do use cover. */
  if (mediaStyle.objectFit && mediaStyle.objectFit !== "cover") return null;

  /* Works for a `<video>` and for a poster `<img>` alike — the Art of Gold
     poster is a frame of the same film, so it carries the same mark. */
  let sourceWidth = media.videoWidth || media.naturalWidth || 0;
  let sourceHeight = media.videoHeight || media.naturalHeight || 0;
  if (!(sourceWidth > 0) || !(sourceHeight > 0)) {
    /* Metadata has not arrived yet — only the aspect ratio drives the cover
       mapping, so the declared ratio is enough to place the plate. */
    const aspect = Number.isFinite(fallbackAspect) && fallbackAspect > 0 ? fallbackAspect : DEFAULT_SOURCE_ASPECT;
    sourceWidth = 1280;
    sourceHeight = 1280 / aspect;
  }

  const mark = filmMarkRect({
    boxWidth: rect.width,
    boxHeight: rect.height,
    sourceWidth,
    sourceHeight,
    positionX: x,
    positionY: y,
    positionUnit: unit,
  });
  if (!mark) return null;

  const metrics = creditPlatePlacement({
    boxWidth: rect.width,
    boxHeight: rect.height,
    mark: mark.rect,
    ...readPlateMetrics(plate),
  });
  if (!metrics) return null;

  /* `right` / `bottom` are resolved against the containing block — the
     padding box of the nearest positioned ancestor — so subtract its border. */
  const container = plate.offsetParent ?? host;
  const parentRect = container.getBoundingClientRect();
  const parentStyle = getComputedStyle(container);
  const containerLeft = parentRect.left + (Number.parseFloat(parentStyle.borderLeftWidth) || 0);
  const containerTop = parentRect.top + (Number.parseFloat(parentStyle.borderTopWidth) || 0);
  const containerWidth = container.clientWidth || parentRect.width;
  const containerHeight = container.clientHeight || parentRect.height;

  const videoLeft = rect.left - containerLeft;
  const videoTop = rect.top - containerTop;

  return {
    right: `${Math.max(containerWidth - (videoLeft + rect.width - metrics.right), 0).toFixed(2)}px`,
    bottom: `${Math.max(containerHeight - (videoTop + rect.height - metrics.bottom), 0).toFixed(2)}px`,
    minWidth: `${metrics.minWidth.toFixed(2)}px`,
    minHeight: `${metrics.minHeight.toFixed(2)}px`,
    ...(metrics.maxWidth ? { maxWidth: `${metrics.maxWidth.toFixed(2)}px` } : null),
    ...(metrics.maxHeight ? { maxHeight: `${metrics.maxHeight.toFixed(2)}px` } : null),
  };
}

function samePlacement(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.right === b.right &&
    a.bottom === b.bottom &&
    a.minWidth === b.minWidth &&
    a.minHeight === b.minHeight &&
    a.maxWidth === b.maxWidth &&
    a.maxHeight === b.maxHeight
  );
}

export default function FilmCredit({
  title = "Swarnova",
  caption = "Campaign Film",
  placement = "hero",
  getMedia,
  revision,
  fallbackAspect = DEFAULT_SOURCE_ASPECT,
  className,
}) {
  const ref = useRef(null);
  const getMediaRef = useRef(getMedia);
  const [style, setStyle] = useState(null);

  useEffect(() => {
    getMediaRef.current = getMedia;
  }, [getMedia]);

  useEffect(() => {
    const plate = ref.current;
    const host = plate?.parentElement;
    if (!plate || !host || typeof window === "undefined") return undefined;

    let disposed = false;
    const measure = () => {
      if (disposed) return;
      const next = measurePlacement(plate, host, getMediaRef.current, fallbackAspect);
      /* Only commit what actually changed: the plate is one of the observed
         boxes, and an unconditional setState here would re-enter itself. */
      setStyle((current) => (samePlacement(current, next) ? current : next));
    };

    measure();
    const raf = typeof requestAnimationFrame === "function" ? requestAnimationFrame(measure) : 0;

    const observers = [];
    if (typeof ResizeObserver === "function") {
      const observer = new ResizeObserver(measure);
      observer.observe(host);
      const media = (typeof getMediaRef.current === "function" ? getMediaRef.current() : null) ?? host.querySelector("video");
      if (media) observer.observe(media);
      observers.push(observer);
    }
    if (typeof MutationObserver === "function") {
      /* Films mount and unmount as the reel rotates — re-measure whenever the
         frame's subtree changes, so the plate is never left unanchored. */
      const observer = new MutationObserver(measure);
      observer.observe(host, { childList: true, subtree: true, attributes: true, attributeFilter: ["src", "style"] });
      observers.push(observer);
    }

    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);

    return () => {
      disposed = true;
      if (raf && typeof cancelAnimationFrame === "function") cancelAnimationFrame(raf);
      observers.forEach((observer) => observer.disconnect());
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
    };
  }, [revision, fallbackAspect]);

  return (
    <div
      ref={ref}
      className={cn("film-credit", className)}
      data-film-credit={placement}
      /* `placed` is the honest signal: the plate is invisible until the mark
         has been located in the rendered frame, so it can never flash at a
         wrong position while a film is still loading or a crop is changing. */
      data-placed={style ? "true" : "false"}
      aria-hidden="true"
      style={style ?? undefined}
    >
      <span className="film-credit__title">{title}</span>
      <span className="film-credit__rule" />
      <span className="film-credit__caption">{caption}</span>
    </div>
  );
}

FilmCredit.propTypes = {
  /** Serif word-mark line. */
  title: PropTypes.string,
  /** Small tracked line beneath the rule. */
  caption: PropTypes.string,
  /** Which film frame this credit belongs to (also the test hook). */
  placement: PropTypes.string,
  /** Optional accessor for the `<video>` element to anchor to. */
  getMedia: PropTypes.func,
  /** Re-measure when this changes (e.g. the active film's id). */
  revision: PropTypes.string,
  /** Source aspect used until the element reports its intrinsic size. */
  fallbackAspect: PropTypes.number,
  className: PropTypes.string,
};
