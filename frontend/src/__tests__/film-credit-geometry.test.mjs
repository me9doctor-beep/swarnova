/**
 * FILM CREDIT GEOMETRY  ·  the campaign credit plate's placement
 * -----------------------------------------------------------------------------
 * The plate has to cover the generator's corner mark in the delivered footage
 * at every supported viewport — never the page, never the section — so the
 * placement arithmetic is the part worth freezing in a test.
 *
 * The numbers below are not invented:
 *
 *   · the mark's box was measured out of the delivered films — 48×48 px at
 *     x 1136…1183, y 576…623 of the 1280×720 hero frames, and the same
 *     fractions (72×72 px) in the 1920×1080 Art of Gold film;
 *   · the element boxes, intrinsic sizes and `object-position` focal points
 *     were read out of a real Chromium render of the homepage at each of the
 *     seven supported viewports.
 *
 * The test then re-derives the plate's rect with the same arithmetic the
 * component runs in the browser and asserts, for every one of them:
 *
 *   · the mark that is on screen is fully inside the plate;
 *   · the plate is fully inside the film frame;
 *   · where the crop has taken the mark off screen, nothing is placed.
 *
 * A second, wider sweep walks the box aspect ratio from phone-portrait to
 * ultrawide at both focal points, so a future layout change (a different hero
 * height, a different focal point, a portrait mobile capture) cannot silently
 * drop the coverage.
 */
import test from "node:test";
import assert from "node:assert/strict";

import {
  FILM_MARK_FRAME,
  coverGeometry,
  creditPlatePlacement,
  filmMarkRect,
  intersectRect,
  parseObjectPosition,
  rectArea,
} from "../utils/filmFrameGeometry.js";

/* -------------------------------------------------------------------------- */
/* The measurement the whole placement is built on                             */
/* -------------------------------------------------------------------------- */

test("credit geometry · the mark frame constant contains the mark measured from the footage", () => {
  /* Hero films — 1280×720: 48×48 px at x 1136…1183, y 576…623. */
  const hero = { width: 1280, height: 720, box: { left: 1136, top: 576, right: 1183, bottom: 623 } };
  /* Art of Gold — 1920×1080: the same mark at the same fractions (72×72 px). */
  const craft = { width: 1920, height: 1080, box: { left: 1704, top: 864, right: 1776, bottom: 936 } };

  for (const { width, height, box } of [hero, craft]) {
    const frame = {
      left: FILM_MARK_FRAME.left * width,
      top: FILM_MARK_FRAME.top * height,
      right: FILM_MARK_FRAME.right * width,
      bottom: FILM_MARK_FRAME.bottom * height,
    };
    assert.ok(frame.left <= box.left, `mark left ${frame.left} must cover ${box.left}`);
    assert.ok(frame.top <= box.top, `mark top ${frame.top} must cover ${box.top}`);
    assert.ok(frame.right >= box.right, `mark right ${frame.right} must cover ${box.right}`);
    assert.ok(frame.bottom >= box.bottom, `mark bottom ${frame.bottom} must cover ${box.bottom}`);
    /* …and it stays a corner mark, not a sheet: < 6 % of the frame's width. */
    assert.ok(frame.right - frame.left < width * 0.06, "mark must stay a small corner mark");
  }
});

/* -------------------------------------------------------------------------- */
/* The arithmetic                                                              */
/* -------------------------------------------------------------------------- */

test("credit geometry · object-position is read as CSS defines it", () => {
  assert.deepEqual(parseObjectPosition("64% 26%"), { x: 0.64, y: 0.26, unit: "ratio" });
  assert.deepEqual(parseObjectPosition("18% 30%"), { x: 0.18, y: 0.3, unit: "ratio" });
  assert.deepEqual(parseObjectPosition("50% 50%"), { x: 0.5, y: 0.5, unit: "ratio" });
  assert.deepEqual(parseObjectPosition("center"), { x: 0.5, y: 0.5, unit: "ratio" });
  assert.deepEqual(parseObjectPosition("left top"), { x: 0, y: 0, unit: "ratio" });
  const px = parseObjectPosition("12px 4px");
  assert.equal(px.unit, "px");
  assert.equal(px.x, 12);
  assert.equal(px.y, 4);
});

test("credit geometry · a 16:9 frame in a 16:9 box is not cropped at all", () => {
  const geometry = coverGeometry({
    boxWidth: 1024,
    boxHeight: 576,
    sourceWidth: 1920,
    sourceHeight: 1080,
    positionX: 0.5,
    positionY: 0.5,
  });
  assert.equal(geometry.scale, 1024 / 1920);
  assert.equal(geometry.originX, 0);
  assert.equal(geometry.originY, 0);
  assert.equal(geometry.visibleWidth, 1920);
  assert.equal(geometry.visibleHeight, 1080);
});

test("credit geometry · a narrow box crops the source horizontally, a wide one vertically", () => {
  /* Phone portrait: the box is far taller than 16:9, so the sides go. */
  const portrait = coverGeometry({
    boxWidth: 390,
    boxHeight: 719,
    sourceWidth: 1280,
    sourceHeight: 720,
    positionX: 0.64,
    positionY: 0.26,
  });
  assert.ok(portrait.visibleWidth < 1280 * 0.4, "a phone hero shows a narrow slice of the frame");
  assert.equal(portrait.visibleHeight, 720);
  assert.ok(portrait.originX > 1280 * 0.4, "the focal point shifts that slice to the right");

  /* Desktop: the box is wider than 16:9, so the top and bottom go. */
  const wide = coverGeometry({
    boxWidth: 1536,
    boxHeight: 773.44,
    sourceWidth: 1280,
    sourceHeight: 720,
    positionX: 0.18,
    positionY: 0.3,
  });
  assert.equal(wide.visibleWidth, 1280);
  assert.ok(wide.visibleHeight < 720, "a wide hero crops the frame's height");
});

/* -------------------------------------------------------------------------- */
/* The seven supported viewports, as a real browser reported them              */
/* -------------------------------------------------------------------------- */

/* Measured in Chromium (frame box, video intrinsic size, computed
   object-position) at each supported viewport. The Art of Gold frame is 16:9
   at every width, so its mark is never cropped; the hero's box — and with it
   the visible part of the film — changes with every breakpoint. */
const HERO_VIEWPORTS = [
  { vp: "1536x864", box: [1536, 773.44], source: [1280, 720], position: [0.18, 0.3], onScreen: true },
  { vp: "1280x800", box: [1280, 773.44], source: [1280, 720], position: [0.18, 0.3], onScreen: true },
  { vp: "1024x768", box: [1024, 709.44], source: [1280, 720], position: [0.64, 0.26], onScreen: true },
  /* From tablet portrait down the hero's crop no longer reaches the mark's
     corner of the frame: the mark is off screen, so no plate is placed. */
  { vp: "768x1024", box: [768, 798.72], source: [1280, 720], position: [0.64, 0.26], onScreen: false },
  { vp: "430x932", box: [430, 726.95], source: [1280, 720], position: [0.64, 0.26], onScreen: false },
  { vp: "390x844", box: [390, 718.98], source: [1280, 720], position: [0.64, 0.26], onScreen: false },
  { vp: "375x812", box: [375, 718.98], source: [1280, 720], position: [0.64, 0.26], onScreen: false },
];

/* The Art of Gold frame: 16:9 at every width, centred, never cropped. */
const CRAFT_VIEWPORTS = [
  { vp: "1536x864", box: [1024, 576] },
  { vp: "1280x800", box: [1024, 576] },
  { vp: "1024x768", box: [928, 522] },
  { vp: "768x1024", box: [704, 396] },
  { vp: "430x932", box: [390, 219.38] },
  { vp: "390x844", box: [350, 196.88] },
  { vp: "375x812", box: [335, 188.44] },
];

/* The responsive steps index.css owns for `.film-credit`. */
const RESPONSIVE_STEPS = [
  { name: "desktop", paddingX: 18, paddingY: 14, margin: 14, minWidth: 168, minHeight: 74 },
  { name: "tablet", paddingX: 14, paddingY: 11, margin: 12, minWidth: 148, minHeight: 66 },
  { name: "phone", paddingX: 10, paddingY: 8, margin: 10, minWidth: 112, minHeight: 52 },
];

const stepFor = (width) => (width <= 767 ? RESPONSIVE_STEPS[2] : width <= 1279 ? RESPONSIVE_STEPS[1] : RESPONSIVE_STEPS[0]);

/** Re-derive the plate's rect in element coordinates, as the component does. */
function place({ boxWidth, boxHeight, source, position, step }) {
  const mark = filmMarkRect({
    boxWidth,
    boxHeight,
    sourceWidth: source[0],
    sourceHeight: source[1],
    positionX: position ? position[0] : 0.5,
    positionY: position ? position[1] : 0.5,
  });
  const metrics = mark
    ? creditPlatePlacement({
        boxWidth,
        boxHeight,
        mark: mark.rect,
        paddingX: step.paddingX,
        paddingY: step.paddingY,
        margin: step.margin,
        minWidth: step.minWidth,
        minHeight: step.minHeight,
      })
    : null;
  if (!metrics) return { mark: mark?.rect ?? null, plate: null };
  return {
    mark: mark.rect,
    plate: {
      left: boxWidth - metrics.right - Math.max(metrics.minWidth, 0),
      top: boxHeight - metrics.bottom - Math.max(metrics.minHeight ?? 0, 0),
      right: boxWidth - metrics.right,
      bottom: boxHeight - metrics.bottom,
    },
  };
}

for (const { vp, box, source, position, onScreen } of HERO_VIEWPORTS) {
  test(`credit geometry · hero ${vp}: the mark that is on screen is covered, the plate stays in frame`, () => {
    const [boxWidth, boxHeight] = box;
    const step = stepFor(boxWidth);
    const { mark, plate } = place({ boxWidth, boxHeight, source, position, step });
    const visible = intersectRect(mark, { left: 0, top: 0, right: boxWidth, bottom: boxHeight });

    if (!onScreen) {
      /* The crop has taken the mark out of frame; nothing may be placed. */
      assert.ok(
        !visible || rectArea(visible) / rectArea(mark) < 0.2,
        `${vp}: the hero crop was expected to take the mark off screen`,
      );
      assert.equal(plate, null, `${vp}: no plate when the mark is not in the rendered frame`);
      return;
    }

    assert.ok(visible, `${vp}: the mark is on screen`);
    assert.ok(plate, `${vp}: the plate must be placed`);
    assert.ok(plate.left <= visible.left + 0.5, `${vp}: plate left ${plate.left} must cover ${visible.left}`);
    assert.ok(plate.top <= visible.top + 0.5, `${vp}: plate top ${plate.top} must cover ${visible.top}`);
    assert.ok(plate.right >= visible.right - 0.5, `${vp}: plate right ${plate.right} must cover ${visible.right}`);
    assert.ok(plate.bottom >= visible.bottom - 0.5, `${vp}: plate bottom ${plate.bottom} must cover ${visible.bottom}`);
    /* Never outside the film frame — no overflow, no page background, no
       horizontal scrollbar. */
    assert.ok(plate.left >= -0.5, `${vp}: plate must not leave the frame on the left`);
    assert.ok(plate.top >= -0.5, `${vp}: plate must not leave the frame on the top`);
    assert.ok(plate.right <= boxWidth + 0.5, `${vp}: plate must not overflow the right edge`);
    assert.ok(plate.bottom <= boxHeight + 0.5, `${vp}: plate must not overflow the bottom edge`);
    /* The plate stays a credit, not a sheet: a corner of the frame only. */
    assert.ok(plate.right - plate.left <= boxWidth * 0.22, `${vp}: plate must stay a corner credit`);
  });
}

for (const { vp, box } of CRAFT_VIEWPORTS) {
  test(`credit geometry · art of gold ${vp}: the mark is inside the frame and covered`, () => {
    const [boxWidth, boxHeight] = box;
    const step = stepFor(boxWidth);
    const { mark, plate } = place({ boxWidth, boxHeight, source: [1920, 1080], position: [0.5, 0.5], step });

    /* The film, the poster and the frame are all 16:9 — nothing is cropped. */
    assert.ok(mark.right <= boxWidth && mark.left >= 0, `${vp}: the mark is inside a 16:9 frame`);
    assert.ok(plate, `${vp}: the plate must be placed`);
    assert.ok(plate.left <= mark.left + 0.5, `${vp}: covers left`);
    assert.ok(plate.top <= mark.top + 0.5, `${vp}: covers top`);
    assert.ok(plate.right >= mark.right - 0.5, `${vp}: covers right`);
    assert.ok(plate.bottom >= mark.bottom - 0.5, `${vp}: covers bottom`);
    assert.ok(plate.left >= -0.5 && plate.top >= -0.5, `${vp}: inside the frame`);
    assert.ok(plate.right <= boxWidth + 0.5 && plate.bottom <= boxHeight + 0.5, `${vp}: inside the frame`);
  });
}

/* -------------------------------------------------------------------------- */
/* The sweep — a future layout change cannot silently drop the coverage        */
/* -------------------------------------------------------------------------- */

test("credit geometry · every plausible frame shape keeps the mark covered and the plate in frame", () => {
  const sources = [
    [1280, 720], // hero films
    [1920, 1080], // Art of Gold
    [720, 1280], // a portrait mobile capture, should one ever be delivered
  ];
  const positions = [
    [0.18, 0.3], // desktop focal point
    [0.64, 0.26], // mobile focal point
    [0.5, 0.5], // centred (the Art of Gold frame)
  ];

  let placed = 0;
  let withheld = 0;
  for (const [sourceWidth, sourceHeight] of sources) {
    for (const [positionX, positionY] of positions) {
      for (let width = 320; width <= 1920; width += 20) {
        for (const ratio of [0.5, 0.62, 0.75, 0.9, 1, 1.25, 1.45, 1.6, 1.78, 1.95, 2.1]) {
          const boxWidth = width;
          const boxHeight = Math.round(width / ratio);
          const step = stepFor(width);
          const { mark, plate } = place({
            boxWidth,
            boxHeight,
            source: [sourceWidth, sourceHeight],
            position: [positionX, positionY],
            step,
          });
          const visible = intersectRect(mark, { left: 0, top: 0, right: boxWidth, bottom: boxHeight });
          const onScreen = visible && rectArea(visible) / rectArea(mark) >= 0.2;

          if (!onScreen) {
            assert.equal(plate, null, `no plate when the mark is off screen (${width}×${boxHeight})`);
            withheld += 1;
            continue;
          }

          assert.ok(plate, `plate must be placed (${width}×${boxHeight})`);
          assert.ok(plate.left <= visible.left + 0.5 && plate.top <= visible.top + 0.5, `covers top-left (${width}×${boxHeight})`);
          assert.ok(
            plate.right >= visible.right - 0.5 && plate.bottom >= visible.bottom - 0.5,
            `covers bottom-right (${width}×${boxHeight})`,
          );
          assert.ok(plate.left >= -0.5 && plate.top >= -0.5, `inside the frame (${width}×${boxHeight})`);
          assert.ok(plate.right <= boxWidth + 0.5 && plate.bottom <= boxHeight + 0.5, `inside the frame (${width}×${boxHeight})`);
          placed += 1;
        }
      }
    }
  }
  assert.ok(placed > 2000, `the sweep must actually exercise placements (placed ${placed})`);
  assert.ok(withheld > 100, `the sweep must also exercise the off-crop case (withheld ${withheld})`);
});
