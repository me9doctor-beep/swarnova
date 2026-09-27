/**
 * PHASE 14.4B — MULTI-ANGLE JEWELLERY PRODUCT HOVER
 * -----------------------------------------------------------------------------
 * Focused checks for the product card's multi-angle hover:
 *
 *   · media contract — primary always, hoverFrames optional, backend-ready
 *   · the representative set arrives through the provider chain
 *   · products without / with empty / with broken frames stay static stills
 *   · hover sequence: primary → left → right → detail, hold, return on leave
 *   · rapid enter / leave never sticks on an alternate frame
 *   · multiple cards are independent
 *   · desktop-only gating: touch, hover-less and reduced-motion stay static
 *   · rendered markup: primary first, angle layer lazy + decorative
 *   · navigation + wishlist intact; product-detail gallery receives the angles
 *   · no product-card video, no new animation dependency, no mock leakage
 *
 * The sequence controller is DOM-agnostic, so timing is exercised with an
 * injected fake clock rather than a browser.
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
import { catalogService } from "../services/catalogService.js";
import {
  normalizeMediaFrame,
  productGalleryImages,
  resolveProductMedia,
  withProductMedia,
} from "../services/productMediaService.js";
import {
  HOVER_CAPABLE_QUERY,
  HOVER_SEQUENCE_DEFAULTS,
  REDUCED_MOTION_QUERY,
  canPlayHoverSequence,
  createHoverSequence,
} from "../features/product-media/hoverSequence.js";
import ProductCard from "../components/cards/ProductCard.jsx";
import ProductMediaHover from "../components/product/ProductMediaHover.jsx";
import AppProviders from "../app/providers.jsx";

const SRC_DIR = join(new URL(".", import.meta.url).pathname, "..");
const read = (rel) => readFileSync(join(SRC_DIR, rel), "utf8");

const MULTI_ANGLE = {
  "JWL-001": ["angle-left", "angle-right", "detail"],
  "JWL-002": ["angle-left", "angle-right"],
  "JWL-003": ["angle-left", "angle-right"],
};

/* -------------------------------------------------------------------------- */
/* Fake clock for the sequence controller                                     */
/* -------------------------------------------------------------------------- */

function fakeClock() {
  let now = 0;
  let seq = 0;
  const pending = new Map();
  return {
    timers: {
      setTimeout(fn, ms) {
        seq += 1;
        pending.set(seq, { at: now + ms, fn });
        return seq;
      },
      clearTimeout(id) {
        pending.delete(id);
      },
    },
    advance(ms) {
      const until = now + ms;
      for (;;) {
        let nextId = null;
        for (const [id, t] of pending) {
          if (t.at <= until && (nextId === null || t.at < pending.get(nextId).at)) nextId = id;
        }
        if (nextId === null) break;
        const { at, fn } = pending.get(nextId);
        pending.delete(nextId);
        now = at;
        fn();
      }
      now = until;
    },
    get pendingCount() {
      return pending.size;
    },
  };
}

function makeSequence(frameCount, { loadAll = true } = {}) {
  const clock = fakeClock();
  const renders = [];
  const seq = createHoverSequence({
    getFrameCount: () => frameCount,
    render: (state) => renders.push(state),
    timers: clock.timers,
  });
  if (loadAll) for (let i = 0; i < frameCount; i += 1) seq.frameLoaded(i);
  return { seq, clock, renders };
}

const { leadMs, stepMs, settleMs } = HOVER_SEQUENCE_DEFAULTS;

/* -------------------------------------------------------------------------- */
/* Rendering helpers                                                          */
/* -------------------------------------------------------------------------- */

const renderCard = (product) =>
  renderToStaticMarkup(
    h(MemoryRouter, null, h(AppProviders, null, h(ProductCard, { product })))
  );

/* The test harness resolves every asset import to "" (see
   support/asset-loader.mjs), which the media contract rightly treats as "no
   image". This fixture provider wraps the REAL mock provider and only stamps
   unique URLs onto the real records' image slots, so the full
   service → provider → mock data chain is exercised with meaningful srcs. */
const stamp = (product) =>
  product && {
    ...product,
    images: product.images.map((image, i) => ({ ...image, src: `/fixture/${product.id}/image-${i}.jpg` })),
    ...(product.media && {
      media: {
        ...product.media,
        hoverFrames: (product.media.hoverFrames ?? []).map((frame, i) => ({
          ...frame,
          src: `/fixture/${product.id}/frame-${i}.avif`,
        })),
      },
    }),
  };

const fixtureProvider = {
  async getProducts(query) {
    return (await mockProvider.getProducts(query)).map(stamp);
  },
  async getProduct(id) {
    return stamp(await mockProvider.getProduct(id));
  },
};

async function catalogue(query = {}) {
  return catalogService.getProducts(fixtureProvider, query);
}

/* ==========================================================================
   1. MEDIA CONTRACT
   ========================================================================== */

test("14.4B · resolveProductMedia — primary is always images[0]; hoverFrames optional", () => {
  const primary = { src: "/p.avif", alt: "Front" };
  assert.deepEqual(resolveProductMedia({ images: [primary] }), { primary, hoverFrames: [] });
  assert.deepEqual(resolveProductMedia({ images: [primary], media: { hoverFrames: null } }).hoverFrames, []);
  assert.deepEqual(resolveProductMedia({ images: [primary], media: { hoverFrames: [] } }).hoverFrames, []);
  assert.deepEqual(resolveProductMedia({ images: [primary], media: {} }).hoverFrames, []);
  assert.deepEqual(resolveProductMedia(null), { primary: null, hoverFrames: [] });
  assert.deepEqual(resolveProductMedia({}), { primary: null, hoverFrames: [] });
});

test("14.4B · resolveProductMedia — drops invalid frames and any repeat of the primary", () => {
  const media = resolveProductMedia({
    images: [{ src: "/p.avif", alt: "Front" }],
    media: {
      hoverFrames: [
        { src: "/l.avif", alt: "Left" },
        null,
        { alt: "no source" },
        { src: "  " },
        "/r.avif",
        { src: "/p.avif", alt: "primary again" },
        { src: "/l.avif", alt: "duplicate" },
      ],
    },
  });
  assert.deepEqual(media.hoverFrames, [
    { src: "/l.avif", alt: "Left" },
    { src: "/r.avif", alt: "" },
  ]);
});

test("14.4B · backend-ready: a provider may return the resolved media object directly", () => {
  const fromApi = {
    id: "API-1",
    images: [{ src: "/legacy.avif", alt: "Legacy" }],
    media: { primary: { src: "https://cdn/p.avif", alt: "Front" }, hoverFrames: ["https://cdn/l.avif"] },
  };
  const resolved = withProductMedia(fromApi);
  assert.equal(resolved.media.primary.src, "https://cdn/p.avif");
  assert.deepEqual(resolved.media.hoverFrames, [{ src: "https://cdn/l.avif", alt: "" }]);
  /* idempotent — resolving twice changes nothing */
  assert.deepEqual(withProductMedia(resolved).media, resolved.media);
  assert.equal(normalizeMediaFrame(undefined), null);
});

/* ==========================================================================
   2. REPRESENTATIVE SET THROUGH THE PROVIDER CHAIN
   ========================================================================== */

test("14.4B · mock records declare hoverFrames only for the representative set", async () => {
  const raw = await mockProvider.getProducts({});
  for (const product of raw) {
    const expected = MULTI_ANGLE[product.id];
    assert.equal(product.media?.hoverFrames?.length ?? 0, expected?.length ?? 0, product.id);
    assert.equal(product.media?.primary, undefined, "primary is never duplicated into media");
  }
  const assets = read("mock/assets/index.js");
  const data = read("mock/data/products/index.js");
  for (const key of [
    "productPendantAngleLeft", "productPendantAngleRight", "productPendantDetail",
    "productSolitaireRingAngleLeft", "productSolitaireRingAngleRight",
    "productDropEarringsAngleLeft", "productDropEarringsAngleRight",
  ]) {
    assert.match(assets, new RegExp(`${key}:`), `${key} registered`);
    assert.match(data, new RegExp(`media\\.${key}\\b`), `${key} referenced by product data`);
  }
});

test("14.4B · catalogue products arrive with the resolved media contract", async () => {
  const list = await catalogue();
  assert.ok(list.length > 0);
  for (const product of list) {
    assert.ok(product.media, `${product.id} has media`);
    assert.deepEqual(product.media.primary, { src: product.images[0].src, alt: product.images[0].alt });
    assert.ok(Array.isArray(product.media.hoverFrames));
  }
});

test("14.4B · the representative set carries its multi-angle frames; others stay single-still", async () => {
  const list = await catalogue();
  for (const product of list) {
    const expected = MULTI_ANGLE[product.id];
    if (expected) {
      assert.equal(product.media.hoverFrames.length, expected.length, `${product.id} frame count`);
      product.media.hoverFrames.forEach((frame) => assert.ok(frame.alt.length > 0, "frames carry alt text"));
    } else {
      assert.deepEqual(product.media.hoverFrames, [], `${product.id} has no hover frames`);
    }
  }
  /* The set covers the homepage bestsellers that received imagery. */
  const bestsellers = await catalogue({ bestseller: true });
  assert.ok(bestsellers.filter((p) => p.media.hoverFrames.length > 0).length >= 3);
});

test("14.4B · single product lookup resolves media too", async () => {
  const product = await catalogService.getProduct(fixtureProvider, "JWL-001");
  assert.equal(product.media.hoverFrames.length, 3);
  assert.equal(await catalogService.getProduct(fixtureProvider, "NOPE"), null);
  /* Through the real provider too: the contract shape is always present. */
  const real = await catalogService.getProduct(mockProvider, "JWL-001");
  assert.ok(Array.isArray(real.media.hoverFrames));
});

test("14.4B · assets live in the mock boundary as optimised AVIF, named by angle", () => {
  for (const [id, frames] of Object.entries(MULTI_ANGLE)) {
    for (const name of frames) {
      const rel = `mock/assets/images/products/${id}/${name}.avif`;
      assert.ok(existsSync(join(SRC_DIR, rel)), `${rel} missing`);
      const size = statSync(join(SRC_DIR, rel)).size;
      assert.ok(size > 5_000 && size < 150_000, `${rel} is ${size} bytes — expected a card-sized AVIF`);
    }
  }
  const assets = read("mock/assets/index.js");
  assert.match(assets, /images\/products\/JWL-001\/angle-left\.avif/);
  /* The primary still is reused, never duplicated into the products folder. */
  for (const id of Object.keys(MULTI_ANGLE)) {
    assert.ok(!existsSync(join(SRC_DIR, `mock/assets/images/products/${id}/primary.avif`)));
  }
});

/* ==========================================================================
   3. HOVER SEQUENCE
   ========================================================================== */

test("14.4B · hover: primary → left → right → detail, then holds (no loop)", () => {
  const { seq, clock } = makeSequence(3);
  assert.deepEqual(seq.state, { engaged: false, active: -1 }, "starts on the primary");
  seq.enter();
  assert.deepEqual(seq.state, { engaged: true, active: -1 }, "primary still showing at first");
  clock.advance(leadMs);
  assert.equal(seq.state.active, 0, "slight left");
  clock.advance(stepMs);
  assert.equal(seq.state.active, 1, "slight right");
  clock.advance(stepMs);
  assert.equal(seq.state.active, 2, "detail");
  clock.advance(stepMs * 10);
  assert.equal(seq.state.active, 2, "settles on detail — never loops back");
  assert.equal(clock.pendingCount, 0, "no timers left running while holding");
});

test("14.4B · pacing is slow and intentional, never a fast slideshow", () => {
  assert.ok(stepMs >= 1000, "each angle is held, not flashed");
  const css = read("index.css");
  const frame = css.match(/\.product-media-frame\s*\{[^}]*transition:\s*opacity\s+(\d+)ms/);
  const layer = css.match(/\.product-media-layers\s*\{[^}]*transition:\s*opacity\s+(\d+)ms/);
  for (const match of [frame, layer]) {
    assert.ok(match, "opacity dissolve declared");
    const ms = Number(match[1]);
    assert.ok(ms >= 400 && ms <= 700, `dissolve ${ms}ms within 400–700ms`);
  }
  assert.ok(settleMs >= Number(layer[1]), "reset waits until the leave dissolve is complete");
});

test("14.4B · leave returns to the primary: layer dissolves at once, frame resets after", () => {
  const { seq, clock } = makeSequence(3);
  seq.enter();
  clock.advance(leadMs + stepMs * 2);
  assert.equal(seq.state.active, 2);
  seq.leave();
  assert.deepEqual(seq.state, { engaged: false, active: 2 }, "whole layer fades as one (detail → primary)");
  clock.advance(settleMs);
  assert.deepEqual(seq.state, { engaged: false, active: -1 }, "back on the primary");
  clock.advance(stepMs * 5);
  assert.equal(seq.state.active, -1, "no step fires after leaving");
});

test("14.4B · rapid enter/leave never sticks on an alternate frame", () => {
  const { seq, clock } = makeSequence(3);
  for (let i = 0; i < 25; i += 1) {
    seq.enter();
    clock.advance(i % 3 === 0 ? leadMs + 5 : 40);
    seq.leave();
    clock.advance(i % 2 === 0 ? 60 : 10);
  }
  clock.advance(settleMs);
  assert.deepEqual(seq.state, { engaged: false, active: -1 });
  assert.equal(clock.pendingCount, 0, "every timer cleared");
});

test("14.4B · re-entering during the leave dissolve resumes calmly from the same frame", () => {
  const { seq, clock } = makeSequence(3);
  seq.enter();
  clock.advance(leadMs);
  assert.equal(seq.state.active, 0);
  seq.leave();
  clock.advance(200);
  seq.enter();
  assert.deepEqual(seq.state, { engaged: true, active: 0 }, "fades back in on the frame it left");
  clock.advance(settleMs);
  assert.equal(seq.state.active, 0, "the cancelled reset never fires");
  clock.advance(stepMs);
  assert.equal(seq.state.active, 1);
});

test("14.4B · a frame only fades in once loaded; the sequence waits for it", () => {
  const { seq, clock } = makeSequence(3, { loadAll: false });
  seq.enter();
  clock.advance(leadMs + stepMs * 3);
  assert.equal(seq.state.active, -1, "nothing loaded — primary stays");
  seq.frameLoaded(0);
  assert.equal(seq.state.active, 0, "advances the moment the frame arrives");
  seq.frameLoaded(1);
  seq.frameLoaded(2);
  clock.advance(stepMs);
  assert.equal(seq.state.active, 1);
});

test("14.4B · fallback: broken frames are skipped; all broken → primary only", () => {
  const partial = makeSequence(3, { loadAll: false });
  partial.seq.frameFailed(0);
  partial.seq.frameLoaded(1);
  partial.seq.frameLoaded(2);
  partial.seq.enter();
  partial.clock.advance(leadMs);
  assert.equal(partial.seq.state.active, 1, "skips the broken left angle");
  assert.equal(partial.seq.isFrameUsable(0), false);

  const broken = makeSequence(2, { loadAll: false });
  broken.seq.enter();
  broken.clock.advance(leadMs);
  broken.seq.frameFailed(0);
  broken.seq.frameFailed(1);
  broken.clock.advance(stepMs * 4);
  assert.equal(broken.seq.state.active, -1, "stays on the primary — no blank frame");
});

test("14.4B · missing or empty hoverFrames: entering does nothing", () => {
  const { seq, clock, renders } = makeSequence(0);
  seq.enter();
  clock.advance(5000);
  assert.deepEqual(seq.state, { engaged: false, active: -1 });
  assert.equal(renders.length, 0);
  assert.equal(clock.pendingCount, 0);
});

test("14.4B · multiple cards are independent — only the hovered one responds", () => {
  const a = makeSequence(3);
  const b = makeSequence(2);
  a.seq.enter();
  a.clock.advance(leadMs + stepMs);
  assert.equal(a.seq.state.active, 1);
  assert.deepEqual(b.seq.state, { engaged: false, active: -1 }, "neighbour untouched");
  a.seq.leave();
  b.seq.enter();
  a.clock.advance(settleMs);
  b.clock.advance(leadMs);
  assert.deepEqual(a.seq.state, { engaged: false, active: -1 }, "previous card returned to primary");
  assert.deepEqual(b.seq.state, { engaged: true, active: 0 });
});

test("14.4B · dispose stops everything (unmount safety)", () => {
  const { seq, clock } = makeSequence(3);
  seq.enter();
  seq.dispose();
  clock.advance(leadMs + stepMs * 3);
  assert.equal(seq.state.active, -1);
  assert.equal(clock.pendingCount, 0);
});

/* ==========================================================================
   4. DEVICE + ACCESSIBILITY GATING
   ========================================================================== */

function fakeWindow({ hover = true, reduced = false } = {}) {
  return {
    matchMedia: (query) => ({
      matches: query === HOVER_CAPABLE_QUERY ? hover : query === REDUCED_MOTION_QUERY ? reduced : false,
    }),
  };
}

test("14.4B · desktop mouse plays; mobile/touch-tablet and touch pointers stay static", () => {
  assert.equal(canPlayHoverSequence(fakeWindow(), "mouse"), true, "desktop");
  assert.equal(canPlayHoverSequence(fakeWindow({ hover: false }), "mouse"), false, "(hover: none) device");
  assert.equal(canPlayHoverSequence(fakeWindow(), "touch"), false, "touch on a hybrid laptop");
  assert.equal(canPlayHoverSequence(fakeWindow(), "pen"), false, "stylus");
  assert.equal(canPlayHoverSequence({}, "mouse"), false, "no matchMedia (SSR) → static");
  assert.equal(canPlayHoverSequence(undefined, "mouse"), false);
});

test("14.4B · reduced motion keeps the primary static", () => {
  assert.equal(canPlayHoverSequence(fakeWindow({ reduced: true }), "mouse"), false);
  const css = read("index.css");
  assert.match(
    css,
    /@media \(hover: none\), \(pointer: coarse\), \(prefers-reduced-motion: reduce\) \{\s*\.product-media-layers \{\s*display: none;/,
    "CSS belt-and-braces: the angle layer never shows for reduced motion or touch"
  );
});

/* ==========================================================================
   5. RENDERED MARKUP
   ========================================================================== */

test("14.4B · ProductCard with hover frames: primary first, no angles fetched on load", async () => {
  const product = (await catalogue()).find((p) => p.id === "JWL-001");
  const html = renderCard(product);
  assert.match(html, /data-product-media-hover/);
  const imgs = html.match(/<img\b[^>]*>/g) ?? [];
  assert.equal(imgs.length, 1, "only the primary <img> is in the DOM until a desktop hover arms the card");
  assert.match(imgs[0], new RegExp(`alt="${product.images[0].alt}"`));
  assert.match(imgs[0], /loading="lazy"/);
  assert.doesNotMatch(html, /product-media-frame/);
});

test("14.4B · ProductCard without frames renders the original single still", async () => {
  const product = (await catalogue()).find((p) => p.media.hoverFrames.length === 0);
  const html = renderCard(product);
  assert.doesNotMatch(html, /data-product-media-hover/);
  const imgs = html.match(/<img\b[^>]*>/g) ?? [];
  assert.equal(imgs.length, 1);
  assert.match(imgs[0], /motion-zoom-subtle h-full w-full object-cover|h-full w-full object-cover motion-zoom-subtle/);
});

test("14.4B · ProductCard tolerates raw records (images only, empty or null hoverFrames)", () => {
  const base = { id: "RAW-1", name: "Raw Piece", price: 1000, purity: "22K", href: "/product/RAW-1", images: [{ src: "/raw.avif", alt: "Raw" }] };
  for (const product of [base, { ...base, media: { hoverFrames: [] } }, { ...base, media: { primary: null, hoverFrames: null } }]) {
    const html = renderCard(product);
    assert.match(html, /src="\/raw\.avif"/);
    assert.doesNotMatch(html, /data-product-media-hover/);
  }
});

test("14.4B · armed layer is decorative: empty alts, aria-hidden, one announced image", () => {
  const html = renderToStaticMarkup(
    h(ProductMediaHover, {
      primary: { src: "/p.avif", alt: "Front of the pendant" },
      frames: [
        { src: "/l.avif", alt: "Left" },
        { src: "/r.avif", alt: "Right" },
      ],
      name: "Pendant",
      hover: { armed: true, layersRef: () => {}, onFrameLoad() {}, onFrameError() {} },
    })
  );
  const imgs = html.match(/<img\b[^>]*>/g);
  assert.equal(imgs.length, 3);
  assert.match(imgs[0], /alt="Front of the pendant"/, "primary first, the only named image");
  assert.match(html, /class="product-media-layers" aria-hidden="true"/);
  imgs.slice(1).forEach((img) => assert.match(img, /alt=""/));
  assert.equal((html.match(/alt="[^"]+"/g) ?? []).length, 1, "no duplicate announcements");
});

test("14.4B · product navigation and wishlist remain intact", async () => {
  const product = (await catalogue()).find((p) => p.id === "JWL-002");
  const html = renderCard(product);
  assert.match(html, /href="\/product\/JWL-002"[^>]*aria-label="View Eternal Halo Ring"|aria-label="View Eternal Halo Ring"[^>]*href="\/product\/JWL-002"/);
  assert.match(html, /aria-label="Add Eternal Halo Ring to wishlist"/);
  assert.match(html, /aria-pressed="false"/);
  /* The media frame (not the link) is the hover area, so moving onto the
     wishlist control is not a "leave"; the actions stay siblings of the link. */
  const card = read("components/cards/ProductCard.jsx");
  assert.match(card, /mediaHover\.hasFrames \? mediaHover\.bind : null/);
  assert.match(card, /<ProductActions product=\{product\}/);
});

test("14.4B · product detail gallery receives the angles as ordinary plates", async () => {
  const product = await catalogService.getProduct(fixtureProvider, "JWL-001");
  const plates = productGalleryImages(product);
  assert.equal(plates.length, 4);
  assert.equal(plates[0].src, product.images[0].src, "canonical still stays first");
  const single = await catalogService.getProduct(fixtureProvider, "JWL-005");
  assert.equal(productGalleryImages(single).length, single.images.length, "single-still pieces unchanged");
  assert.match(read("pages/customer/product/ProductDetailPage.jsx"), /productGalleryImages\(product\)/);
  assert.doesNotMatch(read("components/cards/ProductCard.jsx"), /ProductGallery/, "no gallery logic in the card");
});

/* ==========================================================================
   6. GUARDRAILS
   ========================================================================== */

test("14.4B · no product-card video, GIF or canvas; no new animation dependency", () => {
  for (const file of ["components/cards/ProductCard.jsx", "components/product/ProductMediaHover.jsx", "hooks/useProductMediaHover.js", "features/product-media/hoverSequence.js"]) {
    const src = read(file);
    assert.doesNotMatch(src, /<video|<canvas|\.mp4|\.webm|\.gif\b|CinematicVideo/i, `${file} uses no video`);
  }
  const pkg = JSON.parse(readFileSync(join(SRC_DIR, "../package.json"), "utf8"));
  const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
  for (const banned of ["framer-motion", "motion", "gsap", "react-spring", "@react-spring/web", "typescript"]) {
    assert.ok(!deps.includes(banned), `${banned} must not be added`);
  }
});

test("14.4B · no TypeScript files introduced", () => {
  const found = [];
  const walk = (p) => {
    if (statSync(p).isDirectory()) readdirSync(p).forEach((name) => walk(join(p, name)));
    else if (/\.tsx?$/.test(p)) found.push(p);
  };
  walk(SRC_DIR);
  assert.deepEqual(found, []);
});

test("14.4B · UI, hooks, features and media services never import mock data or assets", () => {
  const roots = ["components", "pages", "hooks", "layouts", "features"].map((d) => join(SRC_DIR, d));
  roots.push(join(SRC_DIR, "services/productMediaService.js"), join(SRC_DIR, "services/catalogService.js"));
  const bad = [];
  const walk = (p) => {
    if (!existsSync(p)) return;
    if (statSync(p).isDirectory()) {
      for (const name of readdirSync(p)) walk(join(p, name));
    } else if (/\.(jsx?|mjs)$/.test(p)) {
      const src = readFileSync(p, "utf8");
      if (/from\s+["'][^"']*mock\//.test(src) || /images\/products\//.test(src)) bad.push(p);
    }
  };
  roots.forEach(walk);
  assert.deepEqual(bad, [], "product media must flow through the provider");
  /* The card holds no product-specific paths. */
  assert.doesNotMatch(read("components/cards/ProductCard.jsx"), /JWL-\d{3}|\.avif|\.jpg/);
});
