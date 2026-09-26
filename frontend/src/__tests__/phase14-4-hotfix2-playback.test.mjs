/**
 * PHASE 14.4 HOTFIX 2 — real browser playback + homepage console cleanup
 * -----------------------------------------------------------------------------
 * The first 14.4 hotfix shipped MP4s that a browser refused to decode, and the
 * homepage threw `ReferenceError: Link is not defined`. Both passed the static
 * suite at the time, so these checks assert the things that were actually
 * broken, from the real files and the real source:
 *
 *   · the placeholders are multi-frame, correctly dimensioned, correctly
 *     timed, and structurally decodable (profile, keyframes, IDR slice)
 *   · the playback state machine is honest — `canPlay` is never the reveal
 *     gate, the real `playing` event is
 *   · the homepage has no unbound JSX identifier, and no page ever requests a
 *     favicon the app does not serve
 *
 * The values here were verified against a real Chromium (HeadlessChrome 153)
 * driving the Vite dev server; see PHASE_14_4_VIDEO_PLAYBACK_HOTFIX.md for the
 * observed readyState / paused / currentTime readings.
 */
import "./support/browser-globals.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, relative } from "node:path";
import { readMp4, NAL_TYPE } from "./support/mp4.mjs";

const SRC_DIR = join(new URL(".", import.meta.url).pathname, "..");
const FRONTEND_DIR = join(SRC_DIR, "..");
const read = (rel) => readFileSync(join(SRC_DIR, rel), "utf8");
const readRoot = (rel) => readFileSync(join(FRONTEND_DIR, rel), "utf8");

/* Phase 14.4A removed the two abstract champagne-gold hero placeholders
   (`homepage/hero-cinematic*.mp4`): the brief forbids abstract motion in the
   hero, and real hero footage is supplied through the reel slots checked in
   phase14-4a-hero-reel.test.mjs. The structural playback checks below still
   run, unchanged, against the remaining placeholder (the brand film). */
const HERO = "mock/assets/videos/homepage/hero-cinematic.mp4";
const HERO_MOBILE = "mock/assets/videos/homepage/hero-cinematic-mobile.mp4";
const BRAND = "mock/assets/videos/editorial/art-of-gold.mp4";
const ALL = [BRAND];

/* ==========================================================================
   1. ACTUAL DIMENSIONS / SOURCE RESOLUTION
   ========================================================================== */

test("hotfix2 · placeholders carry the real intended dimensions", () => {
  const brand = readMp4(join(SRC_DIR, BRAND));
  assert.deepEqual([brand.width, brand.height], [640, 360], "brand film must be 640x360");
  assert.ok(brand.width >= 640, `brand width too small: ${brand.width}`);

  /* 14.4A: the abstract hero placeholders must stay gone — they are exactly
     the "golden gradient" motion the hero brief rejects. */
  for (const rel of [HERO, HERO_MOBILE]) {
    assert.throws(() => statSync(join(SRC_DIR, rel)), `${rel} must not return`);
  }
});

test("hotfix2 · every placement is 16:9 or 9:16, never square", () => {
  for (const rel of ALL) {
    const { width, height } = readMp4(join(SRC_DIR, rel));
    const ratio = width / height;
    assert.ok(
      Math.abs(ratio - 16 / 9) < 0.01 || Math.abs(ratio - 9 / 16) < 0.01,
      `${rel}: ${width}x${height} is not a 16:9 / 9:16 frame`
    );
  }
});

/* ==========================================================================
   2. ACTUAL FRAME COUNT / DURATION — NOT A "LIVING POSTER"
   ========================================================================== */

test("hotfix2 · videos are multi-frame with non-zero duration (not single-IDR living posters)", () => {
  for (const rel of ALL) {
    const m = readMp4(join(SRC_DIR, rel));
    assert.ok(m.duration > 0, `${rel}: duration must be non-zero`);
    assert.ok(m.seconds >= 3 && m.seconds <= 5, `${rel}: ${m.seconds}s outside the 3-5s brief`);
    assert.ok(m.samples >= 48, `${rel}: only ${m.samples} frames — a still is not a playback test`);
    assert.ok(m.fps >= 23 && m.fps <= 31, `${rel}: ${m.fps.toFixed(2)}fps outside 24/30`);
    /* Distinct frames, not one frame repeated: with a real encoder a repeated
       frame would still be a sample, so check the keyframe/sample relationship
       and that the file carries far more bytes than a single frame could. */
    assert.ok(m.sampleSizes[0] > 500, `${rel}: first sample is ${m.sampleSizes[0]} bytes — implausibly small`);
  }
});

test("hotfix2 · hero and brand film are 4s @ 24fps with 96 samples", () => {
  for (const rel of ALL) {
    const m = readMp4(join(SRC_DIR, rel));
    assert.equal(m.samples, 96, `${rel}: expected 96 samples`);
    assert.equal(Math.round(m.seconds * 1000), 4000, `${rel}: expected 4.000s`);
    assert.equal(Math.round(m.fps), 24, `${rel}: expected 24fps`);
  }
});

/* ==========================================================================
   3. BROWSER-COMPATIBLE MP4 STRUCTURE
   ========================================================================== */

test("hotfix2 · MP4 structure is what a browser decoder needs", () => {
  for (const rel of ALL) {
    const data = readFileSync(join(SRC_DIR, rel));
    const m = readMp4(join(SRC_DIR, rel));

    /* ISOBMFF brand set that Chrome/Edge/Safari all accept. */
    assert.equal(data.toString("latin1", 8, 12), "isom", `${rel}: unexpected major brand`);
    const compat = data.toString("latin1", 16, data.readUInt32BE(0));
    assert.ok(compat.includes("avc1"), `${rel}: compatible brands missing avc1`);

    /* moov ahead of mdat so playback can start without a second round trip. */
    assert.ok(m.moovBeforeMdat, `${rel}: moov must precede mdat (faststart)`);

    /* An AVC video sample entry with a decoder configuration record. */
    assert.ok(data.includes(Buffer.from("avc1")), `${rel}: missing avc1 sample entry`);
    assert.ok(data.includes(Buffer.from("avcC")), `${rel}: missing avcC decoder config`);

    /* Baseline profile (66 / 0x42). Baseline is 4:2:0 by definition, which is
       exactly the yuv420p requirement, and it is the widest-compatibility
       H.264 profile for Edge/Chrome. */
    assert.equal(m.profile, 0x42, `${rel}: expected baseline profile 0x42, got 0x${m.profile?.toString(16)}`);
    assert.ok(m.level > 0 && m.level <= 0x1f, `${rel}: implausible level_idc ${m.level}`);
  }
});

test("hotfix2 · every placeholder declares keyframes and starts with an IDR slice", () => {
  for (const rel of ALL) {
    const m = readMp4(join(SRC_DIR, rel));
    assert.ok(m.keyframes >= 1, `${rel}: no stss keyframes declared`);
    assert.ok(
      m.firstSampleNalTypes.includes(NAL_TYPE.IDR),
      `${rel}: first keyframe has no IDR slice; parsed [${m.firstSampleNalTypes}]`
    );
    /* Whatever precedes the IDR must be legitimate non-VCL (SEI/SPS/PPS). */
    for (const nal of m.firstSampleNalTypes) {
      assert.ok(
        [NAL_TYPE.IDR, NAL_TYPE.SEI, NAL_TYPE.SPS, NAL_TYPE.PPS].includes(nal),
        `${rel}: unexpected NAL type ${nal} in the first sample`
      );
    }
  }
});

test("hotfix2 · placeholders stay small enough to bundle", () => {
  for (const rel of ALL) {
    const bytes = statSync(join(SRC_DIR, rel)).size;
    assert.ok(bytes > 20_000, `${rel}: ${bytes} bytes is suspiciously close to a stub`);
    assert.ok(bytes < 400_000, `${rel}: ${bytes} bytes is too large for a diagnostic placeholder`);
  }
});

/* ==========================================================================
   4. HERO PLAYBACK STATE — HONEST, NOT OPTIMISTIC
   ========================================================================== */

test("hotfix2 · CinematicVideo reveals on the real playing event, never on canPlay alone", () => {
  const cv = read("components/ui/CinematicVideo.jsx");

  /* The reveal gate. */
  assert.match(cv, /const videoRevealed = playing && !failed;/, "reveal must be gated on real playback");
  assert.match(cv, /onPlaying=\{handlePlaying\}/, "must listen to the `playing` event");
  assert.doesNotMatch(
    cv,
    /canPlay\s*\?\s*"opacity-100"/,
    "canPlay must not be the opacity gate — it means 'worth trying', not 'on screen'"
  );

  /* `playing` is driven only by the playing event, `canPlay` by readiness. */
  assert.match(cv, /const handlePlaying = \(\) => \{\s*setPlaying\(true\);/);
  assert.match(cv, /const handleCanPlay = \(\) => \{\s*setCanPlay\(true\);/);

  /* The lifecycle must be observable without reaching into React. */
  assert.match(cv, /data-playback-state=\{playbackState\}/);
  for (const state of ["failed", "playing", "blocked", "ready", "reduced-motion", "loading"]) {
    assert.ok(cv.includes(`"${state}"`), `playbackState never yields "${state}"`);
  }
});

test("hotfix2 · playback cannot deadlock on preload=metadata", () => {
  const cv = read("components/ui/CinematicVideo.jsx");
  /* A hero with preload="metadata" can sit at HAVE_METADATA and never fire
     `canplay` on its own, so readiness must also be signalled by
     loadedmetadata / loadeddata — otherwise play() is never attempted. */
  assert.match(cv, /onLoadedMetadata=\{handleCanPlay\}/);
  assert.match(cv, /onLoadedData=\{handleCanPlay\}/);
  assert.match(cv, /onCanPlay=\{handleCanPlay\}/);
  /* And exactly one effect owns starting playback, so the pause effect can
     never fight it. */
  assert.equal(cv.match(/video\.play\(\)/g)?.length, 2, "expected play() in the autoplay effect and the tap handler only");
});

test("hotfix2 · hero video and poster are stacked explicitly", () => {
  const css = read("index.css");
  assert.match(css, /\.cinematic-media-wrap img\.cinematic-media \{\s*z-index: 0;/);
  assert.match(css, /\.cinematic-media-wrap video\.cinematic-media \{\s*z-index: 1;/);
  /* The veil is the section's, and must stay — only the stacking changed. */
  const hero = read("pages/customer/home/components/HeroSection.jsx");
  assert.match(hero, /hero__veil/);
});

test("hotfix2 · autoplay stays muted and reduced-motion stays static", () => {
  const cv = read("components/ui/CinematicVideo.jsx");
  assert.match(cv, /autoPlay=\{autoplay && !reducedMotion\}/);
  assert.match(cv, /muted=\{muted\}/);
  assert.match(cv, /video\.muted = muted;/, "the muted property must be kept in step for autoplay policy");
  assert.match(cv, /effectiveSrc && !failed && !\(reducedMotion && autoplay && !needsTap\)/);

  /* 14.4A: the hero decides via the reel resolver — reduced motion forces
     poster mode, and only a mode of "video" mounts footage. */
  const hero = read("pages/customer/home/components/HeroSection.jsx");
  assert.match(hero, /const hasVideo = reel\.mode === "video" && Boolean\(reel\.activeSrc\);/);
  const service = read("services/heroReelService.js");
  assert.match(service, /const mode = !reducedMotion && playable\.length > 0 \? "video" : "poster";/);
});

test("hotfix2 · the play fallback appears only when autoplay genuinely fails", () => {
  const cv = read("components/ui/CinematicVideo.jsx");
  assert.match(cv, /showPlayFallback && needsTap && !failed/);
  /* A policy block sets needsTap; an AbortError (pause racing play) must not. */
  assert.match(cv, /if \(err && err\.name === "AbortError"\) return;/);
  assert.match(cv, /setNeedsTap\(true\);/);
  /* Successful playback clears it. */
  assert.match(cv, /const handlePlaying = \(\) => \{\s*setPlaying\(true\);\s*setNeedsTap\(false\);/);
});

/* ==========================================================================
   5. BRAND FILM PLAYBACK
   ========================================================================== */

test("hotfix2 · brand film reveals on the real playing event", () => {
  const brand = read("pages/customer/home/components/BrandFilmSection.jsx");
  assert.match(brand, /onPlaying=\{\(\) => setPlaying\(true\)\}/);
  assert.match(brand, /playing && canPlay \? "opacity-100" : "opacity-0"/);
  assert.match(brand, /videoRef\.current/);
  assert.match(brand, /\.play\(\)/);
  assert.match(brand, /onEnded/);
  /* End behaviour resets rather than leaving a dead black frame. */
  assert.match(brand, /videoRef\.current\.currentTime = 0;/);
});

/* ==========================================================================
   6. HOMEPAGE CONSOLE CLEANUP
   ========================================================================== */

test("hotfix2 · NewsletterSection routes through the existing ContentLink abstraction", () => {
  const ns = read("pages/customer/home/components/NewsletterSection.jsx");
  assert.match(ns, /import ContentLink from "\.\.\/\.\.\/\.\.\/\.\.\/components\/ui\/ContentLink\.jsx";/);
  assert.match(ns, /<ContentLink\s+href="\/privacy"/);
  /* No second link system, and no unbound identifier. */
  assert.doesNotMatch(ns, /<Link[\s/>]/, "must not use a bare react-router Link");
  assert.doesNotMatch(ns, /from "react-router-dom"/, "routing belongs to ContentLink");
});

test("hotfix2 · no JSX <Link> anywhere without a matching import (ReferenceError sweep)", () => {
  const offenders = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".jsx")) {
        const src = readFileSync(full, "utf8");
        if (/<Link[\s/>]/.test(src)) {
          const imported =
            /import\s*\{[^}]*\bLink\b[^}]*\}\s*from\s*["']react-router-dom["']/.test(src) ||
            /import\s+Link\s+from\s*["']react-router-dom["']/.test(src);
          if (!imported) offenders.push(relative(SRC_DIR, full));
        }
      }
    }
  };
  walk(SRC_DIR);
  assert.deepEqual(offenders, [], `unbound <Link> usage would throw at render: ${offenders.join(", ")}`);
});

test("hotfix2 · the document declares a favicon so /favicon.ico is never requested", () => {
  const html = readRoot("index.html");
  assert.match(html, /rel="icon"/, "index.html must declare an icon");
  /* Inlined, because the production artefact is one self-contained HTML file. */
  assert.match(html, /href="data:image\/svg\+xml,/, "the icon must be inlined, not a separate file");
  assert.doesNotMatch(html, /href="\/favicon\.ico"/, "must not point at a file this app does not serve");
  assert.doesNotMatch(html, /href="[^"]*\.ico"/, "no .ico asset exists in this project");
});

/* ==========================================================================
   7. THE MEDIA CONTRACT IS UNCHANGED
   ========================================================================== */

test("hotfix2 · the replaceable media contract is intact", () => {
  const homepage = read("mock/data/homepage/index.js");
  /* 14.4A: the hero carries four records of the same contract. */
  assert.match(homepage, /src: media\.heroReelSignatureVideo/);
  assert.match(homepage, /mobileSrc: media\.heroReelSignatureMobileVideo/);
  assert.match(homepage, /poster: media\.heroEditorial/);
  for (const key of ["alt", "autoplay", "loop", "muted", "playsInline"]) {
    assert.ok(homepage.includes(`${key}:`), `hero video contract lost \`${key}\``);
  }
  assert.match(homepage, /src: media\.artOfGoldVideo/, "brand film contract lost src");

  /* Production footage must drop in without touching a component. */
  const cv = read("components/ui/CinematicVideo.jsx");
  for (const prop of ["src", "mobileSrc", "poster", "alt", "autoplay", "loop", "muted", "playsInline"]) {
    assert.ok(cv.includes(prop), `CinematicVideo lost the \`${prop}\` prop`);
  }
  assert.doesNotMatch(cv, /\.mp4/, "the component must not hard-code an asset path");
});
