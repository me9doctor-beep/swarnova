/**
 * PHASE 14.4A — CINEMATIC HOMEPAGE HERO REEL
 * -----------------------------------------------------------------------------
 * Focused checks for the four-film hero:
 *
 *   · four hero video records, each on the shared media contract
 *   · source resolution (desktop / mobile) and poster fallback
 *   · autoplay / muted / playsInline attributes on the rendered <video>
 *   · rotation order 1 → 2 → 3 → 4 → 1, one video mounted at a time
 *   · reduced motion → static poster, no <video>
 *   · no abstract motion (Ken Burns / shimmer / gradient clip) in the hero
 *   · no mock asset leakage into UI / hooks / services
 *   · the homepage document still resolves through the provider chain and the
 *     hero renders without a React runtime error
 *
 * Real footage has not been delivered, so the shipped slots are null; the
 * behavioural video-mode checks use in-test fixtures (plain strings), never
 * repo assets.
 */
import "./support/browser-globals.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";

import mockProvider from "../services/providers/mock/mockProvider.js";
import { contentService } from "../services/contentService.js";
import {
  HERO_MOBILE_QUERY,
  nextHeroIndex,
  normalizeHeroVideo,
  resolveHeroReel,
  resolveHeroVideoSource,
} from "../services/heroReelService.js";
import HeroSection from "../pages/customer/home/components/HeroSection.jsx";

const SRC_DIR = join(new URL(".", import.meta.url).pathname, "..");
const read = (rel) => readFileSync(join(SRC_DIR, rel), "utf8");

const EXPECTED_IDS = ["signature-gold", "bridal-gold", "contemporary", "heritage-statement"];
const CONTRACT_KEYS = ["src", "mobileSrc", "poster", "alt", "autoplay", "loop", "muted", "playsInline", "placement"];

async function heroContent() {
  const doc = await contentService.getHomepage(mockProvider);
  const hero = doc.sections.find((section) => section.type === "hero");
  assert.ok(hero, "homepage document must contain a hero section");
  return hero.content;
}

function withFootage(content, ids = EXPECTED_IDS) {
  return {
    ...content,
    videos: content.videos.map((video) =>
      ids.includes(video.id)
        ? { ...video, src: `/fixture/${video.id}.mp4`, mobileSrc: `/fixture/${video.id}-mobile.mp4` }
        : video
    ),
  };
}

function withMatchMedia(matcher, fn) {
  const previous = window.matchMedia;
  window.matchMedia = (query) => ({
    matches: matcher(query),
    media: query,
    addEventListener() {},
    removeEventListener() {},
  });
  try {
    return fn();
  } finally {
    if (previous) window.matchMedia = previous;
    else delete window.matchMedia;
  }
}

const render = (content) =>
  renderToStaticMarkup(h(MemoryRouter, null, h(HeroSection, { content })));

/* ==========================================================================
   1. FOUR HERO VIDEO RECORDS + MEDIA CONTRACT
   ========================================================================== */

test("14.4A · hero carries exactly four video records in campaign order", async () => {
  const content = await heroContent();
  assert.ok(Array.isArray(content.videos));
  assert.deepEqual(content.videos.map((v) => v.id), EXPECTED_IDS);
  assert.deepEqual(
    content.videos.map((v) => v.title),
    ["Signature Gold", "Bridal Gold", "Contemporary", "Heritage Statement Gold"]
  );
});

test("14.4A · every record satisfies the shared media contract", async () => {
  const content = await heroContent();
  for (const video of content.videos) {
    for (const key of CONTRACT_KEYS) {
      assert.ok(key in video, `${video.id}: contract lost \`${key}\``);
    }
    assert.equal(video.autoplay, true, `${video.id}: autoplay`);
    assert.equal(video.muted, true, `${video.id}: muted`);
    assert.equal(video.playsInline, true, `${video.id}: playsInline`);
    assert.equal(video.placement, "hero", `${video.id}: placement`);
    assert.ok(typeof video.poster === "string", `${video.id}: poster must be a URL string`);
    assert.ok(video.alt && video.alt.length > 20, `${video.id}: descriptive alt required`);
    assert.ok(video.targetDurationSec >= 8 && video.targetDurationSec <= 12, `${video.id}: 8–12 s target`);
  }
  /* Four distinct posters — the Signature one is the existing hero photograph. */
  const homepage = read("mock/data/homepage/index.js");
  assert.match(homepage, /poster: media\.heroEditorial/);
  assert.match(homepage, /poster: media\.heroReelBridalPoster/);
  assert.match(homepage, /poster: media\.heroReelContemporaryPoster/);
  assert.match(homepage, /poster: media\.heroReelHeritagePoster/);
  for (const file of ["bridal-gold-poster", "contemporary-gold-poster", "heritage-gold-poster"]) {
    assert.ok(existsSync(join(SRC_DIR, `mock/assets/images/homepage/hero-reel/${file}.avif`)), `${file} missing`);
  }
});

test("14.4A · undelivered footage stays null — never a synthetic stand-in", () => {
  const assets = read("mock/assets/index.js");
  for (const slot of ["Signature", "Bridal", "Contemporary", "Heritage"]) {
    const desktop = new RegExp(`(const heroReel${slot}Video = null;|import heroReel${slot}Video from "\\./videos/homepage/hero-reel/[a-z-]+\\.mp4";)`);
    const mobile = new RegExp(`(const heroReel${slot}MobileVideo = null;|import heroReel${slot}MobileVideo from "\\./videos/homepage/hero-reel/[a-z-]+-mobile\\.mp4";)`);
    assert.match(assets, desktop, `${slot}: slot must be null or a real hero-reel import`);
    assert.match(assets, mobile, `${slot}: mobile slot must be null or a real hero-reel import`);
  }
  assert.doesNotMatch(assets, /hero-cinematic/, "the abstract champagne placeholder must not return");
  assert.ok(existsSync(join(SRC_DIR, "mock/assets/videos/homepage/hero-reel/README.md")), "footage slots/prompts documented");
});

/* ==========================================================================
   2. SOURCE RESOLUTION + POSTER FALLBACK
   ========================================================================== */

test("14.4A · source resolution: mobile prefers mobileSrc, desktop uses src", () => {
  const record = { src: "/d.mp4", mobileSrc: "/m.mp4" };
  assert.equal(resolveHeroVideoSource(record, { isMobile: false }), "/d.mp4");
  assert.equal(resolveHeroVideoSource(record, { isMobile: true }), "/m.mp4");
  assert.equal(resolveHeroVideoSource({ src: "/d.mp4", mobileSrc: null }, { isMobile: true }), "/d.mp4");
  assert.equal(resolveHeroVideoSource({ src: null, mobileSrc: null }, { isMobile: true }), null);
  assert.equal(resolveHeroVideoSource(null), null);
  assert.equal(HERO_MOBILE_QUERY, "(max-width: 767px)");
});

test("14.4A · normalisation forces muted + inline and falls back to the section poster", () => {
  const v = normalizeHeroVideo({ id: "x", src: "/x.mp4", muted: false, playsInline: false }, "/poster.avif");
  assert.equal(v.muted, true);
  assert.equal(v.playsInline, true);
  assert.equal(v.autoplay, true);
  assert.equal(v.poster, "/poster.avif");
  assert.equal(v.playable, true);
  assert.equal(normalizeHeroVideo({ id: "y", src: "  " }).playable, false);
  assert.equal(normalizeHeroVideo(null), null);
});

test("14.4A · no footage → poster mode on the Signature photograph", async () => {
  const content = await heroContent();
  const reel = resolveHeroReel(content);
  assert.equal(reel.videos.length, 4);
  assert.equal(reel.playable.length, 0);
  assert.equal(reel.mode, "poster");
  assert.equal(reel.rotates, false);
  assert.equal(reel.poster.alt, content.image.alt);

  const html = render(content);
  assert.match(html, /data-hero-mode="poster"/);
  assert.doesNotMatch(html, /<video/, "no footage must mean no <video>");
  assert.match(html, /class="hero__media hero__poster/);
  assert.ok(html.includes(`alt="${content.image.alt}"`), "poster keeps its alt text");
});

test("14.4A · a failed record drops out and the poster remains", async () => {
  const content = withFootage(await heroContent(), ["signature-gold"]);
  assert.equal(resolveHeroReel(content).mode, "video");
  const failed = resolveHeroReel(content, { failedIds: ["signature-gold"] });
  assert.equal(failed.mode, "poster");
  assert.equal(failed.playable.length, 0);

  const hero = read("pages/customer/home/components/HeroSection.jsx");
  assert.match(hero, /onError=\{\(\) => reel\.markFailed\(record\.id\)\}/);
  /* The poster <img> is unconditional — it is outside every branch. */
  assert.match(hero, /\n      <img\n        src=\{reel\.poster\.src\}/);
});

/* ==========================================================================
   3. RENDERED VIDEO ATTRIBUTES
   ========================================================================== */

test("14.4A · video mode renders ONE <video>, muted, inline, autoplaying, poster-first", async () => {
  const content = withFootage(await heroContent());
  const html = withMatchMedia(() => false, () => render(content));
  const videos = html.match(/<video[^>]*>/g) ?? [];
  assert.equal(videos.length, 1, "only the active film may be mounted");
  const tag = videos[0];
  assert.match(tag, /src="\/fixture\/signature-gold\.mp4"/, "desktop source");
  assert.match(tag, /autoplay=""/i);
  assert.match(tag, /playsinline=""/i);
  assert.match(tag, /preload="auto"/);
  assert.match(tag, /poster="[^"]*"/);
  assert.doesNotMatch(tag, /loop=""/, "rotating clips advance on `ended`, so they must not loop");
  assert.match(html, /data-hero-mode="video"/);
  assert.match(html, /data-hero-active="signature-gold"/);
  /* Muted: attribute rendering of `muted` varies across React versions, so the
     component keeps the property in step at runtime — assert both halves. */
  const cv = read("components/ui/CinematicVideo.jsx");
  assert.match(cv, /muted=\{muted\}/);
  assert.match(cv, /video\.muted = muted;/);
  assert.match(read("pages/customer/home/components/HeroSection.jsx"), /\n            muted\n            playsInline\n/);
});

test("14.4A · a single delivered film loops instead of rotating", async () => {
  const content = withFootage(await heroContent(), ["bridal-gold"]);
  const reel = resolveHeroReel(content);
  assert.equal(reel.playable.length, 1);
  assert.equal(reel.rotates, false);
  const html = withMatchMedia(() => false, () => render(content));
  assert.match(html, /<video[^>]*loop=""/);
  assert.match(html, /data-hero-active="bridal-gold"/);
});

test("14.4A · mobile viewport renders the mobile source", async () => {
  const content = withFootage(await heroContent());
  const html = withMatchMedia((q) => q === HERO_MOBILE_QUERY, () => render(content));
  assert.match(html, /<video[^>]*src="\/fixture\/signature-gold-mobile\.mp4"/);
});

/* ==========================================================================
   4. ROTATION
   ========================================================================== */

test("14.4A · rotation order is 1 → 2 → 3 → 4 → 1", async () => {
  const content = withFootage(await heroContent());
  const reel = resolveHeroReel(content);
  assert.equal(reel.rotates, true);
  let index = 0;
  const seen = [reel.playable[index].id];
  for (let step = 0; step < 4; step += 1) {
    index = nextHeroIndex(index, reel.playable.length);
    seen.push(reel.playable[index].id);
  }
  assert.deepEqual(seen, [...EXPECTED_IDS, EXPECTED_IDS[0]]);
  assert.equal(nextHeroIndex(0, 0), 0);
  assert.equal(nextHeroIndex(undefined, 4), 0);
});

test("14.4A · rotation skips undelivered films and is slow + cinematic", async () => {
  const content = withFootage(await heroContent(), ["signature-gold", "heritage-statement"]);
  const reel = resolveHeroReel(content);
  assert.deepEqual(reel.playable.map((v) => v.id), ["signature-gold", "heritage-statement"]);
  assert.ok(reel.rotation.crossfadeMs >= 1200, "crossfade must be slow");
  assert.ok(reel.rotation.maxClipMs >= 10000, "watchdog must allow a full ~10 s clip");

  const hook = read("hooks/useHeroReel.js");
  assert.match(hook, /onEnded|advance/);
  const hero = read("pages/customer/home/components/HeroSection.jsx");
  assert.match(hero, /onEnded=\{outgoing \? undefined : reel\.advance\}/);
  assert.match(hero, /holdFinalFrame=\{reel\.rotates\}/);
  assert.match(hero, /paused=\{outgoing\}/, "the outgoing film must not keep playing");
  const css = read("index.css");
  assert.match(css, /@keyframes heroReelDissolve \{\s*from \{ opacity: 0; \}\s*to\s+\{ opacity: 1; \}/);
});

/* ==========================================================================
   5. REDUCED MOTION
   ========================================================================== */

test("14.4A · reduced motion → static poster, no video, no autoplay", async () => {
  const content = withFootage(await heroContent());
  assert.equal(resolveHeroReel(content, { reducedMotion: true }).mode, "poster");
  const html = withMatchMedia((q) => q.includes("prefers-reduced-motion"), () => render(content));
  assert.match(html, /data-hero-mode="poster"/);
  assert.doesNotMatch(html, /<video/);
  assert.doesNotMatch(html, /autoplay/i);
});

/* ==========================================================================
   6. NO ABSTRACT HERO ANIMATION
   ========================================================================== */

test("14.4A · the hero uses no Ken Burns, shimmer or gradient motion", () => {
  const hero = read("pages/customer/home/components/HeroSection.jsx");
  assert.doesNotMatch(hero, /className=[^>]*motion-ken-burns/);
  /* Comments may name what was removed; the rendered classes may not use it. */
  const code = hero.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
  assert.doesNotMatch(code, /motion-atelier-pulse|shimmer|particle|motion-ken-burns/i);
  assert.doesNotMatch(hero, /heroCinematic/);
});

/* ==========================================================================
   7. NO MOCK ASSET LEAKAGE
   ========================================================================== */

test("14.4A · UI, hooks and services never import mock assets or data", () => {
  const roots = ["components", "pages", "hooks", "layouts", "features"].map((d) => join(SRC_DIR, d));
  roots.push(join(SRC_DIR, "services/heroReelService.js"));
  const bad = [];
  const walk = (p) => {
    if (!existsSync(p)) return;
    if (statSync(p).isDirectory()) {
      for (const name of readdirSync(p)) walk(join(p, name));
    } else if (/\.(jsx?|mjs)$/.test(p)) {
      const src = readFileSync(p, "utf8");
      if (/from\s+["'][^"']*mock\/(assets|data)/.test(src) || /\.mp4["']/.test(src)) bad.push(p);
    }
  };
  roots.forEach(walk);
  assert.deepEqual(bad, [], "mock media must flow through the provider");
});

/* ==========================================================================
   8. HOMEPAGE ROUTE + RUNTIME
   ========================================================================== */

test("14.4A · homepage document resolves through the provider with the hero first", async () => {
  const doc = await contentService.getHomepage(mockProvider);
  const hero = doc.sections.find((s) => s.type === "hero");
  assert.equal(hero.order, 1);
  assert.equal(hero.enabled, true);
  const home = read("pages/customer/home/HomePage.jsx");
  assert.match(home, /hero: HeroSection/);
  assert.match(home, /useHomepage/);
});

test("14.4A · hero renders copy + CTAs with no React runtime error, in every mode", async () => {
  const base = await heroContent();
  const errors = [];
  const original = console.error;
  console.error = (...args) => errors.push(args.join(" "));
  try {
    for (const content of [base, withFootage(base), withFootage(base, ["contemporary"])]) {
      for (const matcher of [() => false, (q) => q === HERO_MOBILE_QUERY, (q) => q.includes("reduce")]) {
        const html = withMatchMedia(matcher, () => render(content));
        assert.match(html, /Timeless Beauty,/);
        assert.match(html, /Reimagined in Gold\./);
        assert.match(html, /Explore Collections/);
        assert.match(html, /Create with AI/);
        assert.match(html, /BIS Hallmarked/);
      }
    }
  } finally {
    console.error = original;
  }
  assert.deepEqual(errors.filter((e) => /ReferenceError|TypeError|Warning/.test(e)), []);
});

test("14.4A · NewsletterSection Link regression and favicon stay fixed", () => {
  const newsletter = read("pages/customer/home/components/NewsletterSection.jsx");
  assert.doesNotMatch(newsletter, /<Link\b/, "use ContentLink, not an unimported Link");
  assert.match(newsletter, /ContentLink/);
  const html = readFileSync(join(SRC_DIR, "..", "index.html"), "utf8");
  assert.match(html, /rel="icon"/);
  assert.doesNotMatch(html, /href="[^"]*favicon\.ico"/);
});
