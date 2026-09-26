# PHASE 14.4A — Cinematic Homepage Hero Video Experience

**Reconciliation document · Swarnova**
Date: 2026-09-26 · Branch: `arena/01a0dd6f-swarnova`
Scope: the homepage hero only. No product-hover video, no craftsmanship film,
no AI/Try-On motion, no backend, no Phase 15.

---

## 0. Headline: what is and is not delivered

| | Status |
|-|--------|
| Four-film hero reel architecture (records, resolution, rotation, crossfade, mobile source, poster-first, autoplay fallback, reduced motion) | **Done**, tested, measured in a real browser |
| Abstract champagne-gold hero animation + Ken Burns drift | **Removed** from the hero |
| Four poster / keyframe stills matching the existing hero | **Done** (Signature = existing `hero.avif`; three new keyframes) |
| Exact generation prompts + encoding spec for the four films | **Done** — `src/mock/assets/videos/homepage/hero-reel/README.md` |
| **The four real campaign MP4 files** | **Not delivered — must be supplied** |

**Why the films are missing.** This environment has image generation but **no
video-generation capability**. The brief says: if real video generation is
unavailable, *do not fake it*. So no film was synthesized from stills, no CSS
motion was added, and no pan/zoom-over-a-photo was shipped. All eight footage
slots (4 × desktop, 4 × mobile) are `null` in `src/mock/assets/index.js`, and
the hero shows the existing Signature campaign photograph, **still**, until real
footage is added. Filling one slot makes the hero play that film; filling two or
more turns rotation on. No UI change is needed.

---

## 1. The four hero films

| # | id | Title | Mood | Poster / start frame |
|---|----|-------|------|----------------------|
| 1 | `signature-gold` | Signature Gold | Timeless · Elegant · Premium | `images/homepage/hero.avif` (existing hero, unchanged) |
| 2 | `bridal-gold` | Bridal Gold | Bridal · Rich · Elegant | `images/homepage/hero-reel/bridal-gold-poster.avif` |
| 3 | `contemporary` | Contemporary | Modern · Minimal · Premium | `images/homepage/hero-reel/contemporary-gold-poster.avif` |
| 4 | `heritage-statement` | Heritage Statement Gold | Heritage · Timeless · Luxury | `images/homepage/hero-reel/heritage-gold-poster.avif` |

Each record targets 10 s (8–12 s allowed). Rotation order: 1 → 2 → 3 → 4 → 1.

## 2. Visual direction

The existing hero photograph is the reference: model in the right ~45% of a
roughly 2:1 frame, face in the upper third, plain warm taupe backdrop filling
the left half behind the copy, burgundy silk, 22K yellow gold, soft warm key
light from the right. The three new keyframes (1600×791 AVIF, 22–43 KB) were
composed to that same frame so that:

* the headline area on the left never has a face, bright jewellery or
  high-contrast detail behind it (text-safe area kept);
* the existing crop focal points (`64% 26%` below 1280 px, `18% 30%` from
  1280 px) work unchanged for every film;
* a dissolve between films reads as one campaign, not a slideshow.

They double as **image-to-video start frames**: each film should be generated
from its poster so the first frame matches it and the crossfade is seamless.
Prompts, camera moves, composition rules and the ffmpeg encode are in
`src/mock/assets/videos/homepage/hero-reel/README.md`.

## 3. Assets

Added
* `src/mock/assets/images/homepage/hero-reel/{bridal,contemporary,heritage}-gold-poster.avif`
* `src/mock/assets/videos/homepage/hero-reel/README.md` (slot table, spec, prompts, acceptance checks)

Removed
* `src/mock/assets/videos/homepage/hero-cinematic.mp4` and
  `hero-cinematic-mobile.mp4`. These were the abstract champagne-gold
  placeholder films, which is exactly the look this brief rejects.

Unchanged: `videos/editorial/art-of-gold.mp4` (brand film, out of scope).

## 4. Media contract (reused, not replaced)

Hero section content (`mock/data/homepage/index.js`):

```js
rotation: { enabled: true, maxClipMs: 14000, crossfadeMs: 1800 },
videos: [
  { id, title, mood,
    src, mobileSrc, poster, alt,            // shared contract
    autoplay: true, loop: true, muted: true, playsInline: true,
    placement: "hero",
    targetDurationSec: 10,
    focal: { mobile: "64% 26%", desktop: "18% 30%" } },
  … × 4
]
```

`image` (the Signature still + alt) is kept as the section's poster and
fallback. Data flow is unchanged:

```
HeroSection (UI)
  → HomePage (page, section registry)
  → useHomepage → contentService → DataProvider → mockProvider → mock data
HeroSection → useHeroReel (hook) → heroReelService (pure rules)
```

* `services/heroReelService.js` has only pure functions: `normalizeHeroVideo`
  (always forces `muted` and `playsInline`, and falls back to the section
  poster), `resolveHeroVideoSource` (mobile prefers `mobileSrc`, falls back to
  `src`), `resolveHeroReel` (picks poster or video mode, the playable records
  and whether rotation is on), `nextHeroIndex`.
* `hooks/useHeroReel.js` holds the browser state: reduced motion, the 767 px
  viewport breakpoint, runtime failures, the active index, the outgoing layer
  and the watchdog timer.
* No UI, hook or service file imports `mock/assets` or `mock/data`, and none
  of them contains a hard-coded `.mp4` path. A test enforces this.

## 5. Playback

* The poster `<img>` is **always** rendered first (`fetchPriority="high"`),
  outside every conditional, so it is the first paint and the permanent
  fallback.
* Only the active film is mounted, through the existing `CinematicVideo`
  primitive: muted, `playsInline`, `autoplay`, `preload="auto"`. It becomes
  visible only on the browser's real `playing` event (the Hotfix 2 state
  machine is unchanged).
* **Rotation** (≥ 2 playable films): clips don't loop. On `ended` the hook
  advances. The outgoing clip stays on its final frame (new
  `holdFinalFrame` prop; paused) while the incoming poster and film fade in
  above it over 1.8 s (`heroReelDissolve`, opacity only). Then the outgoing
  layer is unmounted. A 14 s watchdog advances if `ended` never fires.
* **One playable film**: it loops. **None**: poster only, no `<video>` in the
  DOM.
* **Decode or network error**: that record is marked failed and drops out of
  the rotation. If none are left, the poster stays.
* **Autoplay refused**: the existing restrained gold play button appears over
  the poster. Tapping it plays the film.
* **Indicators**: four 20 px hairlines, bottom right, `aria-hidden`, not
  clickable. They only appear while rotation is running.

`CinematicVideo` changes (additive): `holdFinalFrame` and `onEnded` props.
`position={null}` now leaves `object-position` to CSS, so the hero's
breakpoint focal rules (and each record's `focal` values via
`--hero-focal` / `--hero-focal-desktop`) actually apply to the video. Before
this, the inline default overrode the CSS rule at 1280 px and above.

## 6. Mobile

`mobileSrc` is picked by the reel service on the same `(max-width: 767px)`
breakpoint `CinematicVideo` uses. It is read synchronously on first render, so
a phone never starts downloading the desktop file first. The hero composition
CSS (Phase 14.1) is unchanged: copy in normal flow, cover crop, focal
`64% 26%` below 1280 px.

## 7. Reduced motion

`usePrefersReducedMotion` now reads `matchMedia` **synchronously** on first
render, so a reduced-motion visitor never gets an autoplaying frame before the
effect runs. With reduced motion on, the reel forces poster mode: static
photograph, no `<video>`, no autoplay, no dissolve, no indicators.

## 8. Abstract animation removed

The hero no longer uses the champagne-gradient clip, `.motion-ken-burns`,
shimmer, particles or light sweeps. The copy's existing one-time staggered
entrance (`.motion-reveal`) is kept as the only UI transition. The
`.motion-ken-burns` utility still exists in `index.css`, but nothing in the
hero uses it.

## 9. Homepage console

* `ReferenceError: Link is not defined` (NewsletterSection): stays fixed. It
  uses `ContentLink`, and a regression test guards it.
* Favicon: the inline SVG icon is declared, and the browser made no
  `favicon.ico` request (measured).
* Measured on `/` at 1280 / 768 / 375 px, in dev and in the production build:
  **0 page errors, 0 ReferenceError / TypeError / unhandled rejections**. The
  one console error is `fonts.googleapis.com`, which is blocked by this
  sandbox's network egress rules, not by the app.

## 10. Performance

* No video is fetched today (slots are null).
* When footage exists, exactly one clip is mounted as a playing video. The
  next clip isn't mounted until it becomes active. During the 1.8 s dissolve
  two elements exist, but only one is playing (measured: max 2 mounted,
  1 playing).
* Poster first, compressed H.264 MP4 spec (≤ 5 MB desktop / ≤ 2.5 MB mobile,
  no audio, faststart, 1 s GOP), mobile variant.
* Build: `dist/index.html` is 5.32 MB (was 5.49 MB). The two abstract MP4s
  were removed and three AVIF posters (about 99 KB) were added.
* **Caveat (architectural, not in scope):** the build uses
  `vite-plugin-singlefile`, which base64-inlines every imported asset. Four
  campaign films plus mobile variants (about 20–30 MB) should **not** be
  imported into this bundle. Production should serve them as CDN URLs from
  the API/CMS. The contract already carries plain URL strings, so that is a
  data change only.

## 11. Tests

```
npm test  → # tests 261  # pass 261  # fail 0     (baseline 243)
```

New: `src/__tests__/phase14-4a-hero-reel.test.mjs` (18 tests):
four records in order; full contract on every record; posters present;
unfilled slots are `null` or a real `hero-reel/*.mp4` import (never the
abstract placeholder); desktop/mobile source resolution; normalisation forces
muted/inline; poster mode with no footage (no `<video>`); a failed record
drops out and the poster stays; video mode renders exactly one `<video>` with
`autoplay`, `playsinline`, `preload="auto"`, poster, no loop while rotating;
a single film loops; the mobile viewport renders `mobileSrc`; rotation
1→2→3→4→1 and skipping of undelivered films; slow dissolve keyframes; reduced
motion gives poster only with no autoplay; no Ken Burns/shimmer classes in
the hero; no mock asset leakage into components/pages/hooks/layouts/features/
reel service; homepage document resolves through the provider with the hero
first; the hero renders copy/CTAs/trust line in 9 mode × viewport
combinations with zero React errors; Link and favicon regressions.

**Existing assertions updated because the brief supersedes them.** Twenty
assertions in `phase14-4-motion-cinematic`, `phase14-4-video-playback-hotfix`
and `phase14-4-hotfix2-playback` pinned the hero to
`media.heroCinematicVideo` / `hero-cinematic*.mp4`, the abstract placeholder
this phase must remove. They were **retargeted, not deleted**:

* They now assert that the placeholder stays gone.
* They assert that the reel slots and resolved sources are wired.
* The structural MP4 checks (dimensions, frames, profile, IDR, faststart,
  size) still run in full against the remaining brand-film clip.
* The reduced-motion and poster assertions now point at the reel resolver.

No assertion about `CinematicVideo`'s state machine was relaxed.

```
npm run build → ✓ built in ~4 s · dist/index.html 5,320.61 kB (gzip 3,434.79 kB)
```

## 12. Browser validation

Real browser: **HeadlessChrome/153.0.8010.0**, which reports H.264, VP9 and
AV1 as `probably`, driven by Puppeteer against the Vite dev server (and the
production build for the console check).

### 12.1 Shipped homepage (no footage delivered)

| viewport | mode | `<video>` | Ken Burns | title box | CTA box | trust line | page errors | favicon.ico |
|----------|------|-----------|-----------|-----------|---------|------------|-------------|-------------|
| 1280×800 | poster | 0 | 0 | 48,228 520×188 | 48,589 | y 678 | 0 | not requested |
| 768×1024 | poster | 0 | 0 | 32,292 | 32,538 | y 627 | 0 | not requested |
| 375×812  | poster | 0 | 0 | 20,180 335×112 | 20,489 | y 643 | 0 | not requested |
| 1280 reduced-motion | poster | 0 | 0 | same | same | same | 0 | — |

Visually confirmed at 1280 px and 375 px: woman, face, earrings and necklace
all visible; the copy sits on the plain backdrop and is readable; nothing is
clipped. Clicking *Explore Collections* went to `/#collections`.

### 12.2 Reel engine: diagnostic harness

With no campaign footage, "video is moving" cannot honestly be shown on `/`.
To measure the engine itself, a throwaway harness (not committed) mounted the
**real** `HeroSection` with the **real** hero record, replacing only
`src`/`mobileSrc` with 3-second diagnostic clips. These clips are slow zooms
over the four posters. They exercise playback only and are **not** proposed
as footage.

```
1280px  t0: currentSrc /…/signature-gold.mp4  readyState 4  paused false
            muted true  playsInline true  loop false  currentTime 2.425
            duration 3  960×540  state "playing"
        t1: currentTime 3.000                    ADVANCING = true
        rotation: signature-gold → bridal-gold → contemporary →
                  heritage-statement → signature-gold
        max <video> mounted 2 (during dissolve) · playing at once 1 · errors 0

375px   t0: currentSrc /…/signature-gold-mobile.mp4  readyState 4
            paused false  currentTime 1.535  duration 3  360×640
        t1: currentTime 2.538                    ADVANCING = true
        rotation: 1 → 2 → 3 → 4 → 1 · playing at once 1 · errors 0

reduced motion        → mode poster, 0 <video>
autoplay refused      → state "blocked", play button shown, poster opacity 1
   tap play           → state "playing", paused false, currentTime 1.51
all sources 404       → failed records dropped → mode poster, 0 <video>,
                        poster loaded
```

A screenshot taken mid-rotation showed the 1.8 s dissolve from the Signature
film's last frame into the Bridal film, with the headline still readable
throughout.

**Repeat on `/` once real footage is in:**

```js
const v = document.querySelector(".hero video");
v.currentSrc; v.readyState; v.paused; v.duration;
const t = v.currentTime; await new Promise(r => setTimeout(r, 1000));
v.currentTime > t;                                  // true
document.querySelector("section.hero").dataset.heroActive; // changes every ~10 s
```

## 13. Limitations

1. **No real hero footage exists yet.** Until the four films (plus mobile
   variants) are delivered and dropped into the slots, the hero is the static
   Signature photograph. That is intended, and it is not the final visual
   target.
2. The three new posters are AI-generated keyframes matched to the existing
   hero. Final films may come with their own graded first frames. Replace the
   posters with those frames so the dissolve stays seamless.
3. Only Chromium was used for validation (no Safari/Edge in this sandbox).
   Muted, inline, H.264 autoplay is supported on both. Repeat §12's
   `currentTime` check there.
4. Real campaign files should be served as URLs, not bundled (see §10).
5. Google Fonts is blocked by this sandbox's egress rules. That causes one
   unrelated console error here and a fallback serif in the screenshots.

## 14. Phase boundary

Stopped after 14.4A. No product hover video, craftsmanship film, new AI or
Try-On animation, backend, or Phase 15 work.
