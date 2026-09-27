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

test("14.4C · initial markup is poster-first, click-to-play, inline and non-looping", () => {
  const html = render(content);
  assert.match(html, /<video[^>]+src="\/test-craft\.mp4"/);
  assert.match(html, /playsInline=""/);
  assert.match(html, /preload="none"/);
  assert.match(html, /<img[^>]+opacity-100/);
  assert.match(html, /<video[^>]+opacity-0/);
  assert.doesNotMatch(html, /<video[^>]+(?:autoPlay|autoplay|loop|controls)=/);
  assert.match(html, /aria-label="Play the art of gold film"/);
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

test("14.4C · labelled section, descriptive media and keyboard-operable native button", () => {
  const html = render(content);
  assert.match(html, /aria-labelledby="brand-film-title"/);
  assert.match(html, /<h2 id="brand-film-title"/);
  assert.match(html, /alt="Goldsmith handwork and a finished gold necklace"/);
  assert.match(html, /<button type="button"[^>]+aria-label="Play the art of gold film"/);
});

test("14.4C · pause and completion keep the existing poster/reset/replay wiring", () => {
  const code = component();
  assert.match(code, /const handlePause = \(\) => \{\s*setPlaying\(false\);/);
  assert.match(code, /onPause=\{handlePause\}/);
  assert.match(code, /onEnded=\{handleEnded\}/);
  assert.match(code, /videoRef\.current\.currentTime = 0;/);
  assert.match(code, /controls=\{playing\}/);
  assert.match(code, /!playing && !reducedMotion && hasVideo/);
  assert.match(code, /onClick=\{handlePlay\}/);
  // Runtime play/pause/resume/replay is also exercised by support/phase14-4c-browser.mjs.
});

test("14.4C · rejected playback and media errors keep poster fallbacks", () => {
  const code = component();
  assert.match(code, /\.catch\(/);
  assert.match(code, /onError=\{handleError\}/);
  assert.match(code, /Boolean\(content\.video\?\.src\) && !failed/);
  assert.match(code, /const showPoster = !playing \|\| !canPlay \|\| failed \|\| reducedMotion/);
});

test("14.4C · media flow and restrained layout are preserved, no UI mock import or sticker", () => {
  const code = component();
  assert.match(code, /src=\{content\.video\.src\}/);
  assert.match(code, /poster=\{content\.poster\}/);
  assert.match(code, /preload=\{inView \? "metadata" : "none"\}/);
  assert.match(code, /aspect-\[16\/9\]/);
  assert.match(code, /max-w-5xl/);
  assert.match(code, /background="cream"/);
  assert.doesNotMatch(code, /from ["'][^"']*mock|\.mp4|sticker|watermark|autoPlay\s*=|<canvas/i);
  assert.match(read("hooks/useHomepage.js"), /contentService\.getHomepage\(provider\)/);
  assert.match(read("pages/customer/home/HomePage.jsx"), /brand_film: BrandFilmSection/);
});
