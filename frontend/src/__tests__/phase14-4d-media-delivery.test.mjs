/**
 * PHASE 14.4D — MEDIA DELIVERY (instant, streaming playback)
 * -----------------------------------------------------------------------------
 * The homepage hero painted its poster, sat still, and only then began to play.
 * The cause was the build, not the player: `vite-plugin-singlefile` inlines
 * every asset, so all five films (22 MB) were base64 inside index.html — a
 * 35 MB document. A `data:` URL cannot be range-requested and is not decodable
 * until the whole payload has arrived, so no film could start before the last
 * byte of it had downloaded.
 *
 * These checks lock the fix:
 *
 *   · media is emitted as a real file, so faststart + range requests apply;
 *   · the single-file build is otherwise untouched (JS/CSS stay inlined);
 *   · the hero and the atelier film each cover the delivered footage's corner
 *     star mark with the shared house sticker;
 *   · the hero keeps its "one film at a time, autoplaying, poster-first"
 *     contract, and the reel index no longer sits under the sticker.
 */
import "./support/browser-globals.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";

import viteConfig from "../../vite.config.js";
import mockProvider from "../services/providers/mock/mockProvider.js";
import { contentService } from "../services/contentService.js";
import { HERO_MOBILE_QUERY } from "../services/heroReelService.js";
import HeroSection from "../pages/customer/home/components/HeroSection.jsx";
import BrandFilmSection from "../pages/customer/home/components/BrandFilmSection.jsx";

const SRC_DIR = join(new URL(".", import.meta.url).pathname, "..");
const read = (rel) => readFileSync(join(SRC_DIR, rel), "utf8");

/* The plugin mutates the config it is handed, so run its `config` hook over a
   bare object exactly as Vite does and inspect the result. */
function resolvedBuildConfig() {
  const plugin = viteConfig.plugins.find((entry) => entry && entry.name === "vite:singlefile");
  assert.ok(plugin, "the single-file plugin must stay in the build");
  const config = { build: {} };
  plugin.config(config);
  return config;
}

const FILMS = ["signature-gold.mp4", "bridal-gold.mp4", "art-of-gold-web.mp4"];
const STILLS = ["hero.avif", "art-of-gold-poster.jpg", "triptych.jpg"];

/* ==========================================================================
   1. BUILD — MEDIA STAYS STREAMABLE
   ========================================================================== */

test("14.4D · films and stills are emitted as files, never base64-inlined", () => {
  const { build } = resolvedBuildConfig();
  assert.equal(typeof build.assetsInlineLimit, "function", "the inline decision must be per-file");
  for (const file of [...FILMS, ...STILLS]) {
    assert.equal(build.assetsInlineLimit(`/src/mock/assets/${file}`), false, `${file} must not be inlined`);
  }
  /* Anything that is not media keeps the single-file behaviour (tiny assets,
     and the JS/CSS the plugin inlines separately). */
  assert.equal(build.assetsInlineLimit("/src/mock/assets/mark.svg"), true);
});

test("14.4D · the single-file build itself is otherwise preserved", () => {
  const config = resolvedBuildConfig();
  /* Relative base, flat asset dir, one CSS file and one JS chunk: the shape
     vite-plugin-singlefile needs in order to inline code into index.html. */
  assert.equal(config.base, "./");
  assert.equal(config.build.assetsDir, "");
  assert.equal(config.build.cssCodeSplit, false);
  assert.equal(config.build.rollupOptions.output.inlineDynamicImports, true);
  assert.equal(config.build.chunkSizeWarningLimit, 100_000_000);
  assert.ok(config.plugins === undefined);
});

test("14.4D · the inline rule is stated in the config, not left to a default", () => {
  const config = readFileSync(new URL("../../vite.config.js", import.meta.url), "utf8");
  assert.match(config, /assetsInlineLimit: \(filePath\) => !STREAMED_MEDIA\.test\(filePath\)/);
  assert.match(config, /const STREAMED_MEDIA = \/\\\.\(mp4\|webm\|mov\|m4v\|avif\|jpe\?g\|png\|webp\)\$\/i;/);
  /* The plugin assigns its own recommended config last, so the override is the
     only place this setting survives. */
  assert.match(config, /overrideConfig: \{/);
});

/* ==========================================================================
   2. HERO — STICKER OVER THE MARK, REEL INDEX CLEAR OF IT
   ========================================================================== */

async function heroContent() {
  const doc = await contentService.getHomepage(mockProvider);
  return doc.sections.find((section) => section.type === "hero").content;
}

function withFootage(content) {
  return {
    ...content,
    videos: content.videos.map((video) => ({
      ...video,
      src: `/fixture/${video.id}.mp4`,
      mobileSrc: `/fixture/${video.id}-mobile.mp4`,
    })),
  };
}

const renderHero = (content) =>
  renderToStaticMarkup(h(MemoryRouter, null, h(HeroSection, { content })));

test("14.4D · the hero covers the corner mark and keeps the reel index clear of it", async () => {
  const content = withFootage(await heroContent());
  const html = renderHero(content);
  /* One seal, bottom-right, above the films and click-through. */
  const stickers = html.match(/data-media-sticker="[^"]*"/g) ?? [];
  assert.deepEqual(stickers, ['data-media-sticker="bottom-right"'], "exactly one seal, on the marked corner");
  assert.match(html, /aria-hidden="true" data-media-sticker="bottom-right" class="media-sticker pointer-events-none/);
  /* Pinned to the film's frame, not the section's: the hero crops the film, so
     a section-anchored seal would drift off the mark and into the copy. */
  assert.match(html, /<div class="hero__sticker-shell"[^>]*>\s*<div class="hero__sticker-film">/);
  /* The hairline index moved to the left so it cannot sit under the seal. */
  const index = html.match(/<div class="hero__reel-index[^"]*"/);
  assert.ok(index, "the reel index must still be rendered");
  assert.match(index[0], /bottom-6 left-6[^"]*sm:left-10/);
  assert.doesNotMatch(index[0], /right-/);
});

test("14.4D · the seal frame reproduces the film's cover box and focal point", () => {
  const css = read("index.css");
  /* Cover geometry for a 16:9 film, and the same focal point the film uses —
     percentage `left` plus an equal negative translate is exactly what
     `object-position: x% y%` does. */
  assert.match(css, /\.hero__sticker-shell \{\s*\n\s*position: absolute;\s*\n\s*inset: 0;\s*\n\s*container-type: size;/);
  assert.match(css, /width: max\(100cqw, calc\(100cqh \* 16 \/ 9\)\);/);
  assert.match(css, /height: max\(100cqh, calc\(100cqw \* 9 \/ 16\)\);/);
  assert.match(css, /--seal-focal-x: 64%;\s*\n\s*--seal-focal-y: 26%;/);
  assert.match(css, /transform: translate\(calc\(-1 \* var\(--seal-focal-x\)\), calc\(-1 \* var\(--seal-focal-y\)\)\);/);
  /* Desktop switches the crop — the seal must switch with it. */
  const desktop = css.slice(css.indexOf("@media (min-width: 1280px)"));
  assert.match(desktop, /\.hero__sticker-film \{\s*\n\s*--seal-focal-x: 18%;\s*\n\s*--seal-focal-y: 30%;/);
});

test("14.4D · no footage, no seal — the poster hero is untouched", async () => {
  const html = renderHero(await heroContent());
  assert.match(html, /data-hero-mode="poster"/);
  assert.doesNotMatch(html, /data-media-sticker/);
});

test("14.4D · the seal is decorative only: no text for assistive tech, no focus", () => {
  const sticker = read("components/ui/MediaSticker.jsx");
  assert.match(sticker, /aria-hidden="true"/);
  assert.match(sticker, /pointer-events-none/);
  assert.doesNotMatch(sticker, /<button|tabIndex|onClick|onMouseEnter/);
  const css = read("index.css");
  /* Static tilt, no animation — the sticker adds nothing to the playback path. */
  assert.match(css, /\.media-sticker__seal \{\s*\n\s*transform: rotate\(-8deg\);/);
  assert.doesNotMatch(css, /@keyframes[^{]*sticker/i);
});

test("14.4D · the hero still autoplays one film at a time, poster-first", async () => {
  const content = withFootage(await heroContent());
  const previous = window.matchMedia;
  window.matchMedia = (query) => ({
    matches: query === HERO_MOBILE_QUERY ? false : false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  });
  let html;
  try {
    html = renderHero(content);
  } finally {
    if (previous) window.matchMedia = previous;
    else delete window.matchMedia;
  }
  const videos = html.match(/<video[^>]*>/g) ?? [];
  assert.equal(videos.length, 1, "only the active film is mounted");
  assert.match(videos[0], /preload="auto"/);
  assert.match(videos[0], /autoplay=""/i);
  assert.match(html, /data-hero-mode="video"/);
  /* The still is the film's own first frame, so the handover is invisible. */
  assert.match(html, /<img[^>]+class="hero__media hero__poster/);
});

/* ==========================================================================
   3. ATELIER FILM — SAME SEAL, SCROLL-DRIVEN PLAYBACK
   ========================================================================== */

test("14.4D · the atelier film carries the same seal, and no play button up front", () => {
  const content = {
    title: "Where Heritage Meets Innovation",
    poster: "/test-craft-poster.jpg",
    playLabel: "Play the art of gold film",
    video: { src: "/test-craft.mp4", alt: "Goldsmith handwork and a finished gold necklace" },
  };
  const html = renderToStaticMarkup(h(BrandFilmSection, { content }));
  assert.match(html, /data-media-sticker="bottom-right"/);
  assert.doesNotMatch(html, /<button/, "playback starts on scroll; the button is only a fallback");
  assert.match(html, /<video[^>]+muted=""/);
  assert.match(html, /preload="none"/, "nothing is fetched until the section is near the viewport");
});
