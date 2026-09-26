# PHASE 14.4B — Multi-Angle Jewellery Product Hover

**Reconciliation document · Swarnova**
Date: 2026-09-26 · Branch: `arena/01a0de54-swarnova`
Scope: multi-angle **photographs** of the same jewellery piece, crossfaded on
desktop hover inside the existing ProductCard image area. No product video, no
GIF, no canvas, no new animation library, no ProductCard redesign, and no
Phase 14.4C.

---

## 0. Headline

| | Status |
|-|--------|
| Multiple photographs of the **same** piece, from real camera-angle changes | **Done**: 3 products, 7 new frames, all visually QA'd frame by frame (§2) |
| Jewellery identity consistent across frames | **Done**: 3 generated frames were **rejected** and are not shipped (§2.3) |
| Card shows the primary first; desktop hover crossfades left → right → detail | **Done, measured in a real browser** |
| Mouse leave returns to the primary as one smooth dissolve | **Done, measured** (layer opacity 1 → 0.50 mid-fade → 0) |
| Rapid enter/leave, card-to-card movement | **No stuck frames**; only one card is ever engaged |
| Mobile / touch tablet / reduced motion | **Static primary**, and no angle image is ever downloaded |
| Products without frames | Unchanged single `<img>`, same markup as before |
| Backend-ready media contract `media: { primary, hoverFrames }` | **Done**, resolved in the catalog service |
| `npm test` | **291 / 291 pass** (262 existing + 29 new) |
| `npm run build` | **✓** |
| Real-browser validation (Chromium 153, 5 viewports + touch tablet + reduced motion) | **88 / 88 checks pass** |
| Phase 14.4A hero | **Untouched** (no hero file modified; hero reel verified rendering) |
| Phase 14.4C | **NOT started** |

---

## 1. IMPLEMENTED

### 1.1 Multi-angle jewellery photography

The existing catalogue stills were already high-quality product photography
(pieces on ivory / champagne silk, soft studio light, no model). Each piece
keeps its **existing still as the primary / front frame**. Only the extra
angles were generated, each one using that primary as its reference image,
with this instruction: *same piece, same fabric and folds, same light
direction and grade, same framing and scale; only the camera position
changes.*

| Frame | Intent |
|-------|--------|
| 1: Primary / Front | The existing canonical still (reused, not regenerated, not duplicated) |
| 2: Slight Left | Camera orbited ~15° left: side depth, shifted reflections |
| 3: Slight Right | Camera orbited ~15° right, with the same framing and scale |
| 4: Detail | Camera ~1.5× closer: stone settings, gold texture, bail |

### 1.2 Product media contract

The mock record gets one optional field. The primary stays where it always
was (`images[0]`), so it is never stored twice:

```js
// mock/data/products/index.js  (JWL-001)
images: [{ src: media.productPendant, alt: "…" }],
media: {
  hoverFrames: [
    { src: media.productPendantAngleLeft,  alt: "…slight left angle" },
    { src: media.productPendantAngleRight, alt: "…slight right angle" },
    { src: media.productPendantDetail,     alt: "Close detail of…" },
  ],
},
```

`services/productMediaService.js` resolves every product to:

```js
media: {
  primary:     { src, alt } | null,   // media.primary (backend) ?? images[0]
  hoverFrames: [{ src, alt }, …],     // [] when missing / null / empty
}
```

* `primary` is always present when the piece has an image. `hoverFrames` is
  optional and **never mandatory**.
* Frames may be `{ src, alt }` or bare URL strings (CDN-friendly). Entries
  without a `src`, duplicates, and repeats of the primary are dropped.
* `withProductMedia` is idempotent, and a backend may return the resolved
  `media` object directly. `catalogService.getProducts / getProduct` attach it,
  so **every** ProductCard feed (catalogue, collections, homepage featured,
  wishlist, account overview, related products) gets the same shape without
  any page change.
* ProductCard contains **no** product-specific paths (enforced by a test).

### 1.3 Hover interaction

Three small pieces, each with a single responsibility:

| Module | Responsibility |
|--------|----------------|
| `features/product-media/hoverSequence.js` | DOM-agnostic timing controller: enter / leave / frame loaded / frame failed → `{ engaged, active }`. Unit-tested with a fake clock. |
| `hooks/useProductMediaHover.js` | Browser facts (pointer type, media queries), lazy "arming", and writing state to DOM data attributes |
| `components/product/ProductMediaHover.jsx` | Presentation: the primary `<img>` plus the lazily mounted decorative angle layer |

`ProductCard` only composes them. Its layout, type, price, rating, wishlist,
actions and Try-On button are unchanged. The one addition to the shared
`Card.Media` primitive is a passthrough of extra props onto its outer element,
so the pointer handlers cover the whole image frame, including the wishlist
overlay. Moving onto the heart does not count as leaving.

**Sequence (desktop, measured):**

```
enter ─260 ms─▶ Left ─1.5 s─▶ Right ─1.5 s─▶ Detail  (holds; never loops)
leave ─────────▶ whole angle layer dissolves as ONE surface → Primary (700 ms)
```

* **Crossfades:** 680 ms per frame and 700 ms for the leave, with
  `--ease-dissolve` (the symmetric S-curve introduced for the 14.4A reel).
  Each new frame fades in **above** the previous one, which stays opaque, so a
  step never dips back to the primary.
* **Leave:** the layer fades as a group, so the order is Detail → Primary with
  no intermediate angles flashing through. Once the fade has finished (720 ms)
  the frame index quietly resets.
* **Re-entry mid-fade:** the reset is cancelled and the layer fades back in on
  the frame it left, then continues. Nothing can stick.
* **No looping:** the sequence settles on the detail frame. That reads as one
  slow camera move around the piece, not a slideshow or autoplay.
* **Motion:** no bounce, zoom, parallax, shimmer or sparkle. The card's
  existing restrained `motion-zoom-subtle` (scale 1.03) now applies to the
  primary + angle wrapper, so all layers move together exactly as the single
  still did before.

### 1.4 Responsive behaviour

| Environment | Behaviour |
|-------------|-----------|
| Desktop / laptop with mouse or trackpad (`(hover: hover) and (pointer: fine)`) | Multi-angle hover |
| Touch tablet (iPad-class, `hover: none`) | Static primary |
| Phone | Static primary |
| Touch or pen input on a hybrid laptop (`pointerType !== "mouse"`) | Static primary |

The check happens at pointer time, so there are no per-card media-query
listeners. A CSS guard (`@media (hover: none), (pointer: coarse),
(prefers-reduced-motion: reduce) { .product-media-layers { display: none } }`)
also covers these environments. No gestures, no autoplay.

### 1.5 Reduced motion

`prefers-reduced-motion: reduce` means the card never arms: the primary stays
static and no angle image is fetched. The CSS guard hides the layer even if
the preference changes mid-session.

### 1.6 Accessibility

* The primary `<img>` keeps its descriptive alt text and is the **only** image
  exposed to assistive technology.
* The angle layer is `aria-hidden="true"` with `alt=""` frames, so there are
  no duplicate announcements. Verified in the browser's accessibility tree:
  a hovered card exposes exactly one `img`.
* Keyboard focus on the card link triggers no motion. Link names, wishlist
  labels and `aria-pressed` are unchanged.
* The descriptive frame alts in the data are used where the angles are real
  content: the Product Detail gallery's thumbnail labels.

### 1.7 Fallback

| Case | Result |
|------|--------|
| `hoverFrames` missing / `null` / `[]` | Original single `<img>` markup, no wrapper, no handlers |
| Invalid frame entries | Dropped by the service |
| A frame fails to load | Skipped permanently; the sequence continues with the rest |
| Every frame fails | Primary stays; no blank frame, spinner or broken image |
| A frame not downloaded yet | The sequence waits and fades it in only once it has decoded; a half-loaded image never shows |

### 1.8 Performance strategy

* **Zero alternate-image requests on catalogue load.** Angle `<img>` elements
  do not exist in the DOM until the first real mouse hover on a capable device
  "arms" that one card.
* Arming is the **only** React state update the feature makes: once per card
  lifetime. Frame changes are written directly to `data-engaged` /
  `data-shown` attributes, and CSS runs the opacity transitions. **The card
  does not re-render while its sequence plays.**
* Each armed card adds at most 1 wrapper `<div>` and 3 `<img>` elements. Cards
  without frames add nothing.
* All timers are cleared on leave and on unmount (`dispose`).

### 1.9 Product Detail page

The gallery component is **unchanged**. `ProductDetailPage` now passes
`productGalleryImages(product)`, which is the piece's images followed by its
angle frames. JWL-001 therefore shows 4 plates with the existing thumbnail
selector, and single-still pieces are unaffected. No gallery logic lives in
ProductCard.

---

## 2. ASSETS

### 2.1 Products receiving multi-angle imagery

These are the homepage **Best Sellers / Featured** pieces, which also appear
first in `/products` and in their collections:

| Product | Primary (reused) | Hover frames shipped |
|---------|------------------|----------------------|
| **JWL-001** Hrudaya Diamond Pendant | `images/categories/necklaces.jpg` | `angle-left`, `angle-right`, `detail` |
| **JWL-002** Eternal Halo Ring | `images/categories/rings.jpg` | `angle-left`, `angle-right` |
| **JWL-003** Aabharan Drop Earrings | `images/categories/earrings.jpg` | `angle-left`, `angle-right` |

All other products have no hover frames and behave exactly as before.

### 2.2 Location and naming

```
src/mock/assets/images/products/
├── JWL-001/ angle-left.avif  angle-right.avif  detail.avif
├── JWL-002/ angle-left.avif  angle-right.avif
└── JWL-003/ angle-left.avif  angle-right.avif
```

* Convention: `products/<product-id>/<angle>.avif`, where `<angle>` is one of
  `angle-left | angle-right | detail`. `primary.avif` is intentionally absent,
  because the canonical still is reused and never duplicated (a test enforces
  this).
* Registered only in `mock/assets/index.js` (`productPendantAngleLeft`, …,
  `productDropEarringsAngleRight`) and referenced only by
  `mock/data/products/index.js`.
* **Format:** AVIF (quality 55), 1200×800 for landscape pieces and 800×1200
  for the pendant. Each frame is centre-cropped to exactly its primary's
  aspect ratio, so the 4:3 card crop lines up across frames. The JWL-001
  detail frame was re-framed so the pendant sits in the card window.
* **Weight:** 32–50 KB per frame, **304 KB total** for the 7 frames.

### 2.3 Consistency QA (frame by frame)

Every frame was checked against its primary, first on contact sheets and then
in zoomed crops of the stones, gallery, bail and fabric:

| Frame | Verdict | Notes |
|-------|---------|-------|
| JWL-001 left / right | ✅ | Same teardrop, same single pavé row, same 4-stone bail, same chain, same fabric and light. Genuine perspective shift (the pendant's side depth is visible). |
| JWL-001 detail | ✅ | Same pendant, stone count and bail. Closer camera, satin slightly softer from depth of field. |
| JWL-002 left / right | ✅ | Same halo, same V-shaped cathedral gallery, same split pavé shoulders, same satin folds. |
| **JWL-002 detail** | ❌ **Rejected** | The gallery changed from V-openwork to **heart-shaped** openwork, so the jewellery changed. Not shipped. |
| JWL-003 left / right | ✅ | Identical chandelier pattern (pear top, marquise bow, nested teardrops, marquise fan, 5 drops). Real perspective change. |
| **JWL-003 detail** | ❌ **Rejected** | The backdrop turned into creased paper with hard shadows, so the environment changed. Not shipped. |
| **JWL-004 left** | ❌ **Not shipped** | Consistent, but almost indistinguishable from the primary (not a meaningful angle), and the rest of the set could not be generated in this session (§6). JWL-004 stays a single still. |

---

## 3. ARCHITECTURE

```
ProductCard  (components/cards)             ← composition only
  ├─ useProductMediaHover (hooks)           ← pointer intent → DOM attrs
  │    └─ hoverSequence (features/product-media)   pure timing
  └─ ProductMediaHover (components/product) ← primary + lazy angle layer
        ▲ product.media
        │
useProducts / useProduct (hooks)
  → catalogService.getProducts / getProduct (services)
      → withProductMedia (services/productMediaService)   contract resolution
  → DataProvider (services/providers/DataProvider.jsx)
  → mockProvider.getProducts / getProduct (services/providers/mock)
  → governance store (emit(db.products))
  → mock/data/products/index.js   (media.hoverFrames)
  → mock/assets/index.js          (the only file importing the .avif files)
  → mock/assets/images/products/<id>/<angle>.avif
```

**Data-flow proof (automated):**

* `14.4B · UI, hooks, features and media services never import mock data or
  assets`: walks `components/ pages/ hooks/ layouts/ features/` plus
  `productMediaService.js` and `catalogService.js`, finding no `mock/` import
  and no `images/products/` path.
* The existing `14.4A · UI, hooks and services never import mock assets or
  data` sweep still passes.
* `14.4B · catalogue products arrive with the resolved media contract` wraps
  the **real** mock provider and goes through `catalogService`.
* ProductCard source contains no `JWL-…`, `.avif` or `.jpg`.

---

## 4. VALIDATION

### 4.1 Tests

```
npm test
# tests 291   # pass 291   # fail 0
```

New file: `src/__tests__/phase14-4b-multi-angle.test.mjs` (29 tests)

| Area | Tests |
|------|-------|
| Contract | primary always / hoverFrames optional (missing, null, [], {}); invalid entries, duplicates and primary repeats dropped; backend-supplied `media` honoured; idempotent |
| Provider chain | raw mock records declare frames only for JWL-001/002/003 and never duplicate the primary; resolved contract on every catalogue product; representative set covers the bestsellers; `getProduct` resolves media |
| Assets | files exist, are AVIF, are card-sized (5–150 KB), follow the naming convention; no `primary.avif` duplicate |
| Sequence | primary → left → right → detail then hold (no loop, no timers left); pacing ≥ 1 s and dissolves within 400–700 ms; leave (layer out at once, reset after the dissolve, no later steps); **rapid enter/leave ×25** leaves primary with no timers; re-entry mid-fade resumes; waits for loads; broken frames skipped / all broken → primary; zero frames → no-op; **multiple independent cards**; dispose on unmount |
| Gating | desktop mouse plays; `hover: none`, touch and pen pointers, and no `matchMedia` are static; **reduced motion is static** (+ CSS guard) |
| Markup | card with frames renders only the primary `<img>` on load (lazy); card without frames renders the original single still; raw records (images only, empty or null frames) work; armed layer is `aria-hidden` with empty alts and exactly one named image |
| Regression | **product navigation + wishlist** intact; PDP gallery gets the angles and single-still pieces are unchanged; no video, GIF or canvas; no framer-motion / gsap / TypeScript; no `.ts(x)` files; **no mock imports** |

No existing test was removed or weakened. One existing assertion
(`14.4 · ProductCard uses subtle scale`) requires ProductCard to own the
`motion-zoom-subtle` class. That was honoured by having the card pass the
class to `ProductMediaHover`, rather than changing the test.

### 4.2 Production build

```
npm run build   ✓ built
dist/index.html  22,839.85 kB │ gzip 16,572.68 kB
baseline (main)  22,448.43 kB │ gzip 16,280.27 kB   → +391 kB (+1.7 %)
```

### 4.3 Real-browser validation

Headless **Chromium 153** against the Vite dev server, driven by Playwright
with real mouse and touch input. **88 / 88 checks passed.** The script lived
outside the repository, as a throwaway validation harness.

**Desktop: 1280×800, 1536×864, 1024×768 (mouse)**

| Check | Result (all three viewports) |
|-------|------------------------------|
| `/products` renders 8 cards, 3 with hover frames | ✅ |
| Angle images downloaded on page load | ✅ **0** (4 image requests total, all primaries) |
| JWL-001 initially shows the primary (layer not even mounted) | ✅ |
| Hover order | ✅ `[-1, 0, 1, 2]`: first angle at ~290 ms, then ~1.5 s per angle |
| Holds on detail while the pointer stays | ✅ frame opacities `[1, 1, 1]`, no loop |
| Only the hovered card's angles fetched | ✅ `JWL-001/angle-left, angle-right, detail` |
| Card dimensions and position during hover | ✅ identical bounding box (278×394 at 1280) |
| Moving onto the wishlist heart keeps the angle view; heart toggles | ✅ `aria-pressed false → true` |
| Mouse leave | ✅ layer opacity **0.50 mid-fade → 0**, frame reset to primary |
| **20 × rapid enter/leave** | ✅ ends disengaged, primary, opacity 0 |
| Hover JWL-001 then move to JWL-002 | ✅ JWL-001 back to primary, JWL-002 advancing; **exactly 1 engaged layer on the page** |
| Product without frames (JWL-005) | ✅ single `<img>`, no layer |
| Image click → `/product/JWL-001`, gallery shows 4 plates | ✅ |
| React console errors / page errors | ✅ none (see note) |

**Touch: 1024×768 tablet, 768×1024, 375×812 (`isMobile`, `hasTouch`)**

| Check | Result |
|-------|--------|
| `(hover: hover) and (pointer: fine)` | false |
| Hovering or tapping the card | ✅ primary static, layer never mounted |
| Angle images downloaded | ✅ 0 |
| Horizontal overflow | ✅ none |
| Tap navigates to the product | ✅ |
| Console errors | ✅ none |

**Reduced motion (1280×800, `reducedMotion: "reduce"`):** hover keeps the
primary static, with 0 angle downloads. ✅

**Accessibility:** the hovered card's accessibility tree has exactly one `img`
(the primary, with its descriptive name). Keyboard focus triggers no motion. ✅

**Routes (no console errors):** `/`, `/products`, `/collections`,
`/collections/signature`, `/collections/everyday`, `/product/JWL-001`,
`/product/JWL-002`, `/product/JWL-005` all render. The **14.4A hero still
renders its `<video>` reel** on `/`. ✅

> Note: the only console error in the sandbox is the external Google Fonts
> stylesheet (`fonts.googleapis.com`), which the sandbox has no network route
> to. It is environmental, happens on `main` too, and is unrelated to this
> phase.

### 4.4 Performance observations

* **On load:** 0 alternate-angle requests. Image requests equal the number of
  visible primaries (lazy-loaded as before).
* **On first hover of a card:** 2–3 requests (32–50 KB each), fetched **once**
  (5 requests / 5 unique across the whole session, with no repeats). Later
  hovers reuse the mounted, decoded images.
* **Rendering:** frame changes do not re-render React (DOM attributes + CSS
  opacity only). Opacity transitions are compositor-friendly. The catalogue
  stayed responsive through 20 rapid hover cycles.

---

## 5. Files changed

| File | Change |
|------|--------|
| `src/services/productMediaService.js` | **new**: contract resolution + PDP gallery plates |
| `src/features/product-media/hoverSequence.js` | **new**: pure hover timing controller + device gating |
| `src/hooks/useProductMediaHover.js` | **new**: pointer wiring, lazy arming, DOM-attribute painting |
| `src/components/product/ProductMediaHover.jsx` | **new**: primary + decorative angle layer |
| `src/components/cards/ProductCard.jsx` | composes the above; no layout or style change |
| `src/components/ui/Card.jsx` | `Card.Media` forwards extra props to its outer element |
| `src/services/catalogService.js` | products leave the service with `media` resolved |
| `src/pages/customer/product/ProductDetailPage.jsx` | gallery receives `productGalleryImages(product)` |
| `src/index.css` | `.product-media-layers` / `.product-media-frame` dissolves + touch/reduced-motion guard |
| `src/mock/assets/index.js` | 7 new asset keys |
| `src/mock/data/products/index.js` | `media.hoverFrames` on JWL-001/002/003 + contract doc |
| `src/mock/assets/images/products/**` | 7 AVIF frames (304 KB) |
| `src/__tests__/phase14-4b-multi-angle.test.mjs` | **new**: 29 tests |

**Not touched:** hero reel / 14.4A files and assets, auth, customer login,
Google OAuth, staff login, RBAC, Super Admin, Admin, Employee, checkout,
orders, inventory, AI Studio, Virtual Try-On, account, branches, governance,
CMS, backend integration, and `package.json` (no dependency added).

---

## 6. KNOWN LIMITATIONS

1. **Generated, not photographed.** The angle frames are AI-generated from
   each primary still, not captured in a real multi-camera shoot. They passed
   visual QA at card and gallery sizes, but a macro inspection could still
   find small differences, such as individual pavé stone positions or chain
   link detail. For production, replace them with real studio captures under
   the same filenames. No code change is needed.
2. **Partial sets.** JWL-002 and JWL-003 ship **2** angles each, because
   their detail frames failed consistency QA. JWL-004 (Lumina Tennis
   Bracelet) ships **none**, because the session's image-generation limit was
   reached before its set could be completed, and its one generated frame was
   too close to the primary to be a real angle. The contract handles any
   frame count, so completing these sets is a data-only change.
3. **Shared category stills.** Several catalogue pieces share one category
   photograph as their primary (for example JWL-001 and JWL-010 both use
   `necklaces.jpg`). Hover frames are attached **per product**, so only the
   three listed pieces animate. Pieces that share a still but are a different
   product correctly stay static.
4. **Single-file production build.** `vite-plugin-singlefile` inlines every
   asset as a data URI (an existing project convention), so in `dist/` the
   angle bytes (+391 kB, +1.7 %) ship inside the HTML. Lazy arming still
   avoids decode and DOM cost there, but the network-level laziness measured
   in §4.4 applies to the dev server and to any future CDN/backend delivery,
   not to the single-file bundle.
5. **Hybrid devices.** A touchscreen laptop with a mouse gets the hover
   (correct for mouse input). Taps on it never start the sequence. Tablets
   with a paired trackpad that report `hover: hover` would also get it.
6. **Validation environment.** Browser validation used headless Chromium
   only. Safari and Firefox were not available in the sandbox. The feature
   relies only on CSS opacity transitions, `matchMedia` and Pointer Events,
   all baseline-supported.

---

## 7. Definition of Done

- [x] Selected products have multiple photographs of the same jewellery
- [x] Images are genuinely different camera angles
- [x] Jewellery identity remains consistent (inconsistent frames rejected)
- [x] ProductCard initially shows the primary image
- [x] Desktop hover produces smooth angle transitions
- [x] Mouse leave smoothly returns to the primary
- [x] No product-card video is used
- [x] No fake or abstract animation is used
- [x] Mobile remains static
- [x] Reduced motion remains static
- [x] Products without hover media work normally
- [x] ProductCard does not directly import mock data
- [x] Existing ProductCard design is preserved
- [x] Existing catalogue architecture is preserved
- [x] Existing Product Detail gallery remains functional
- [x] Performance is acceptable
- [x] No React console errors
- [x] No TypeScript introduced
- [x] No unrelated feature regressions
- [x] Existing tests pass (262 / 262)
- [x] New 14.4B tests pass (29 / 29)
- [x] Production build passes
- [x] Real-browser validation passes (88 / 88)
- [x] PHASE_14_4B_RECONCILIATION.md is complete

**Phase 14.4C (craftsmanship video) has not been started. Awaiting approval.**
