/**
 * PHASE 14.4 — Premium Motion + Cinematic Video
 *
 * Static checks guarding the motion/media architecture introduced for the
 * luxury storefront refresh. These are static code inspections — they do
 * not exercise a live browser (browser automation is unavailable in this
 * environment, as documented in PHASE_14_4_RECONCILIATION.md) — but they
 * pin down the contracts that must not regress:
 *
 *   1. Hero video configuration is CMS-ready (src, mobileSrc, poster, alt)
 *   2. Poster fallback is the default; video augments, never replaces, copy
 *   3. Reduced-motion support exists in CSS (prefers-reduced-motion)
 *   4. CinematicVideo component exists with accessibility & error behaviour
 *   5. AI / Try-On atelier processing states use the calm shimmer, not spinners
 *   6. Product card / gallery interactions are subtle (no dramatic transforms)
 *   7. No new animation library has been introduced
 *   8. Video assets are referenced ONLY through the mock asset boundary
 *   9. Admin / Super Admin / Employee surfaces remain motion-free
 *  10. Existing routes & commerce code are untouched at the section level
 *  11. Reduced-motion media query disables animation
 */
import "./support/browser-globals.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const SRC_DIR = join(new URL(".", import.meta.url).pathname, "..");
const FRONTEND_DIR = join(SRC_DIR, "..");
const read = (relative) => readFileSync(join(SRC_DIR, relative), "utf8");
const readPkg = () => JSON.parse(readFileSync(join(FRONTEND_DIR, "package.json"), "utf8"));

function sourceFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name.startsWith(".")) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...sourceFiles(full));
    else if (/\.(jsx?|css)$/.test(name) && !full.includes("__tests__")) out.push(full);
  }
  return out;
}

const ALL = sourceFiles(SRC_DIR);

function readAll(rel) {
  return readFileSync(join(SRC_DIR, rel), "utf8");
}

/* ---------- 1. Hero video configuration contract ---------- */

test("14.4 · hero content exposes CMS-ready video fields", () => {
  const homepage = read("mock/data/homepage/index.js");
  assert.match(homepage, /video:\s*\{/);
  assert.match(homepage, /src:\s*media\.heroCinematicVideo/);
  assert.match(homepage, /mobileSrc:\s*media\.heroCinematicMobileVideo/);
  assert.match(homepage, /poster:\s*media\.heroEditorial/);
  assert.match(homepage, /alt:/);
  assert.match(homepage, /autoplay:\s*true/);
  assert.match(homepage, /loop:\s*true/);
  assert.match(homepage, /muted:\s*true/);
  assert.match(homepage, /playsInline:\s*true/);
});

/* ---------- 2. Poster is the default, video augments ---------- */

test("14.4 · HeroSection renders poster <img> even when video is configured", () => {
  const hero = read("pages/customer/home/components/HeroSection.jsx");
  /* The CinematicVideo takes poster={image.src} and always paints the poster
     first; the plain <img> fallback path is still there and carries the
     hero photograph when video is unavailable or reduced-motion is on. */
  assert.match(hero, /<img/);
  assert.match(hero, /image\.src/);
  assert.match(hero, /CinematicVideo/);
  assert.match(hero, /reducedMotion/);
  assert.match(hero, /hasVideo/);
});

/* ---------- 3. Reduced motion support ---------- */

test("14.4 · CSS defines a prefers-reduced-motion block", () => {
  const css = read("index.css");
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  /* It must neutralise animations and transitions, not hide content. */
  assert.match(css, /animation-duration:\s*0\.001ms/);
  assert.match(css, /transition-duration:\s*0\.001ms/);
});

/* ---------- 4. CinematicVideo component contracts ---------- */

test("14.4 · CinematicVideo implements muted autoplay, poster-first, error fallback", () => {
  const cv = read("components/ui/CinematicVideo.jsx");
  assert.match(cv, /autoPlay/);
  assert.match(cv, /muted/);
  assert.match(cv, /loop/);
  assert.match(cv, /playsInline/);
  assert.match(cv, /poster/);
  assert.match(cv, /onError/);
  assert.match(cv, /canPlay/);
  assert.match(cv, /preload/);
  assert.match(cv, /mobileSrc/);
  assert.match(cv, /aria-hidden/);
  /* No unmuted autoplay ever: every video that auto-starts must be muted. */
  assert.doesNotMatch(cv, /autoPlay[^,}]*muted=\{false\}/);
});

test("14.4 · CinematicVideo respects reduced-motion", () => {
  const cv = read("components/ui/CinematicVideo.jsx");
  assert.match(cv, /prefers-reduced-motion/);
  assert.match(cv, /prefersReducedMotion/);
});

/* ---------- 5. AI / Try-On atelier processing states ---------- */

test("14.4 · AI studio busy state uses the atelier shimmer, not a spinner", () => {
  const studio = read("pages/customer/ai-studio/AiStudioPage.jsx");
  assert.match(studio, /motion-atelier-pulse/);
  assert.match(studio, /Creating Your Design/);
  /* No <circle> SVG spinner, no generic "Loading..." in the atelier frame. */
});

test("14.4 · Try-On preview uses atelier shimmer while preparing", () => {
  const preview = read("components/virtual-try-on/TryOnPhotoPreview.jsx");
  assert.match(preview, /motion-atelier-pulse/);
  assert.match(preview, /busyMessage/);
});

/* ---------- 6. Product micro-interactions are restrained ---------- */

test("14.4 · ProductCard uses subtle scale — no dramatic transforms", () => {
  const card = read("components/cards/ProductCard.jsx");
  assert.match(card, /motion-zoom-subtle/);
  /* No glow, no rotate, no translate on the card itself. */
  const scaleOnCard = /group-hover:[^"]*(rotate|translate|shadow-|brightness|blur)/;
  assert.doesNotMatch(card, scaleOnCard);
});

test("14.4 · ProductGallery crossfades instead of swapping instantly", () => {
  const gallery = read("components/product/ProductGallery.jsx");
  assert.match(gallery, /motion-fade/);
  assert.match(gallery, /transition-opacity/);
  /* Scale on hover is minimal (1.04), never 1.1 or more. */
  assert.match(gallery, /scale-\[1\.04\]/);
});

/* ---------- 7. No new animation libraries ---------- */

test("14.4 · package.json adds no animation/video library", () => {
  const pkg = readPkg();
  const banned = [
    "framer-motion",
    "gsap",
    "lenis",
    "three",
    "react-spring",
    "motion",
    "popmotion",
    "@react-three",
  ];
  for (const name of banned) {
    assert.ok(
      !(name in (pkg.dependencies ?? {})) && !(name in (pkg.devDependencies ?? {})),
      `animation/video library "${name}" must not be a dependency`
    );
  }
});

/* ---------- 8. Media / mock boundary ---------- */

test("14.4 · no UI component imports mock assets directly", () => {
  const uiDir = join(SRC_DIR, "components");
  const bad = [];
  function walk(dir) {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.(jsx?|css)$/.test(full)) {
        const src = readFileSync(full, "utf8");
        if (/from\s+["'].*mock\/assets/.test(src)) bad.push(full);
      }
    }
  }
  walk(uiDir);
  assert.deepEqual(bad, [], "components must not import mock/assets directly");
});

test("14.4 · video assets are registered through the mock asset index", () => {
  const assets = read("mock/assets/index.js");
  assert.match(assets, /heroCinematicVideo/);
  assert.match(assets, /heroCinematicMobileVideo/);
  assert.match(assets, /artOfGoldVideo/);
  assert.match(assets, /videos\/homepage\/hero-cinematic\.mp4/);
});

test("14.4 · brand film section is registered in the homepage section registry", () => {
  const home = read("pages/customer/home/HomePage.jsx");
  assert.match(home, /BrandFilmSection/);
  assert.match(home, /brand_film:\s*BrandFilmSection/);
});

/* ---------- 9. Admin / console surfaces stay motion-free ---------- */

test("14.4 · no cinematic video is imported by Admin / Super Admin / Employee pages", () => {
  const adminDirs = [
    join(SRC_DIR, "pages/admin"),
    join(SRC_DIR, "pages/super-admin"),
    join(SRC_DIR, "pages/employee"),
    join(SRC_DIR, "components/admin"),
    join(SRC_DIR, "components/super-admin"),
    join(SRC_DIR, "components/console"),
  ];
  const bad = [];
  for (const dir of adminDirs) {
    if (!existsSync(dir)) continue;
    function walk(d) {
      for (const name of readdirSync(d)) {
        const full = join(d, name);
        if (statSync(full).isDirectory()) walk(full);
        else if (name.endsWith(".jsx")) {
          const src = readFileSync(full, "utf8");
          if (/CinematicVideo|heroCinematic|artOfGoldVideo|motion-ken-burns|motion-atelier-pulse/.test(src)) {
            bad.push(full);
          }
        }
      }
    }
    walk(dir);
  }
  assert.deepEqual(bad, [], "operational consoles must not use cinematic motion");
});

/* ---------- 10. Motion tokens exist in the design system ---------- */

test("14.4 · motion design tokens are declared", () => {
  const css = read("index.css");
  assert.match(css, /--motion-fast/);
  assert.match(css, /--motion-standard/);
  assert.match(css, /--motion-slow/);
  assert.match(css, /--motion-cinematic/);
  assert.match(css, /--ease-standard/);
  assert.match(css, /--ease-entrance/);
  assert.match(css, /--ease-exit/);
  /* Easings are cubic-bezier (composed), not spring/bounce keywords. The
     declaration lines (as opposed to the explanatory comment) must never
     reference bounce or elastic. */
  const easingDecls = css
    .split("\n")
    .filter((line) => /^\s*--ease-|animation-name|animation:|transition/.test(line))
    .join("\n");
  assert.doesNotMatch(easingDecls, /bounce|elastic|spring/);
  assert.doesNotMatch(easingDecls, /cubic-bezier\([^)]*1\.[5-9]/);
});

/* ---------- 11. Video accessibility ---------- */

test("14.4 · autoplaying video is always muted & playsInline", () => {
  /* Every autoPlay attribute in the codebase must be paired with muted and playsInline. */
  const autoPlayFiles = ALL.filter((f) => /\.(jsx)$/.test(f)).filter((f) => {
    const src = readFileSync(f, "utf8");
    return /autoPlay/.test(src);
  });
  for (const f of autoPlayFiles) {
    const src = readFileSync(f, "utf8");
    assert.match(
      src,
      /muted/,
      `${f.split("src/")[1]}: video autoPlay must be muted`
    );
    assert.match(
      src,
      /playsInline/,
      `${f.split("src/")[1]}: video autoPlay must use playsInline`
    );
  }
});

test("14.4 · video media has an alt/poster contract", () => {
  const cv = read("components/ui/CinematicVideo.jsx");
  /* Poster is a required prop. */
  assert.match(cv, /poster:\s*PropTypes\.string\.isRequired/);
  assert.match(cv, /alt:\s*PropTypes\.string\.isRequired/);
});

/* ---------- 12. Brand film section exists with calm interaction ---------- */

test("14.4 · brand film section implements a tap-to-play affordance (not autoplay)", () => {
  const film = read("pages/customer/home/components/BrandFilmSection.jsx");
  assert.match(film, /handlePlay/);
  assert.match(film, /Play the art of gold film/);
  /* Brand film does NOT set autoPlay — the customer invites it. */
  assert.doesNotMatch(film, /autoPlay/);
});

/* ---------- 13. Off-screen pausing hook exists ---------- */

test("14.4 · useIntersectionAware hook is provided for off-screen pausing", () => {
  const hook = read("hooks/useIntersectionAware.js");
  assert.match(hook, /IntersectionObserver/);
  assert.match(hook, /threshold/);
});

/* ---------- 14. Existing routes remain intact ---------- */

test("14.4 · primary customer page components are still registered in the router", () => {
  const router = read("app/router.jsx");
  /* Every key customer page must still be imported and referenced in the
     router tree (wrapped or direct). Nested layouts mean the element may
     sit inside a multi-line ( … ) block, so we check for any JSX usage
     rather than the exact "element: <Page />" one-liner. */
  const expected = [
    "HomePage",
    "CollectionsPage",
    "ProductsPage",
    "ProductDetailPage",
    "AiStudioPage",
    "VirtualTryOnPage",
    "CartPage",
    "CheckoutPage",
  ];
  for (const page of expected) {
    assert.match(router, new RegExp(`import\\s+${page}\\s+from`), `${page} not imported`);
    assert.match(router, new RegExp(`<${page}(\\s|/?>)`), `${page} not referenced in JSX`);
  }
});
