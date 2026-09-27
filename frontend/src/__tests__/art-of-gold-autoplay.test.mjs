/**
 * THE ART OF GOLD — scroll playback contract.
 *
 * The film prepares on approach, plays muted once half of the frame is on
 * screen, pauses (never rewinds) when scrolled away, and resumes from the
 * same position. Node has no layout engine, so — like the other section
 * suites — this pins the server markup and the source contract. The runtime
 * behaviour itself (intersection ratios, currentTime across away/back,
 * refusal handling, completion) is verified in real Chromium.
 */
import "./support/browser-globals.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import BrandFilmSection from "../pages/customer/home/components/BrandFilmSection.jsx";
import { homepage } from "../mock/data/homepage/index.js";

const src = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, src), "utf8");
const file = () => read("pages/customer/home/components/BrandFilmSection.jsx");
const record = homepage.sections.find((s) => s.type === "brand_film");
const content = { ...record.content, poster: "/test-craft-poster.jpg", video: { src: "/test-craft.mp4", alt: "Craft film" } };
const render = (value) => renderToStaticMarkup(h(BrandFilmSection, { content: value }));

/* The scroll-playback effect body, isolated so assertions cannot be satisfied
   by the manual play handler elsewhere in the file. */
const playEffect = () => {
  const f = file();
  const start = f.indexOf("useEffect(() => {\n    const v = videoRef.current;");
  const end = f.indexOf("}, [inPlayZone, reducedMotion, hasVideo]);");
  assert.ok(start > 0 && end > start, "scroll-playback effect keyed on the play zone exists");
  return f.slice(start, end);
};
/* The play-zone observer effect body. */
const playZoneObserver = () => {
  const f = file();
  const start = f.indexOf("const node = frameRef.current;");
  const end = f.indexOf("return () => observer.disconnect();", start);
  assert.ok(start > 0 && end > start, "play-zone observer effect exists and disconnects on cleanup");
  return f.slice(start, end);
};

test("Art of Gold · not visible → nothing downloads or plays at first render", () => {
  const html = render(content);
  const video = html.match(/<video[^>]*>/)?.[0] ?? "";
  assert.match(video, /preload="none"/, "no MP4 bytes until the section is approached");
  assert.doesNotMatch(video, /autoplay/i, "no attribute autoplay — playback is driven by visibility");
  assert.match(video, /playsInline=""/, "inline on mobile, never fullscreen");
  assert.doesNotMatch(video, /\bloop\b/);
  assert.match(html, /opacity-100/, "poster is what an unseen section shows");
});

test("Art of Gold · load is separated from play: prepare 600px ahead, play at half-visible", () => {
  const f = file();
  assert.match(f, /useIntersectionAware\(\{ threshold: 0, rootMargin: "600px 0px" \}\)/, "prepare zone");
  assert.match(f, /preload=\{inView \? "metadata" : "none"\}/, "approach upgrades preload to metadata only");
  assert.doesNotMatch(f, /preload=\{?["']auto/, "never downloads the whole film ahead of time");
  assert.match(f, /const PLAY_VISIBLE_RATIO = 0\.5;/, "documented play threshold");
  assert.match(f, /ref=\{frameRef\}\s*className="relative aspect-\[16\/9\]/, "play zone observes the video frame itself");
});

test("Art of Gold · visible → autoplays: ratio-checked, muted before play(), no gesture", () => {
  const obs = playZoneObserver();
  assert.match(obs, /new IntersectionObserver\(/);
  assert.match(obs, /\{ threshold: PLAY_VISIBLE_RATIO \}/);
  assert.match(
    obs,
    /entry\.isIntersecting && entry\.intersectionRatio >= PLAY_VISIBLE_RATIO/,
    "isIntersecting alone is true for a 1px sliver — the ratio must gate playback"
  );
  assert.match(obs, /typeof IntersectionObserver === "undefined"\) return/, "no observer → no autoplay, poster stays");
  const eff = playEffect();
  assert.ok(eff.indexOf("v.muted = true;") > -1 && eff.indexOf("v.muted = true;") < eff.indexOf("v.play()"), "muted is set before play()");
  assert.doesNotMatch(eff, /onClick|handlePlay/, "autoplay path does not depend on the play button");
});

test("Art of Gold · leaving pauses without rewinding; returning resumes from currentTime", () => {
  const eff = playEffect();
  assert.match(eff, /if \(!inPlayZone\) \{\s*if \(!v\.paused\) v\.pause\(\);\s*return;/, "pause on leave");
  assert.doesNotMatch(eff, /currentTime/, "scrolling never writes currentTime — resume continues in place");
  assert.doesNotMatch(eff, /\.load\(\)|removeAttribute|src\s*=/, "no reload or teardown on leave");
  assert.match(file(), /\{hasVideo && !reducedMotion && \(\s*<video/, "the element is not unmounted by visibility");
});

test("Art of Gold · refused play() is caught; poster + manual button remain", () => {
  const eff = playEffect();
  assert.match(eff, /playPromise\.catch\(\(err\) => \{/);
  assert.match(eff, /if \(err\?\.name === "AbortError"\) return;/, "pause interrupting a pending play is not a failure");
  assert.match(eff, /setPlaying\(false\);/, "refusal leaves the poster state");
  assert.doesNotMatch(eff, /setFailed/, "a refusal (or buffering) never marks the media as failed");
  assert.match(render(content), /aria-label="Play the art of gold film"/, "manual fallback still rendered");
});

test("Art of Gold · reduced motion: no film element, no autoplay, poster only", () => {
  assert.match(playEffect(), /if \(!v \|\| reducedMotion \|\| !hasVideo\) return;/);
  const prev = globalThis.window.matchMedia;
  globalThis.window.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} });
  try {
    const html = render(content);
    assert.doesNotMatch(html, /<video/);
    assert.doesNotMatch(html, /<button/);
    assert.match(html, /<img[^>]+opacity-100/);
  } finally {
    globalThis.window.matchMedia = prev;
  }
});

test("Art of Gold · completion unchanged: no loop, natural end returns to poster at 0", () => {
  const f = file();
  assert.match(f, /onEnded=\{handleEnded\}/);
  assert.match(f, /const handleEnded = \(\) => \{\s*setPlaying\(false\);[\s\S]*?videoRef\.current\.currentTime = 0;/);
  assert.doesNotMatch(f, /\bloop\b(?!\.)/i, "no loop attribute or prop");
});

test("Art of Gold · native events only — no scroll listeners, timers or frame loops", () => {
  const f = file();
  assert.doesNotMatch(f, /addEventListener\(\s*["']scroll/);
  assert.doesNotMatch(f, /setInterval|setTimeout|requestAnimationFrame/);
  assert.equal((f.match(/<video/g) || []).length, 1, "one film element — no second implementation");
  assert.doesNotMatch(f, /CinematicVideo/, "Art of Gold keeps its own element; the Hero component is not involved");
});

test("Hero regression · CinematicVideo / HeroSection contracts untouched by this change", () => {
  const cv = read("components/ui/CinematicVideo.jsx");
  assert.match(cv, /duration-200/, "hero dissolve fix intact");
  assert.match(cv, /autoPlay=\{autoplay && !reducedMotion\}/, "hero still autoplays, reduced motion still respected");
  assert.match(cv, /useIntersectionAware\(\{ threshold: 0\.1, rootMargin: "100px 0px" \}\)/, "hero observer values unchanged");
  assert.doesNotMatch(cv, /PLAY_VISIBLE_RATIO|intersectionRatio/, "scroll-playback logic stays Art-of-Gold-specific");
  const hero = read("pages/customer/home/components/HeroSection.jsx");
  assert.match(hero, /preload=\{outgoing \? "none" : "auto"\}/, "hero loads immediately, not lazily");
  assert.doesNotMatch(hero, /PLAY_VISIBLE_RATIO|art-of-gold/i);
  const hook = read("hooks/useIntersectionAware.js");
  assert.match(hook, /threshold: 0\.1/, "shared hook defaults unchanged");
});
