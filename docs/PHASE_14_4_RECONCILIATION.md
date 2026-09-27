# PHASE 14.4 — Premium Motion + Cinematic Video Experience

**Reconciliation Document · Swarnova**
**Scope:** Customer storefront motion + cinematic media
**Date:** 2026-09-26

---

## 1. Objective

Phase 14.4 elevates the Swarnova customer storefront from a polished editorial
experience into a **luxury jewellery house + cinematic digital atelier**. Motion
is added sparingly — the brief is *"motion should explain, guide, or create
atmosphere"*, never "prove that the website has animation". The target ratio is
**80–90% calm/static editorial, 10–20% meaningful motion**, with the three
strongest cinematic moments reserved for:

1. **Hero** — muted autoplay video, poster-first, graceful failure.
2. **Brand / craftsmanship film** — "The Art of Gold", tap-to-play editorial.
3. **AI Jewellery Studio + Virtual Try-On** — restrained "atelier processing"
   states and a calm reveal for generated designs / try-on results.

Every other surface (product cards, gallery, buttons, dialogs) receives only
micro-interaction level motion. Super Admin, Admin, Employee and operational
consoles remain calm and functional.

---

## 2. Existing Architecture Preserved

Phase 14.4 is an enhancement layer, not a rewrite. The following were verified
intact by `npm test` (214 tests passing) and `npm run build` (production build
clean):

| Layer                                   | Status |
|-----------------------------------------|--------|
| UI → Page → Hook → Service → DataProvider → Mock Provider | Unchanged, extended |
| Routes (`/`, `/collections`, `/products`, `/ai-studio`, `/virtual-try-on`, `/cart`, `/checkout`, account, admin, super-admin, employee) | All intact |
| Customer authentication + Google OAuth seam | Untouched |
| Staff authentication (Super Admin / Admin / Employee) + Phase 14.3 authority model | Untouched |
| RBAC + branch scoping                   | Untouched |
| Cart / checkout / orders / inventory    | Untouched |
| Catalogue / products / collections / branches / journal | Untouched |
| AI Studio contract (generate → vary → refine → save → try-on) | Untouched |
| Virtual Try-On contract (source → photo → render → save / bag / continue) | Untouched |
| Design tokens (palette, typography, spacing, radius, elevation) | Extended, never replaced |
| Existing primitives (Button, Card, Section, Container, Dialog, IconButton, Badge, Price, Rating, ContentLink, TextLink, AsyncBoundary, ErrorBoundary, SectionHeading, Eyebrow) | Reused; no duplicates created |
| Mock asset boundary (`UI → never imports src/mock/assets`) | Enforced by new test |
| `useAsync`, `useDataProvider`, provider interface | Unchanged |

No TypeScript (`.ts`/`.tsx`/`tsconfig`) was introduced; the project remains
plain JSX + Tailwind.

---

## 3. Motion System

A single motion language is added to the existing design tokens in
`src/index.css` (`@theme` block). The token set is intentionally small:

```css
/* Timings — restrained, editorial */
--motion-fast:       150ms;   /* button press, icon hover */
--motion-standard:   220ms;   /* UI transitions (default) */
--motion-slow:       420ms;   /* image crossfade, plate swap */
--motion-cinematic:  720ms;   /* hero entrance, reveal */

/* Easings — composed, no bounce / elastic / spring */
--ease-standard:  cubic-bezier(0.22, 0.61, 0.36, 1);
--ease-entrance:  cubic-bezier(0.16, 1, 0.3, 1);
--ease-exit:      cubic-bezier(0.7, 0, 0.84, 0);
```

Guidelines enforced by code review + tests:

- Only **opacity, transform, clip-path** are animated.
- No layout-heavy properties (width/height/top/left/margin/padding) in
  transitions.
- No bounce, elastic, spring, or overshoot easing.
- Motion uses `will-change` sparingly, only on elements actively animating.
- No new animation library (no Framer Motion, GSAP, Lenis, Three.js).

### Utility classes added to `index.css`

| Class                    | Purpose                                                       |
|--------------------------|---------------------------------------------------------------|
| `.motion-reveal`         | Gentle opacity + slight upward lift (hero copy, reveal)       |
| `.motion-fade`           | Simple opacity crossfade (image swaps)                        |
| `.motion-zoom-subtle`    | 1.03 scale on hover (product card media)                      |
| `.motion-ken-burns`      | 24s 1.02→1.06 drift (no-video hero poster, reduced-motion safe) |
| `.motion-atelier-pulse`  | Quiet gold shimmer on AI / Try-On processing plates           |
| `.motion-reveal-clip`    | Clip-path curtain reveal for generated / try-on images        |
| `.cinematic-media`       | `position: absolute; inset: 0; object-fit: cover` video layer |

Button / IconButton base transitions were upgraded from the old `duration-200`
to use `var(--motion-standard)` with the standard easing and a minimal
`active:scale-[0.98]` press feedback — no bounce.

---

## 4. Video System

### Component: `components/ui/CinematicVideo.jsx`

A lightweight wrapper over native `<video>` that implements every requirement
from the brief in one reusable primitive:

- **Poster-first.** The poster image is painted immediately; video fades in
  only after `canplay`, so slow connections never show a black frame.
- **Muted autoplay + loop + playsInline** by default; `autoplay` promise is
  caught and falls back to a tap-to-play affordance rather than breaking.
- **Mobile asset support** via `<source media="(max-width: 767px)">` so a
  smaller encode can be served to phones.
- **Reduced-motion aware:** when the customer prefers reduced motion the
  video does not autoplay; the poster remains.
- **Graceful error:** `onError` keeps the poster visible; no broken icon.
- **Keyboard & a11y:** every video has `alt` on the poster; the tap-to-play
  affordance is a real `<button>` with an aria-label; autoplay videos are
  `aria-hidden` (they are ambient, not content); unmuted playback never
  autostarts.
- **Intersection-aware** via the new `useIntersectionAware` hook
  (`hooks/useIntersectionAware.js`) — used by the brand film to load only
  `metadata` until scrolled near, preventing unnecessary data transfer.
- **No external libraries.** Pure HTML5 video.

### Hook: `hooks/usePrefersReducedMotion.js`

A single SSR-safe hook that reads `prefers-reduced-motion: reduce` and
re-evaluates on change. Consumed by `HeroSection` and `CinematicVideo`.

---

## 5. Homepage Changes

### Cinematic Hero (`pages/customer/home/components/HeroSection.jsx`)

The existing hero composition, copy, CTA structure, brand hierarchy, veils and
trust micro-line are preserved. Enhancements:

- When `content.video.src` is present **and** reduced-motion is off, the
  static `<img>` is replaced with a `<CinematicVideo>` that uses the poster
  as its first paint and fades the film in over it.
- When video is absent, fails, or reduced-motion is requested, the hero
  photograph renders exactly as before — and receives the very subtle
  `.motion-ken-burns` drift (24s, 1.02→1.06) for atmosphere.
- The copy block animates in with a **staggered opacity + translateY
  entrance** over ~700ms using `.motion-reveal[data-delay="1…5"]` — ornament,
  eyebrow, headline, divider, body, CTAs, trust micro-copy arrive in that
  order. No text moves inside the video; all copy remains real HTML.
- Desktop/mobile focal points (`object-position`) and the existing gradient
  veils are unchanged so copy legibility is preserved at every breakpoint.

### Hero media contract (CMS-ready)

```js
video: {
  src,        // desktop encode  (replaces media.heroCinematicVideo)
  mobileSrc,  // <768px encode   (replaces media.heroCinematicMobileVideo)
  poster,     // always painted first
  alt,        // poster accessibility
  autoplay: true,
  loop: true,
  muted: true,
  playsInline: true,
}
```

Any future backend / CMS can swap `src`/`mobileSrc`/`poster` without a UI
change. Omitting `video` keeps the hero a static photograph — video is
opt-in per section, never the default.

### Brand / craftsmanship film (`pages/customer/home/components/BrandFilmSection.jsx`)

A new `brand_film` section is inserted between the existing "Tradition,
Reimagined" editorial block and the "Why Choose Us" pillars. It respects the
existing section rhythm:

- Centered eyebrow ("The Art of Gold"), serif headline ("Where Heritage
  Meets Innovation"), italic lead ("Jewellery is not simply worn. It becomes
  part of your story.").
- 16:9 cinematic frame with the atelier still as poster, a hairline gold
  border, subtle vignette and the existing `shadow-medium`.
- **Calm interaction:** initial state is poster + a single gold circular
  play affordance (20/24px play glyph, 80px circle, hairline gold border,
  soft blur). Pressing play starts the film in place and replaces the
  affordance with native controls. On `ended` the film resets to poster.
- No autoplay, no sound on by default, no YouTube-style chrome.
- Uses `useIntersectionAware` so `preload="none"` until the film scrolls
  near, then upgrades to `metadata`.
- Reduced-motion shows poster only (no play button pulse).

The section is registered in the homepage section registry as `brand_film`,
sorted as order 9 (subsequent orders were renumbered 11–15).

---

## 6. Brand Film

See §5 above. The film is **not** a replacement for any existing editorial
content. It is a dedicated pause point. Copy is minimal and factual:

- Title: *Where Heritage Meets Innovation*
- Lead: *Jewellery is not simply worn. It becomes part of your story.*
- Caption: *A Swarnova atelier film*

No fake craftsmanship claims (e.g. "handmade in 1847") were introduced — all
claims in the existing editorial are preserved verbatim.

---

## 7. Collection / Editorial Media

Per the brief, **static imagery remains the default**. No video was added to
BRIDAL, DIAMONDS, HERITAGE or EVERYDAY collection plates in this phase. The
infrastructure (video contract, `CinematicVideo` component, mobileSrc
support, poster fallback) is ready so a future CMS field can enable
collection-specific cinematic media on a per-collection basis without
component changes.

---

## 8. Product Interactions

Product interactions were intentionally kept subtle. Nothing jumps, glows,
rotates or bounces.

### ProductCard (`components/cards/ProductCard.jsx`)

- Card media image gets `.motion-zoom-subtle` → scale(1.03) on hover over
  420ms (standard easing).
- Border colour transition uses `var(--motion-standard)` instead of the
  hard-coded `duration-200`.
- Wishlist heart fades in on hover (`opacity-0 → opacity-100`) so it does
  not visually clutter the grid until the customer acts; if the piece is
  already wished it stays visible.
- Heart fill transition uses `var(--motion-standard)`.
- Card dimensions, grid rhythm, typography and CTA layout are **unchanged**.

### ProductGallery (`components/product/ProductGallery.jsx`)

- Main plate crossfades between selected images via `.motion-fade` + a
  key change that re-triggers the opacity transition.
- Very restrained 1.04 scale on hover (slower: `var(--motion-cinematic)`)
  for a "loupe" feel — no true zoom modal, no 3D rotation, no parallax.
- Thumbnails transition border-color + opacity with
  `var(--motion-standard)`.

### ProductActions / CTA feedback

- Button / IconButton primitives use the new motion tokens for background,
  border and opacity transitions, plus a minimal `active:scale-[0.98]`
  press response (fast, no bounce). Existing "Added to bag" status
  feedback is preserved.

---

## 9. AI Studio Motion

The AI Studio is one of the two places (with Try-On) where motion is more
noticeable — but still restrained, "luxury digital atelier", not "neon SaaS".

### "Atelier processing" state (`AiStudioPage.jsx`)

The former one-line eyebrow "spinner" is replaced with a composed crafting
state:

- Border shifts from dashed to `border-brand-accent/30` (hairline gold).
- `.motion-atelier-pulse` adds a slow gold shimmer (10–18% champagne
  highlight sweeping left→right every 2.4s) — no spinner, no SVG circle,
  no particles, no neon.
- Centered eyebrow label: "**Creating Your Design**" (gold, tracked).
- Italianic sub-copy: `busyMessage` (e.g. "Crafting your jewellery concept...").
- Ornamental gold hairline + diamond beneath the copy.
- The same treatment is reused for `vary` and `refine` actions via the
  existing `busyMessage` channel.

### Result reveal (`components/ai/AiDesignResult.jsx`)

- Generated image plate fades in once loaded (`opacity-0 → opacity-100` over
  `--motion-slow`).
- A `.motion-reveal-clip` overlay (clip-path curtain pull) draws down over
  the image on load for a restrained "unveiling" feeling.
- Metadata, badges and actions beneath the plate receive a
  `.motion-reveal[data-delay="1"]` so they arrive just after the image.
- **No artificial delay.** If the image is already cached the reveal runs
  immediately; usable content is never held back for animation.

---

## 10. Virtual Try-On Motion

### Processing state (`components/virtual-try-on/TryOnPhotoPreview.jsx`)

While the room prepares a preview, the customer's photograph stays in the
frame (no spinner replacement). Overlaid:

- `.motion-atelier-pulse` gold shimmer (same visual language as the AI
  Studio — consistent "the atelier is working" treatment).
- Soft dark veil (`bg-ink/10 backdrop-blur-[1px]`).
- Centered gold hairline ornament + eyebrow label with `busyMessage`
  ("Preparing your virtual fitting...").

### Result reveal (`components/virtual-try-on/TryOnResult.jsx`)

- Try-on image fades in (`opacity-0 → opacity-100`) once loaded.
- While loading, a subtle gold-ornament placeholder sits in the frame
  instead of a blank white box.
- [Original] / [Try-On] toggle uses `var(--motion-standard)` transitions
  instead of an instant swap, so the comparison feels composed rather than
  flashing.
- Existing business logic preserved: product-source pieces show "Add to
  Bag" through the canonical cart; AI concepts show "Continue Designing"
  back to the studio. No duplicate purchase logic.
- The result is **not** marketed as real-time AR; copy remains the same
  honest "virtual fitting room" language.

---

## 11. Accessibility

- Every autoplaying video is **muted + playsInline** (enforced by tests).
- Posters carry descriptive `alt` text; ambient videos are `aria-hidden`.
- Tap-to-play affordances are real `<button>` elements with `aria-label`.
- Focus rings are unchanged (`outline: 2px solid var(--color-focus)`,
  `outline-offset: 3px`).
- All new interactive elements are keyboard-operable.
- No important text lives inside video — every headline, eyebrow, CTA and
  trust marker is real HTML above the media layer.
- Native `<video controls>` are shown only after the customer initiates
  playback on the brand film; otherwise controls are hidden to avoid a
  YouTube-like chrome but keyboard play still works via the affordance
  button.
- `prefers-reduced-motion` disables decorative autoplay and Ken-Burns.

---

## 12. Reduced-Motion Behavior

A global `@media (prefers-reduced-motion: reduce)` block in `src/index.css`
neutralises animation and transition durations to 0.001ms (not `none`, which
can break transition-end events) and disables scroll-behavior smooth. Specific
behaviours:

- Hero video does not autoplay; the poster renders static (no Ken Burns).
- Brand film shows poster only; auto-shimmer is disabled by the global rule.
- `.motion-ken-burns`, `.motion-atelier-pulse`, `.motion-reveal` keyframe
  animations resolve to instant state changes.
- AI / Try-On reveals become immediate — content appears, no theatrical
  delay.
- Product card hover scale is removed (animation-duration → 0).
- **Functional feedback is preserved:** button presses, focus rings, dialog
  open/close, error/success state changes remain visible (they resolve
  instantly rather than being hidden).
- `usePrefersReducedMotion()` hook lets components (HeroSection,
  CinematicVideo) make per-component decisions at render time.

---

## 13. Performance Strategy

Video is treated as the expensive asset it is:

| Technique                        | Applied where                            |
|----------------------------------|------------------------------------------|
| Poster-first rendering           | Hero, brand film                         |
| `preload="metadata"` (hero)      | Hero (just enough to start playback)     |
| `preload="none"` until in-view   | Brand film (via IntersectionObserver)    |
| Mobile `src` via `<source media>`| Hero (`mobileSrc` for <768px)            |
| Muted + playsInline              | All autoplaying video                    |
| Loop only on ambient hero        | Brand film does not loop                 |
| IntersectionObserver pausing hook| `useIntersectionAware` — ready for future use on below-fold videos |
| No multiple simultaneous plays   | Only the hero autoplays; brand film requires tap |
| Tiny placeholder MP4s            | Mock assets are sub-kilobyte valid containers (a still champagne frame) that exercise the pipeline without shipping a megabyte of stock footage |
| No blocking render               | Video is absolutely positioned; paint is not blocked on `canplay` |
| `fetchPriority="high"`           | Poster only (poster is the real LCP candidate, not video) |
| Will-change used sparingly       | Only on actively animating layers        |

Final bundled `dist/index.html` is ~5.0MB (gzip 3.2MB) — comparable to the
Phase 14.3 baseline; the video placeholder bytes are negligible. Production
H.264/H.265 campaign footage (when delivered) is expected to be served
externally via the CDN/DAM rather than inlined by `vite-plugin-singlefile`.

---

## 14. Media / Data Architecture

Video metadata follows the same provider contract as images — UI components
**never** import media files directly.

```
src/mock/assets/
├── images/               (existing — unchanged)
│   ├── homepage/
│   ├── categories/
│   ├── ai/
│   ├── try-on/
│   ├── branches/
│   └── media/
└── videos/               (NEW — Phase 14.4)
    ├── homepage/
    │   ├── hero-cinematic.mp4
    │   └── hero-cinematic-mobile.mp4
    └── editorial/
        └── art-of-gold.mp4
```

Registered through the single existing asset registry
(`src/mock/assets/index.js`) with the keys:

```js
media.heroCinematicVideo
media.heroCinematicMobileVideo
media.artOfGoldVideo
```

These flow through `mock/data/homepage/index.js` into the section `content`
objects and arrive at UI components via `useHomepage() → contentService →
mockProvider.getHomepage()` — the exact same path every other piece of
editorial content already uses. A future API provider only needs to return
`section.content.video = { src, mobileSrc, poster, alt, … }` in its homepage
document; no component changes required.

The CMS-ready video schema matches the brief:

```
video: {
  src,            // desktop video URL
  mobileSrc,      // <768px video URL (optional)
  poster,         // poster image URL (required)
  alt,            // accessibility text (required)
  autoplay,       // boolean
  loop,           // boolean
  muted,          // boolean
  playsInline,    // boolean
}
```

---

## 15. Tests

All existing 194 tests continue to pass. A new test file
`src/__tests__/phase14-4-motion-cinematic.test.mjs` adds 20 focused checks:

| # | Test                                                                  |
|---|-----------------------------------------------------------------------|
| 1 | Hero content exposes CMS-ready video fields (src, mobileSrc, poster, alt, autoplay, loop, muted, playsInline) |
| 2 | HeroSection renders poster even when video is configured              |
| 3 | CSS defines a `prefers-reduced-motion: reduce` block that neutralises animation/transition duration |
| 4 | CinematicVideo implements muted autoplay, poster-first, error fallback |
| 5 | CinematicVideo respects reduced-motion                                |
| 6 | AI studio busy state uses `motion-atelier-pulse`, not a generic spinner |
| 7 | Try-On preview uses `motion-atelier-pulse` while preparing            |
| 8 | ProductCard uses subtle scale; no dramatic transforms (rotate/glow/shadow/translate) |
| 9 | ProductGallery crossfades and uses 1.04 max scale                     |
|10 | package.json contains no banned animation libraries (framer-motion, gsap, lenis, three, react-spring, motion, popmotion, @react-three) |
|11 | No UI component under `components/` imports `mock/assets` directly    |
|12 | Video assets are registered through the mock asset index              |
|13 | Brand film section is registered in the homepage section registry     |
|14 | No cinematic video/motion classes appear in Admin / Super Admin / Employee directories |
|15 | Motion tokens (`--motion-fast/standard/slow/cinematic`, `--ease-*`) exist; no spring/bounce easing declarations |
|16 | Every autoPlay usage in JSX files is paired with `muted` and `playsInline` |
|17 | CinematicVideo declares `poster` and `alt` as required props          |
|18 | Brand film uses a tap-to-play affordance (no autoplay)                |
|19 | `useIntersectionAware` hook exists (IntersectionObserver + threshold) |
|20 | Primary customer page components (Home/Collections/Products/Detail/AI/Try-On/Cart/Checkout) are still registered in the router |

**Total: 214 tests passing** (194 pre-existing + 20 new).

---

## 16. Build Result

```
$ npm run build
vite v7.3.2 building client environment for production...
transforming...
✓ 2229 modules transformed.
[plugin vite-plugin-singlefile] Inlining: index-*.js
[plugin vite-plugin-singlefile] Inlining: style-*.css
computing gzip size...
dist/index.html  4,997.69 kB │ gzip: 3,197.09 kB
✓ built in 5.94s
```

Zero errors, zero warnings, zero TypeScript. Production build passes.

---

## 17. Browser Validation Result

**Limitation:** this sandbox environment does not provide an automated
browser (Playwright/Puppeteer) for multi-viewport visual QA. The following
were validated statically via code inspection + media-query structure in
CSS; live visual validation at 375 / 640 / 768 / 1024 / 1280 / 1536 should
be performed in a real browser before launch:

| Breakpoint | Static validation performed                                         |
|------------|---------------------------------------------------------------------|
| 375px      | Mobile hero padding (`7rem/2.75rem`), mobile video `<source>`, no overflow, CTA stays in flow |
| 640px      | Thumbnail grid wrap, product card hover targets (≥44px), brand film 16:9 |
| 768px      | Mobile/desktop video switchover at 767px max-width, two-column atelier from `lg` (1024px) |
| 1024px     | Landscape phone tightening (hero copy padding 6.5rem, micro-line hidden) inherited from Phase 1 |
| 1280px     | Desktop focal point (18% 30%), hero copy max-w-[520px] left column, `scroll-mt-28` intact |
| 1536px     | Shell max-w-[1280px] caps content; hero veil and Ken-Burns respect the container |

Items to verify in-browser:

1. Hero text readability over the video (contrast on model's face/hair).
2. CTA visibility at every width.
3. Video cropping / focal point on the supplied production footage (the
   placeholder is a still frame, so real footage focal point will need
   tuning via `object-position` once delivered).
4. Mobile hero height (no copy clipping).
5. AI Studio generation shimmer visible but subtle.
6. Virtual Try-On processing overlay over the customer photo.
7. Product card hover scale (1.03) feels refined, not jumpy.
8. Product gallery image crossfade.
9. Reduced-motion: toggle OS setting and confirm hero is static poster,
   brand film is poster-only, no shimmer, no entrance stagger.

---

## 18. Files Changed

| File                                                                       | Change                                                |
|----------------------------------------------------------------------------|-------------------------------------------------------|
| `src/index.css`                                                            | Added motion tokens, reveal/fade/zoom/ken-burns/atelier-pulse/clip-reveal utilities, reduced-motion block, cinematic-media class, hero media object-position fixes |
| `src/components/ui/CinematicVideo.jsx`                                     | **NEW** — native `<video>` wrapper with poster-first lifecycle, autoplay fallback, mobile src, error recovery, reduced-motion, tap-to-play affordance |
| `src/hooks/usePrefersReducedMotion.js`                                     | **NEW** — SSR-safe reduced-motion media query hook    |
| `src/hooks/useIntersectionAware.js`                                        | **NEW** — IntersectionObserver hook for off-screen pausing / lazy preload |
| `src/components/ui/Button.jsx`                                             | Transition upgraded to motion tokens + active scale feedback |
| `src/components/ui/IconButton.jsx`                                         | Same transition treatment as Button                  |
| `src/components/cards/ProductCard.jsx`                                     | Subtle image scale, wishlist fade-in, motion tokens on borders/hearts |
| `src/components/product/ProductGallery.jsx`                                | Crossfade between plates, 1.04 hover scale, thumbnail opacity transitions |
| `src/components/ai/AiDesignResult.jsx`                                     | Image reveal (opacity + clip curtain), metadata stagger |
| `src/components/virtual-try-on/TryOnPhotoPreview.jsx`                      | Atelier pulse + "Preparing" overlay while processing  |
| `src/components/virtual-try-on/TryOnResult.jsx`                            | Crossfade on load, loading ornament, toggle transition |
| `src/pages/customer/home/HomePage.jsx`                                     | Registered `BrandFilmSection` as `brand_film`        |
| `src/pages/customer/home/components/HeroSection.jsx`                     | CinematicVideo + staggered copy entrance, reduced-motion handling |
| `src/pages/customer/home/components/BrandFilmSection.jsx`                  | **NEW** — "The Art of Gold" brand film section        |
| `src/pages/customer/ai-studio/AiStudioPage.jsx`                            | Replaced generic spinner with composed "atelier crafting" state |
| `src/mock/assets/index.js`                                                 | Registered hero/editorial video placeholder imports and exports |
| `src/mock/assets/videos/homepage/hero-cinematic.mp4`                       | **NEW** — minimal placeholder MP4                    |
| `src/mock/assets/videos/homepage/hero-cinematic-mobile.mp4`                | **NEW** — minimal placeholder MP4                    |
| `src/mock/assets/videos/editorial/art-of-gold.mp4`                         | **NEW** — minimal placeholder MP4                    |
| `src/mock/assets/videos/PLACEHOLDER_README.md`                             | **NEW** — documents the placeholder contract          |
| `src/mock/data/homepage/index.js`                                          | Added hero `video` contract + new `brand_film` section; renumbered subsequent orders |
| `src/__tests__/support/asset-loader.mjs`                                   | Added `.mp4/.webm/.mov` to asset extensions for test runner |
| `src/__tests__/phase14-4-motion-cinematic.test.mjs`                        | **NEW** — 20 motion/cinematic architecture tests      |
| `PHASE_14_4_RECONCILIATION.md`                                             | **NEW** — this document                               |

No pre-existing reconciliation document (`PHASE_14_1*`, `PHASE_14_2*`,
`PHASE_14_3*`, `SWARNOVA_BRD_PRD_v2.0.md`, `PHASE_14_AUDIT.md`) was modified.

---

## 19. Known Limitations

1. **Placeholder video.** The three `.mp4` files are sub-kilobyte valid MP4
   containers with a single still frame. They exercise the video pipeline
   (autoplay, loop, muted, playsInline, mobileSrc switching, poster
   crossfade, error recovery) but they are **not** final campaign footage.
   The house must deliver compressed H.264/H.265 assets (target ≤5MB for
   hero desktop, ≤2MB for mobile, 15–30s for the brand film) before launch.
   The replacement path is: drop the new files into
   `src/mock/assets/videos/...` (or, when the API provider lands, return
   URLs from the backend) — no component changes.
2. **No browser-automated visual QA.** See §17. Multi-viewport visual
   validation must be performed manually before launch.
3. **No below-fold auto-pause yet.** `useIntersectionAware` is implemented
   and used by the brand film for preload gating, but general off-screen
   `video.pause()` wiring is left as a follow-up because there is only one
   autoplaying video (the hero) above the fold. When additional collection
   videos are added (§9 / §23), this hook should be used to pause them when
   not visible.
4. **Collection videos not shipped.** Per the brief ("DO NOT add a video to
   every collection"), collection plates remain static imagery. The video
   contract on `CinematicVideo` is ready so a future CMS can opt-in per
   collection.
5. **No AI/AR misrepresentation.** The Try-On processing and result states
   use mock-generated imagery exactly as Phase 14.3 did; copy does not claim
   real-time AR, live camera tracking or AI/CV processing.

---

## 20. Future Backend / CMS Replacement Seam

The frontend contract is ready for a backend/DAM to replace the mock media.
The following fields map directly onto CMS fields, no component work needed:

| CMS field           | Frontend path                                  |
|---------------------|------------------------------------------------|
| `desktop_video_url` | `section.content.video.src`                    |
| `mobile_video_url`  | `section.content.video.mobileSrc`              |
| `poster_image`      | `section.content.video.poster` / `image.src`   |
| `title`             | `content.title`                                |
| `subtitle`          | `content.eyebrow` / `content.body`             |
| `cta_label` / `cta_href` | `content.primaryCta` / `secondaryCta`      |
| `autoplay`          | `content.video.autoplay`                       |
| `loop`              | `content.video.loop`                           |
| `muted`             | `content.video.muted`                          |
| `plays_inline`      | `content.video.playsInline`                    |
| `is_active`         | `section.enabled`                              |
| `display_order`     | `section.order`                                |
| `placement`         | Section `type` (hero / brand_film / collection-scoped) |

Scheduling/activation belongs in the CMS layer, not in React. The provider
interface already supports this via `getHomepage()`; an API provider simply
filters by active/scheduled sections server-side exactly as the mock
provider filters by `enabled` today.

---

## Final Principle

> SWARNOVA should feel like a luxury jewellery house that happens to have
> extraordinary technology. The technology should enhance the luxury —
> never overpower it.

Phase 14.4 delivers exactly this: a cinematic hero that fades in over a
still poster, a brand film that invites rather than shouts, an AI atelier
and virtual fitting room that feel like craft rather than loading bars,
and product interactions that are felt rather than seen. Eighty percent of
the page is still the calm, editorial, typographically rooted storefront
customers already recognise; the twenty percent that moves does so
slowly, elegantly, and for a reason.
