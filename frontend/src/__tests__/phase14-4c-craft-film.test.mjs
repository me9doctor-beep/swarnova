import "./support/browser-globals.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import BrandFilmSection from "../pages/customer/home/components/BrandFilmSection.jsx";
import { media } from "../mock/assets/index.js";
import { homepage } from "../mock/data/homepage/index.js";
import mockProvider from "../services/providers/mock/mockProvider.js";
import { contentService } from "../services/contentService.js";
import { readMp4 } from "./support/mp4.mjs";

const src = new URL("../", import.meta.url);
const read = path => readFileSync(new URL(path, src), "utf8");
const file = new URL("mock/assets/videos/editorial/art-of-gold-web.mp4", src);
const metadata = () => readMp4(file);
const component = () => read("pages/customer/home/components/BrandFilmSection.jsx");
const record = homepage.sections.find(s => s.type === "brand_film");
const content = { ...record.content, poster: "/test-craft-poster.jpg", video: { src: "/test-craft.mp4", alt: "Goldsmith handwork and a finished gold necklace" } };
const render = value => renderToStaticMarkup(h(BrandFilmSection, { content: value }));

test("14.4C · delivered film is full-HD 16:9, trimmed at exactly 800 frames", () => {
  const m = metadata();
  assert.deepEqual([m.width, m.height], [1920, 1080]);
  assert.equal(m.samples, 800);
  assert.equal(m.fps, 24);
  assert.ok(Math.abs(m.seconds - 100 / 3) < 0.00001);
  assert.deepEqual(m.sampleDeltas, [m.timescale / 24], "constant frame cadence, not only average fps");
});

test("14.4C · SPS proves 8-bit 4:2:0 H264, not the uploaded High-10 format", () => {
  const m = metadata();
  assert.deepEqual([m.profile, m.level], [100, 40]);
  assert.deepEqual([m.chromaFormat, m.bitDepthLuma, m.bitDepthChroma], [1, 8, 8]);
});

test("14.4C · delivery has no audio track and faststart", () => {
  assert.deepEqual(metadata().trackHandlers, ["vide"]);
  assert.equal(metadata().moovBeforeMdat, true);
});

test("14.4C · web-delivery budget, keyframes and first IDR are enforced", () => {
  const m = metadata();
  assert.ok(m.bytes > 1_000_000 && m.bytes < 12_000_000);
  assert.ok(m.keyframes >= 17, "seekable roughly two-second GOPs");
  assert.ok(m.firstSampleNalTypes.includes(5));
});

test("14.4C · the obsolete diagnostic placeholder stays removed", () => {
  assert.equal(existsSync(new URL("mock/assets/videos/editorial/art-of-gold.mp4", src)), false);
  assert.doesNotMatch(read("mock/assets/index.js"), /from ["'].*art-of-gold\.mp4["']/);
});

test("14.4C · registry and data use the supplied film and its own extracted poster", () => {
  const registry = read("mock/assets/index.js");
  assert.match(registry, /import artOfGoldVideo from "\.\/videos\/editorial\/art-of-gold-web\.mp4"/);
  assert.match(registry, /import artOfGoldPoster from "\.\/images\/homepage\/art-of-gold-poster\.jpg"/);
  const data = read("mock/data/homepage/index.js");
  assert.match(data, /poster: media\.artOfGoldPoster/);
  assert.match(data, /src: media\.artOfGoldVideo/);
  assert.equal(record.content.poster, media.artOfGoldPoster);
  assert.equal(record.content.video.src, media.artOfGoldVideo);
});

test("14.4C · extracted JPEG poster is genuinely 1920 × 1080", () => {
  const bytes = readFileSync(new URL("mock/assets/images/homepage/art-of-gold-poster.jpg", src));
  assert.equal(bytes.readUInt16BE(0), 0xffd8);
  let dimensions;
  for (let p = 2; p < bytes.length - 8;) {
    assert.equal(bytes[p], 0xff);
    const marker = bytes[p + 1];
    if ([0xc0, 0xc1, 0xc2].includes(marker)) {
      dimensions = [bytes.readUInt16BE(p + 7), bytes.readUInt16BE(p + 5)]; break;
    }
    p += 2 + bytes.readUInt16BE(p + 2);
  }
  assert.deepEqual(dimensions, [1920, 1080]);
  assert.ok(bytes.length < 250_000);
});

test("14.4C · real provider/service preserves section order and film contract", async () => {
  const doc = await contentService.getHomepage(mockProvider);
  const i = doc.sections.findIndex(s => s.type === "brand_film");
  assert.ok(i > 0);
  assert.equal(doc.sections[i - 1].type, "editorial");
  assert.equal(doc.sections[i + 1].type, "why_choose_us");
  assert.deepEqual(doc.sections[i].content, record.content);
});

test("14.4C · initial markup is poster-first, inline, muted and non-looping", () => {
  const html = render(content);
  assert.match(html, /<video[^>]+src="\/test-craft\.mp4"/);
  assert.match(html, /playsInline=""/);
  /* Off-screen on first paint: nothing is fetched until the section is within
     the scroll margin, so the 9 MB film never competes with the hero. */
  assert.match(html, /preload="none"/);
  assert.match(html, /<img[^>]+opacity-100/);
  assert.match(html, /<video[^>]+opacity-0/);
  /* Playback is started from the scroll effect, not by an autoplay attribute,
     and there is no player chrome over an ambient film. */
  assert.doesNotMatch(html, /<video[^>]+(?:autoPlay|autoplay|loop|controls)=/);
  assert.match(html, /<video[^>]+muted=""/, "muted is what makes scroll-autoplay permitted");
});

test("14.4C · absent or empty video source retains poster without a dead play button", () => {
  for (const video of [undefined, {}, { src: "" }]) {
    const html = render({ ...content, video });
    assert.match(html, /test-craft-poster\.jpg/);
    assert.doesNotMatch(html, /<video|<button/);
  }
});

test("14.4C · reduced motion renders only the poster and no play affordance", () => {
  const original = window.matchMedia;
  window.matchMedia = () => ({ matches: true });
  try {
    const html = render(content);
    assert.match(html, /test-craft-poster\.jpg/);
    assert.doesNotMatch(html, /<video|<button/);
  } finally { window.matchMedia = original; }
});

test("14.4C · labelled section, descriptive media and keyboard-operable fallback button", () => {
  const html = render(content);
  assert.match(html, /aria-labelledby="brand-film-title"/);
  assert.match(html, /<h2 id="brand-film-title"/);
  assert.match(html, /alt="Goldsmith handwork and a finished gold necklace"/);
  /* The play control is a fallback now, not the way in: it is absent while the
     film can start by itself, and stays a real <button> when it is needed, so
     it remains reachable by keyboard. */
  assert.doesNotMatch(html, /<button/, "no play button while autoplay is untested");
  const code = component();
  assert.match(code, /<button\s+type="button"/);
  assert.match(code, /onClick=\{handlePlay\}/);
  assert.match(code, /aria-label=\{content\.playLabel \?\? "Play the art of gold film"\}/);
});

test("14.4C · pause and completion keep the existing poster/reset/replay wiring", () => {
  const code = component();
  assert.match(code, /const handlePause = \(\) => \{\s*setPlaying\(false\);/);
  assert.match(code, /onPause=\{handlePause\}/);
  assert.match(code, /onEnded=\{handleEnded\}/);
  assert.match(code, /videoRef\.current\.currentTime = 0;/);
  assert.match(code, /onClick=\{handlePlay\}/);
  /* The button is the fallback: a refused autoplay, or a replay of a finished
     film. Scrolling away and back re-arms it instead of looping. */
  assert.match(code, /\(needsTap \|\| ended\) && !playing && !reducedMotion && hasVideo/);
  assert.match(code, /if \(!inView\) setEnded\(false\);/);
  // Runtime play/pause/resume/replay is also exercised by support/phase14-4c-browser.mjs.
});

test("14.4C · the film starts by itself on scroll, muted, and pauses off-screen", () => {
  const code = component();
  /* Buffering and playback begin one margin ahead of the viewport, so the film
     is already moving when the frame arrives — not stalling on a poster. */
  assert.match(code, /rootMargin: "300px 0px"/);
  assert.match(code, /preload=\{inView \? "auto" : "none"\}/);
  assert.match(code, /video\.muted = true;/);
  assert.match(code, /const attempt = video\.play\(\);/);
  /* Start and pause are separate effects, so they can never fight: the pause
     effect only ever pauses. */
  assert.match(code, /if \(\(!inView \|\| reducedMotion \|\| failed\) && !video\.paused\)/);
  assert.match(code, /if \(!video\.paused\) return undefined;/);
  /* A refused autoplay falls back to the tap affordance; an AbortError is a
     pause() racing a play(), not a policy block. */
  assert.match(code, /err\?\.name === "AbortError"/);
  assert.match(code, /setNeedsTap\(true\)/);
});

test("14.4C · rejected playback and media errors keep poster fallbacks", () => {
  const code = component();
  assert.match(code, /\.catch\(/);
  assert.match(code, /onError=\{handleError\}/);
  assert.match(code, /Boolean\(content\.video\?\.src\) && !failed/);
  assert.match(code, /const showPoster = !playing \|\| !canPlay \|\| failed \|\| reducedMotion/);
});

test("14.4C · media flow and restrained layout are preserved, no UI mock import", () => {
  const code = component();
  assert.match(code, /src=\{content\.video\.src\}/);
  assert.match(code, /poster=\{content\.poster\}/);
  assert.match(code, /aspect-\[16\/9\]/);
  assert.match(code, /max-w-5xl/);
  assert.match(code, /background="cream"/);
  assert.doesNotMatch(code, /from ["'][^"']*mock|\.mp4|autoPlay\s*=|<canvas/i);
  assert.match(read("hooks/useHomepage.js"), /contentService\.getHomepage\(provider\)/);
  assert.match(read("pages/customer/home/HomePage.jsx"), /brand_film: BrandFilmSection/);
});

test("14.4C · the corner star mark is covered by the shared house sticker", () => {
  const code = component();
  const html = render(content);
  /* The delivered footage keeps a small star mark in one corner (the waiver
     recorded in PHASE_14_4C_RECONCILIATION.md). The film is not cropped,
     blurred or re-encoded to hide it — the house seal simply sits on top. */
  assert.match(code, /import MediaSticker from "\.\.\/\.\.\/\.\.\/\.\.\/components\/ui\/MediaSticker\.jsx"/);
  assert.match(code, /\{hasVideo \? <MediaSticker corner="bottom-right" size="sm" \/> : null\}/);
  assert.match(html, /data-media-sticker="bottom-right"/);
  assert.match(html, /media-sticker__seal/);
  /* Decorative and click-through: it must never swallow a tap meant for the
     play fallback or the caption beneath it. */
  assert.match(html, /data-media-sticker="bottom-right" class="media-sticker pointer-events-none/);
  assert.match(html, /aria-hidden="true" data-media-sticker/);
});
