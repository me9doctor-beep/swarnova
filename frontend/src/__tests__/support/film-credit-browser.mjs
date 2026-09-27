/**
 * FILM CREDIT PLATE — optional real-Chromium acceptance run.
 * -----------------------------------------------------------------------------
 * Companion to `film-credit-geometry.test.mjs`, which freezes the same
 * arithmetic in Node. This one measures the *rendered* page, because the plate
 * is placed from the frame the browser actually draws: the element box, the
 * film's intrinsic size and its computed `object-position`.
 *
 * It is deliberately not part of `npm test` — the suite must stay runnable
 * without browser tooling. Start Vite (or `vite preview`) and run it by hand:
 *
 *   PLAYWRIGHT_MODULE=playwright-core CHROMIUM_EXECUTABLE=/path/to/chromium \
 *     node src/__tests__/support/film-credit-browser.mjs
 *
 * BASE_URL, VIEWPORTS and REPORT_PATH are optional. Playwright is resolved from
 * PLAYWRIGHT_MODULE (default "playwright"), and Chromium from
 * CHROMIUM_EXECUTABLE when a local build must be used.
 *
 * What it asserts, at every supported viewport and again across a live resize:
 *
 *   · the corner mark that is inside the rendered frame is fully covered by
 *     the credit plate;
 *   · the plate is fully inside the film frame — no overflow, no horizontal
 *     scrollbar;
 *   · where the hero's cover crop has taken the mark off screen (tablet
 *     portrait and phones), no plate is placed and nothing of the mark is
 *     rendered;
 *   · the document reports no layout shift and no horizontal overflow.
 */
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";

/* `playwright` exports `chromium` directly; a CommonJS build reached through
   an absolute path (a local `playwright-core`) arrives as `default`. */
const playwright = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const { chromium } = playwright.chromium ? playwright : playwright.default;

/* The mark's box in fractions of the source frame — mirrored from
   utils/filmFrameGeometry.js so this script never depends on the app's own
   numbers agreeing with themselves. */
const MARK = { left: 0.882, top: 0.792, right: 0.93, bottom: 0.874 };

const VIEWPORTS = (process.env.VIEWPORTS || "1536x864,1280x800,1024x768,768x1024,430x932,390x844,375x812")
  .split(",")
  .map((pair) => pair.split("x").map(Number));

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_EXECUTABLE || undefined,
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--autoplay-policy=no-user-gesture-required",
    "--enable-unsafe-swiftshader",
    "--use-angle=swiftshader",
  ],
});
const base = process.env.BASE_URL || "http://127.0.0.1:5173";
const report = { browser: browser.version(), base, viewports: [], resize: null, rotation: null };

/** Where the mark lands in the element box, in CSS pixels. */
function markRect({ width, height, sw, sh, posX, posY }) {
  const scale = Math.max(width / sw, height / sh);
  const freeX = Math.max(sw * scale - width, 0);
  const freeY = Math.max(sh * scale - height, 0);
  const ox = (freeX * posX) / scale;
  const oy = (freeY * posY) / scale;
  return {
    left: (MARK.left * sw - ox) * scale,
    top: (MARK.top * sh - oy) * scale,
    right: (MARK.right * sw - ox) * scale,
    bottom: (MARK.bottom * sh - oy) * scale,
  };
}

const measure = ({ host, plate: plateSelector, media: mediaSelector }) => {
  const root = document.querySelector(host);
  if (!root) return { missing: true };
  const media = mediaSelector ? root.querySelector(mediaSelector) : root.querySelector("video");
  const plate = root.querySelector(plateSelector);
  const box = root.getBoundingClientRect();
  const rel = (el) => {
    const r = el.getBoundingClientRect();
    return {
      left: +(r.left - box.left).toFixed(2),
      top: +(r.top - box.top).toFixed(2),
      right: +(r.right - box.left).toFixed(2),
      bottom: +(r.bottom - box.top).toFixed(2),
      width: +r.width.toFixed(2),
      height: +r.height.toFixed(2),
    };
  };
  const doc = document.documentElement;
  if (!media) return { missing: true, scroll: { w: doc.scrollWidth, client: doc.clientWidth } };
  const [posX, posY] = getComputedStyle(media)
    .objectPosition.split(/\s+/)
    .map((token) => Number.parseFloat(token) / 100);
  return {
    box: { w: +box.width.toFixed(2), h: +box.height.toFixed(2) },
    media: {
      ...rel(media),
      sw: media.videoWidth || media.naturalWidth,
      sh: media.videoHeight || media.naturalHeight,
    },
    posX,
    posY,
    plate: plate
      ? {
          ...rel(plate),
          placed: plate.dataset.placed === "true",
          styleRight: plate.style.right,
          styleBottom: plate.style.bottom,
        }
      : null,
    scroll: { w: doc.scrollWidth, client: doc.clientWidth },
  };
};

function judge(info) {
  if (info.missing) return { missing: true };
  const m = markRect({
    width: info.media.width,
    height: info.media.height,
    sw: info.media.sw,
    sh: info.media.sh,
    posX: info.posX,
    posY: info.posY,
  });
  const visible = {
    left: Math.max(m.left, info.media.left),
    top: Math.max(m.top, info.media.top),
    right: Math.min(m.right, info.media.right),
    bottom: Math.min(m.bottom, info.media.bottom),
  };
  const area = (r) => Math.max(r.right - r.left, 0) * Math.max(r.bottom - r.top, 0);
  const onScreen = area(visible) / area(m) >= 0.2;
  const result = { onScreen, plate: info.plate, mark: m, visible };
  result.noHScroll = info.scroll.w <= info.scroll.client;
  if (!onScreen) {
    result.placed = info.plate?.placed === true;
    return result;
  }
  const p = info.plate;
  result.placed = p?.placed === true;
  result.covers =
    !!p && p.left <= visible.left + 0.5 && p.top <= visible.top + 0.5 && p.right >= visible.right - 0.5 && p.bottom >= visible.bottom - 0.5;
  result.inside =
    !!p &&
    p.left >= -0.5 &&
    p.top >= -0.5 &&
    p.right <= info.media.right + 0.5 &&
    p.bottom <= info.media.bottom + 0.5;
  return result;
}

const HERO = { host: ".hero", plate: '[data-film-credit="hero"]', media: ".hero__reel-layer video" };
const CRAFT = { host: '#art-of-gold .aspect-\\[16\\/9\\]', plate: '[data-film-credit="art-of-gold"]', media: "video" };

try {
  for (const [width, height] of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width, height },
      hasTouch: width < 1024,
      isMobile: width < 1024,
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(String(error)));
    await page.addInitScript(() => {
      window.__cls = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__cls += entry.value;
      }).observe({ type: "layout-shift", buffered: true });
    });
    await page.goto(base, { waitUntil: "load", timeout: 120000 });
    await page
      .waitForFunction(
        () => {
          const video = document.querySelector(".hero video");
          return video && video.readyState >= 2 && !video.paused;
        },
        { timeout: 60000 },
      )
      .catch(() => {});
    await page.waitForTimeout(1500);

    const hero = judge(await page.evaluate(measure, HERO));
    await page.evaluate(() => document.querySelector("#art-of-gold")?.scrollIntoView({ block: "center", behavior: "instant" }));
    await page.waitForTimeout(2000);
    const craft = judge(await page.evaluate(measure, CRAFT));
    const cls = await page.evaluate(() => window.__cls);

    for (const [label, info] of [["hero", hero], ["art-of-gold", craft]]) {
      assert.ok(!info.missing, `${label} ${width}x${height}: film frame missing`);
      assert.equal(info.noHScroll, true, `${label} ${width}x${height}: horizontal overflow`);
      if (info.onScreen) {
        assert.equal(info.placed, true, `${label} ${width}x${height}: credit plate not placed`);
        assert.equal(info.covers, true, `${label} ${width}x${height}: plate does not cover the mark`);
        assert.equal(info.inside, true, `${label} ${width}x${height}: plate leaves the film frame`);
      } else {
        assert.equal(info.placed, false, `${label} ${width}x${height}: plate placed over a mark that is not rendered`);
      }
    }
    assert.deepEqual(errors, [], `${width}x${height}: page errors`);

    report.viewports.push({
      viewport: `${width}x${height}`,
      hero: { onScreen: hero.onScreen, placed: hero.placed, covers: hero.covers, inside: hero.inside, plate: hero.plate },
      craft: {
        onScreen: craft.onScreen,
        placed: craft.placed,
        covers: craft.covers,
        inside: craft.inside,
        plate: craft.plate,
      },
      cls,
      errors,
    });
    await context.close();
  }
  console.log(`PASS: ${VIEWPORTS.length} viewports — mark covered where rendered, plate inside the frame, no overflow`);

  /* Live resize, without a reload: the plate must re-anchor, never stick. */
  {
    const context = await browser.newContext({ viewport: { width: 1536, height: 864 } });
    const page = await context.newPage();
    await page.addInitScript(() => {
      window.__cls = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__cls += entry.value;
      }).observe({ type: "layout-shift", buffered: true });
    });
    await page.goto(base, { waitUntil: "load", timeout: 120000 });
    await page.waitForFunction(
      () => {
        const video = document.querySelector(".hero video");
        return video && video.readyState >= 2 && !video.paused;
      },
      { timeout: 60000 },
    );
    const steps = [...VIEWPORTS, ...VIEWPORTS.slice(0, 3).reverse()];
    const trail = [];
    for (const [width, height] of steps) {
      await page.setViewportSize({ width, height });
      await page.waitForTimeout(800);
      /* The hero is measured at the top of the page, then the craft film is
         scrolled into view so its element is mounted before it is measured. */
      const hero = judge(await page.evaluate(measure, HERO));
      await page.evaluate(() => document.querySelector("#art-of-gold")?.scrollIntoView({ block: "center", behavior: "instant" }));
      await page.waitForTimeout(900);
      const craft = judge(await page.evaluate(measure, CRAFT));
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(200);
      if (hero.onScreen) {
        assert.equal(hero.covers, true, `resize ${width}x${height}: hero plate no longer covers the mark`);
        assert.equal(hero.inside, true, `resize ${width}x${height}: hero plate left the frame`);
      } else {
        assert.equal(hero.placed, false, `resize ${width}x${height}: hero plate placed with the mark off-crop`);
      }
      assert.equal(craft.covers, true, `resize ${width}x${height}: craft plate no longer covers the mark`);
      assert.equal(craft.inside, true, `resize ${width}x${height}: craft plate left the frame`);
      assert.equal(hero.noHScroll, true, `resize ${width}x${height}: horizontal overflow`);
      trail.push({ viewport: `${width}x${height}`, heroCovers: hero.covers, craftCovers: craft.covers });
    }
    report.resize = { trail, cls: await page.evaluate(() => window.__cls) };
    console.log("PASS: live resize re-anchors the plate at every step, no layout shift, no overflow");
    await context.close();
  }

  /* Reel rotation: one plate serves all four films. */
  {
    const context = await browser.newContext({ viewport: { width: 1536, height: 864 } });
    const page = await context.newPage();
    await page.goto(base, { waitUntil: "load", timeout: 120000 });
    const seen = new Set();
    const deadline = Date.now() + 90000;
    while (Date.now() < deadline && seen.size < 4) {
      const info = await page.evaluate(() => document.querySelector(".hero")?.dataset.heroActive);
      if (info) seen.add(info);
      await page.waitForTimeout(600);
    }
    const hero = judge(await page.evaluate(measure, HERO));
    assert.deepEqual([...seen].sort(), ["bridal-gold", "contemporary", "heritage-statement", "signature-gold"]);
    assert.equal(hero.covers, true, "rotation: plate must still cover the mark after four films");
    report.rotation = { films: [...seen], covers: hero.covers, inside: hero.inside };
    console.log("PASS: hero rotation visits all four films with one plate, still covering");
    await context.close();
  }
} catch (error) {
  report.failure = error.stack;
  process.exitCode = 1;
  console.error(error);
} finally {
  if (process.env.REPORT_PATH) writeFileSync(process.env.REPORT_PATH, JSON.stringify(report, null, 2));
  await browser.close();
}
