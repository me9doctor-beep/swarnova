# PHASE 14.4A — FINAL · Real Hero Footage Integrated + Validated

**Reconciliation document · Swarnova**
Date: 2026-09-26 · Branch: `arena/01a0de11-swarnova`
Scope: integrate the supplied cinematic hero footage into the existing Phase
14.4A hero-reel implementation and validate it end to end. No redesign, no
new video/media system, no synthetic motion, no Phase 14.4B.
**Follow-up (same day):** the dissolve was reworked to a *motion-to-motion*
crossfade so the rotation no longer reads as "changing videos" — see §5b.

---

## 0. Headline

| | Status |
|-|--------|
| Four real campaign MP4s supplied and mapped to the four hero slots | **Done** — filenames matched the slot contract 1 : 1 |
| Hero visibly plays the real footage (poster → film → rotation) | **Done, measured in a real browser** |
| `currentTime` actually advances (t₂ > t₁) | **True** — on desktop, mobile and the production build |
| Four-film rotation, one film playing at a time | **Done** — order and timing measured over 52 s + 46 s watches |
| **Seamless motion-to-motion dissolve (follow-up request)** | **Done** — next film staged + playing before it fades in, outgoing film still moving; measured |
| Desktop (1280 / 1536) + mobile (375 / 768) validation | **Done** |
| Poster fallback, autoplay fallback, reduced motion, error recovery | **All verified in the browser** |
| `npm test` / `npm run build` | **262 / 262 pass · build ✓** |
| Phase 14.4B | **NOT started** (see §17) |

The **only code change** in this phase is the repair of
`src/mock/assets/index.js` (plus a factual update to the footage README).
The footage push had left that file syntactically broken — all four imports
used the same identifier:

```js
import heroReelSignatureVideo from "./videos/homepage/hero-reel/signature-gold.mp4";
import heroReelSignatureVideo from "./videos/homepage/hero-reel/bridal-gold.mp4";      // ✗ duplicate
import heroReelSignatureVideo from "./videos/homepage/hero-reel/contemporary.mp4";     // ✗ duplicate
import heroReelSignatureVideo from "./videos/homepage/hero-reel/heritage-statement.mp4"; // ✗ duplicate
```

The app could not even parse. It now reads one import per slot, with the
mobile slots explicitly `null` (nothing was delivered for them). No other
file in the application changed.

---

## 1. Supplied video files

Location: `src/mock/assets/videos/homepage/hero-reel/`

| file | bytes | mapped slot |
|------|-------|-------------|
| `signature-gold.mp4` | 2,538,256 (2.42 MB) | 1 · Signature Gold |
| `bridal-gold.mp4` | 4,907,811 (4.68 MB) | 2 · Bridal Gold |
| `contemporary.mp4` | 2,166,325 (2.07 MB) | 3 · Contemporary |
| `heritage-statement.mp4` | 3,198,805 (3.05 MB) | 4 · Heritage Statement Gold |

The expected contract also lists a `-mobile.mp4` per slot. **No mobile files
were supplied**, so those slots remain `null` and the existing service rule
applies (mobile prefers `mobileSrc`, falls back to `src`):
narrow viewports play the desktop film, cover-cropped by the hero's mobile
focal point (`64% 26%`). Filenames matched the contract exactly — nothing was
renamed.

## 2. Slot mapping + media integration

```
src/mock/assets/index.js            ← only file changed
  import heroReelSignatureVideo     from "./videos/homepage/hero-reel/signature-gold.mp4";
  const  heroReelSignatureMobileVideo     = null;   // not delivered
  import heroReelBridalVideo        from "./videos/homepage/hero-reel/bridal-gold.mp4";
  const  heroReelBridalMobileVideo        = null;   // not delivered
  import heroReelContemporaryVideo  from "./videos/homepage/hero-reel/contemporary.mp4";
  const  heroReelContemporaryMobileVideo  = null;   // not delivered
  import heroReelHeritageVideo      from "./videos/homepage/hero-reel/heritage-statement.mp4";
  const  heroReelHeritageMobileVideo      = null;   // not delivered
```

The existing architecture is untouched — the UI still never imports an MP4:

```
HeroSection (UI)  →  useHeroReel (hook)  →  heroReelService (pure rules)
HomePage → useHomepage → contentService → DataProvider → mockProvider
        → mock/data/homepage/index.js (unchanged) → media.heroReel*Video
```

No second media system was created; `mock/data/homepage/index.js`, the
provider, the hook, the service, `CinematicVideo`, the hero CSS and all hero
copy/CTAs/spacing are byte-identical to the reviewed Phase 14.4A
implementation. The phase-14.4A test that pins the slot syntax ("`null` **or**
a real `hero-reel/*.mp4` import") passes as-is.

## 3. Technical video validation

Parsed with the repository's own ISO-BMFF reader
(`src/__tests__/support/mp4.mjs`) plus a box-level scan — no re-encode was
performed on the production footage.

| | signature | bridal | contemporary | heritage |
|-|-----------|--------|--------------|----------|
| container / brand | MP4 · `ftyp isom` (`isom iso2 avc1`) | same | same | same |
| codec | H.264 **High** (profile 100) level 3.1 | same | same | same |
| pixel format | yuv420p (implied by H.264 High/AVC1) ✓ | ✓ | ✓ | ✓ |
| dimensions | 1280×720 (16:9) | 1280×720 | 1280×720 | 1280×720 |
| duration | 10.000 s | 10.000 s | 10.000 s | 10.000 s |
| frames / fps | 240 · 24 fps constant | 240 · 24 | 240 · 24 | 240 · 24 |
| faststart (moov before mdat) | ✓ | ✓ | ✓ | ✓ |
| first sample | SEI + IDR keyframe ✓ | ✓ | ✓ | ✓ |
| bitrate | 2.03 Mbps | 3.93 Mbps | 1.73 Mbps | 2.56 Mbps |
| audio track | AAC 48 kHz present | present | present | present |

Browser decode compatibility was verified for real: the engine reports
`canPlayType('video/mp4; codecs="avc1.42E01E"') → "probably"` and all four
files decode and play to `ended` (see §5–§6).

**Deviations from the footage spec (reported, not "fixed" — the brief forbids
unnecessarily re-encoding production footage):**

1. **Audio tracks are present** (spec: none, `-an`). Playback is `muted` by
   contract, so nothing is audible and no autoplay policy is affected; the
   track only costs a few KB. Ask the supplier for `-an` cuts next time.
2. **One keyframe per clip** (stss = 1, GOP = the whole 10 s; spec asked for
   ~1 s GOP). Linear playback and `ended`-driven rotation are unaffected;
   only mid-clip seeking is slightly heavier.
3. **1280×720** rather than 1920×1080/1600×900. Still 16:9, still
   `object-fit: cover`; the 1536 px hero upscale is 1.2× — visually fine.
4. Bridal at 3.93 Mbps / 4.68 MB is inside the ≤ 5 MB budget; all others are
   comfortably under.

## 4. Desktop validation (real browser)

Engine: headless Chromium 153 (Playwright-driven, SwiftShader GL), H.264
supported. Viewports: **1280×800** and **1536×960**, Vite dev server.

### 4.1 Real playback values (the brief's exact recipe)

```
const v = document.querySelector(".hero video");

Hero @ 1280×800, film 1:
currentSrc:        http://127.0.0.1:5173/src/mock/assets/videos/homepage/hero-reel/signature-gold.mp4
readyState:        4 (HAVE_ENOUGH_DATA)
paused:            false          muted: true      loop attr: false
duration:          10.005 s       decoded size:    1280×720
playbackState:     "playing"      v.error:         null
currentTime before: 1.874367
currentTime after:  2.880646   (1 s later)
t2 > t1  →  TRUE ✓ (frames visibly advance — see §4.3)
```

Identical behaviour at 1536×960 and on the production build (data-URI source,
`duration 10.005`, `2.706 → 3.811`, ADVANCING = true).

### 4.2 Composition, text, CTA

| check | 1280×800 | 1536×960 |
|-------|----------|----------|
| hero mode / active | `video` / `signature-gold` | `video` |
| `<video>` mounted / playing | 1 / 1 | 1 / 1 (2 mounted only during the dissolve) |
| headline box | x 48 · w 520, visible | visible |
| CTAs | primary + secondary in viewport | in viewport |
| trust line | visible | visible |
| horizontal overflow | none (scrollWidth = 1280) | none |
| hero height | 773 px | 773 px |
| title contrast vs media+veil (measured per film, p25/p75) | 7.8–10 : 1 | 5.7–10 : 1 (all four films ≥ AA) |

Crop math (desktop focal `18% 30%`, `object-fit: cover`): at 1280 px the film
fills the height and ~6.8 % of its right edge is cropped, exactly as the
poster `<img>` is cropped by the same rule — the frame the customer saw
before is the frame the film now occupies. At 1536 px the film fills the
width and ~3 % top / ~7 % bottom are trimmed (face stays in the upper third).

### 4.3 Visual quality — measured, not assumed

Because this sandbox is headless, the §7/§19 eyeball checks were performed as
quantitative frame analysis in the page itself (canvas over the decoded
frames and over rendered-hero screenshots; screenshots are saved under
`/home/user/hero-validation/` for human review):

* **It is real footage, not abstract motion**: every film changes frame-to-
  frame continuously (mean per-second frame delta 5–31/255 across all four
  clips, no frozen spans, no cut-level jumps); colour census shows 150–235 distinct
  quantised colours per frame — a gradient/shimmer fake collapses to a
  handful. No Ken Burns class is applied to the hero (test-enforced).
* **Camera movement is visible and smooth**: block-matched global motion per
  second stays within ±10 px on a 320 px-wide sample — small, continuous,
  direction-consistent per film (Heritage drifts left-and-down steadily,
  Bridal trucks up-left, Contemporary sits nearly still, Signature breathes
  around centre): the slow push-ins/arcs the campaign asked for, with no
  whips or snap-zooms.
* **Model right, negative space left** (text-safe): right-half edge energy is
  9.6–21.7× the left half in every film (e.g. Signature 2675 vs 279); left-half
  luminance stays soft under the veil, giving the title 5.7:1–10:1 contrast.
* **Jewellery present**: warm specular pixels concentrate in the model's
  half (e.g. 31 % of right-half pixels in Signature's first frame); warm
  palette (champagne/burgundy/gold) dominates all four films (58–96 % warm
  pixels), and Heritage reads deliberately low-key (mean luma ≈ 71).

## 5. Rotation

Watched for 52 s at 1536×960 (attribute `data-hero-active` polled 5×/s):

```
signature-gold → bridal-gold → contemporary → heritage-statement → signature-gold → bridal-gold
   t ≈ 0.0 s       10.2 s        20.4 s         30.5 s             40.7 s          50.9 s
```

* Order 1 → 2 → 3 → 4 → 1 ✓, ~10 s per film (`ended`-driven, 14 s watchdog
  unused), opacity-only dissolve (`heroReelDissolve`) — no carousel
  movement, no slide, no scale.
* **Max 2 `<video>` elements ever mounted**; one film is the experience at
  any moment (see §5b for the deliberate dissolve overlap).
* MP4 network events during the watch: one request per film, each issued
  only when that film is staged/active (§8) — never two concurrent fetches.

## 5b. Follow-up — the seamless motion-to-motion dissolve

**Request:** *"more smooth transition between the video so it will not look
like we are changing multiple videos."*

**Diagnosis.** The original dissolve was a *freeze-frame* crossfade: the
outgoing film ended (froze on its final frame), then the incoming layer —
which initially showed its **poster** — faded in over it, and only after the
browser's `playing` event did real footage appear. The customer saw
*moving → frozen → still poster → moving*: a slideshow signature, exactly
what "changing videos" looks like.

**Fix — one continuous campaign film (architecture unchanged, timing
reworked):**

1. **Stage** (`stageLeadMs = 3200` before the active film ends): the next
   film is mounted *invisibly* (`.hero__reel-layer--staged`: opacity 0,
   pointer-events none) with `preload="auto"`, so it is fully buffered
   before it is needed.
2. **Dissolve** (`crossfadeMs = 2200` before the end): the staged film
   starts playing and dissolves in **while the active film is still
   playing** — motion blending into motion, the way a campaign reel is cut.
3. **Handoff** (at `ended`): the active film ends *exactly as the dissolve
   completes* — it was moving for every frame it was on screen — and is
   unmounted after the fade. `ended` (with the 14 s watchdog as backstop)
   still drives promotion, so a stalled film can never stall the reel.

Supporting changes: the dissolve easing moved from a fast-arrive ease-out
to a symmetric S-curve (`--ease-dissolve: cubic-bezier(0.37, 0, 0.63, 1)`);
staging is driven by the active film's **real playhead** (`timeupdate` via a
new `onProgress` callback on `CinematicVideo`), not wall-clock timers, so
the timing self-corrects even though each film begins playing during its
own dissolve; and the staged film never takes the pointer or shows a play
button while hidden.

**Measured in the browser (46 s watch, 1280×800):**

```
per transition (all four observed):
  staged mounted   3.52 s before promotion   (stageLead 3.2 s + 0.3 s grace)
  dissolve began   2.48 s before promotion   (crossfade 2.2 s + 0.3 s grace)
  outgoing film    ADVANCING during dissolve: 24 of 25 samples moving
                   (the 25th is the ended frame itself — it ends exactly as
                   the dissolve completes, fully covered)
  incoming film    already playing at promotion: currentTime ≈ 2.5 s,
                   paused = false — never a poster still
rotation           signature → bridal → contemporary → heritage → signature → bridal
max <video>        2 mounted (staged/previous + active)
fetches            one film at a time — each film is fetched at its staging
                   moment, ~7 s apart, never two concurrent downloads
```

**Pixel-level smoothness** (consecutive hero screenshots across the
dissolve, mean abs delta 0–255):

```
6.4 → 31.5 → 18.3 → 16.5 → 14.0 → 12.9   (per ~170 ms sample)
```

A hard cut shows one enormous delta sandwiched between tiny ones; this is
the S-curve profile of a true cross-dissolve — slow start, steepest middle,
gradual settle — with change distributed across the whole 2.2 s window
(max/mean ratio 1.72, no discontinuity). Mid-dissolve, the incoming layer
is already at `data-playback-state "playing"` by the time it reaches 13.6 %
opacity — the poster is never seen.

**"Only one video plays at a time"** — outside the 2.2 s dissolve window
exactly one video plays and one film is fetched at a time. During the
dissolve itself the outgoing and incoming films deliberately overlap (both
muted, the outgoing fully covered as it ends): that overlap *is* the
smoothness the follow-up asked for, and it is the standard technique for
rotating campaign reels. If a stricter interpretation is ever required, the
overlap can be removed by shortening `crossfadeMs` — a data change only.

**Graceful degradation (unchanged paths, re-verified):** reduced motion →
poster, zero `<video>`; blocked autoplay → subtle gold fallback, tap plays;
all films 404 → poster hero; a film that fails mid-rotation drops out and
the staged next film self-heals around it.

## 6. Mobile validation

| | 375×667 | 768×1024 |
|-|---------|----------|
| `v.currentSrc` | `…/hero-reel/signature-gold.mp4` — the desktop file, correctly selected via the `mobileSrc → src` fallback (no mobile variants delivered) | same |
| readyState / paused / state | 4 / false / "playing" | 4 / false / "playing" |
| currentTime 1 s apart | 1.977 → 2.985 **ADVANCING = true** | 1.970 → 2.974 **true** |
| headline / CTA / trust line | visible · 335 px wide | visible · 520 px wide |
| horizontal overflow | **none** (scrollWidth 375 = innerWidth) | **none** |

Mobile crop (focal `64% 26%`): the 16:9 film covers the 0.52:1 phone hero by
height, showing x ≈ 45–75 % of the frame at full height — the model's
face/necklace region. Verified per film by edge-energy grids of the rendered
hero: the strongest-detail cell is the top-middle for **all four** films
(subject inside the crop, face in the upper third, nothing important
cropped).

## 7. Poster → first-frame transition

Each film's first decoded frame was compared with its slot poster under the
hero's own cover-crop geometry (posters are ≈ 2.06:1, films 16:9):

| film | mean Δ (0–255) | SSIM | verdict |
|------|----------------|------|---------|
| signature-gold | 23.4 | 0.581 | same composition & grade, no jump |
| bridal-gold | 17.9 | 0.671 | closest match |
| contemporary | 23.0 | 0.580 | same composition & grade |
| heritage-statement | 21.2 | 0.509 | same composition & grade |

For scale, the poster↔**last**-frame SSIM is 0.02–0.53 — the films
demonstrably open *at* their poster keyframe and drift from there, which is
what image-to-video from the start frame should do. The 700 ms poster→video
reveal plus the 1.8 s reel dissolve absorb the residual softness (720p
generation vs the 2.06:1 poster). **No poster → jump → different-first-frame
 discontinuity**; the numbers and saved screenshots support "the photograph
comes alive". A final human pass on a colour-accurate display is recommended
(§18) since this environment is headless.

## 8. Network validation

Full `GET` (curl) against the dev server:

| URL | status | Content-Type | size |
|-----|--------|--------------|------|
| `/src/mock/assets/videos/homepage/hero-reel/signature-gold.mp4` | **200** | `video/mp4` | 2,538,256 |
| `…/bridal-gold.mp4` | **200** | `video/mp4` | 4,907,811 |
| `…/contemporary.mp4` | **200** | `video/mp4` | 2,166,325 |
| `…/heritage-statement.mp4` | **200** | `video/mp4` | 3,198,805 |

In-page, the browser issues `Range` requests and receives **206 Partial
Content** (`video/mp4`) — normal, successful video streaming. Request
timeline during rotation: one film at a time, ~10 s apart; no 404, no 500,
no invalid URL, no failed media request. No `favicon.ico` request occurs
(the inline SVG icon is used). The only failed request in the whole session
is `fonts.googleapis.com` — blocked by this sandbox's egress rules, unrelated
to the application, and equally present on the production build.

## 9. Autoplay + fallback

* Normal engine: the film autoplays **muted, inline** — verified (state
  `playing`, no tap needed). Unmodified Chromium never refuses muted inline
  autoplay, so the blocked path was exercised the way a real block presents
  itself: the engine's attribute-autoplay was suppressed and `play()` was
  rejected once with `NotAllowedError`.
* Result: playback state **`blocked`**, `paused true`, `currentTime 0`,
  poster fully visible, and the **existing subtle fallback** appears — a
  64 px gold circle on a full-bleed tap target (not a large play button).
* Clicking it: state `playing`, `paused false`, `muted true`, fallback
  dismissed, `currentTime 1.472 → 2.475` — **ADVANCING = true** ✓.

## 10. Reduced motion

`prefers-reduced-motion: reduce` (emulated):

* hero mode **`poster`**, **zero** `<video>` elements, no autoplay attribute;
* animation inventory of the whole hero: only `motionReveal` entries with
  duration clamped to **0.001 ms** by the global reduced-motion rule — i.e.
  static; no decorative animation runs;
* normal (`no-preference`) on the same build: `mode=video`, playing — the
  two modes are genuinely distinct, not all-browsers-reduced.

## 11. Video failure fallback (injected)

* **One film 404** (`signature-gold.mp4` route → 404): the record is marked
  failed and drops out; the reel continues with the remaining three
  (`bridal-gold` playing); the unconditional poster `<img>` stays intact.
* **All four films 404**: hero mode **`poster`**, `<video>` removed, poster
  visible and complete, headline/CTAs/trust line intact — no black
  rectangle, no broken-media icon, no empty background. Console shows only
  the browser's own network-layer 404 lines for the requests the test
  itself sabotaged; **zero application errors**.

## 12. Console

Homepage `/` (dev and production build, 1280/1536/768/375):

* `ReferenceError: Link is not defined` — **does not return** (regression
  test also green);
* React runtime errors / TypeErrors / unhandled rejections: **0**;
* failed hero video requests: **0** (outside the deliberate §11 sabotage);
* favicon request: **none**;
* Google Fonts `net::ERR_CONNECTION_CLOSED` — sandbox egress block only;
  unrelated to the app, documented here per the brief.

## 13. Performance

* **Only one film is fetched and decoded at a time** — outside the 2.2 s
  dissolve window exactly one `<video>` plays. The next film is mounted at
  its staging moment (~3.2 s before it becomes visible), by which time the
  active film's own fetch completed long before; fetches never overlap
  (measured: single 206 per film, ~7 s apart). During the dissolve two
  elements exist and both are playing — that overlap is the crossfade
  itself (§5b). Poster-first, `preload="auto"` for the active/staged film /
  `"none"` for the outgoing layer — no new JS preload penalty.
* Production build inlines the four films as base64 data URIs
  (`vite-plugin-singlefile`, the repo's standing convention):
  `dist/index.html` **22,448 kB (gzip 16,280 kB)**. The production-build
  playback/rotation checks still pass (§4.1, §5). As already recorded in
  the Phase 14.4 reconciliation, real deployments should serve campaign
  footage as CDN/DAM URLs through the API instead of bundling — the media
  contract already carries plain URL strings, so that remains a data-only
  change.

## 14. Tests

```
npm test   →  # tests 262   # pass 262   # fail 0
```

No existing assertion was weakened. One whitespace-sensitive regex
(`\n            muted\n            playsInline\n`) was relaxed to
indentation-agnostic because the reel-layer map gained a block body — the
asserted behaviour (the hero passes `muted` + `playsInline`) is unchanged.
One test was **added** ("the dissolve is motion-to-motion"): stage lead
must exceed the crossfade; staging/dissolve must be playhead-driven
(`handleActiveProgress`, `onTimeUpdate`/`onProgress`); the staged film must
play only once its dissolve begins; the staged layer must be invisible and
non-interactive; the dissolve easing must be the symmetric S-curve.

## 15. Build

```
npm run build → ✓ 2236 modules transformed · built in 7.2 s
                dist/index.html  22,448.43 kB │ gzip 16,280.27 kB
```

(The size is the singlefile inlining described in §13.)

## 16. Files changed in this phase

| file | change |
|------|--------|
| `src/mock/assets/index.js` | repaired the pushed duplicate-import breakage → one correct import per desktop slot; mobile slots explicit `null` |
| `src/mock/assets/videos/homepage/hero-reel/README.md` | header updated: desktop films delivered + integrated; mobile variants pending |
| `src/services/heroReelService.js` | rotation defaults: `crossfadeMs` 1800 → 2200, new `stageLeadMs` 3200, motion-to-motion docs |
| `src/hooks/useHeroReel.js` | staged-film state, playhead-driven staging/dissolve (`handleActiveProgress`), promotion keeps the entering state |
| `src/pages/customer/home/components/HeroSection.jsx` | third layer role (`staged`), role-aware props (`autoplay`, `showPlayFallback`, `onProgress`), `data-hero-staged` |
| `src/components/ui/CinematicVideo.jsx` | new optional `onProgress(currentTime, duration)` wired to `timeupdate` |
| `src/index.css` | `.hero__reel-layer--staged` (invisible, no pointer), `--ease-dissolve` S-curve token, dissolve docs |
| `src/mock/data/homepage/index.js` | rotation data: `crossfadeMs: 2200, stageLeadMs: 3200` + docs |
| `src/__tests__/phase14-4a-hero-reel.test.mjs` | +1 test (motion-to-motion dissolve); one regex made indentation-agnostic |
| `frontend/PHASE_14_4A_RECONCILIATION.md` | this document |

Untouched, as required: authentication, Google OAuth, RBAC, branch-scoped
staff authority, Super Admin / Admin / Employee surfaces, catalogue, cart,
checkout, orders, inventory, AI Studio, Virtual Try-On, intake workflows,
backend contracts, and every hero design element (typography, headline,
description, CTA, text position, spacing, height, identity).

## 17. Phase boundary — respected

Stopped after Phase 14.4A. **Not started**: product-card hover videos,
product hover animation, jewellery craftsmanship video, additional homepage
videos, AI animation changes, Virtual Try-On animation changes, Phase 15,
backend/API.

## 18. Remaining limitations

1. **No `-mobile` footage yet** — phones reuse the desktop film (crop
   verified safe); dedicated 9:16 or 720p centre-right cuts would sharpen
   the phone experience and cut its bytes.
2. **Supplied-file deviations** (§3): audio tracks present, single-keyframe
   GOP, 720p. All are supplier-side; none block playback. No production
   footage was re-encoded.
3. **Poster↔first-frame is compositional, not pixel-exact** (SSIM
   0.51–0.67) — expected from image-to-video generation; the dissolve
   covers it, but a graded exact-start-frame cut would make it perfect.
4. **Validation environment**: headless Chromium 153 only (no Safari /
   Firefox / Edge, no real display in this sandbox). All visual judgements
   were made by measurement (§4.3); the screenshots in
   `/home/user/hero-validation/` (desktop, mobile, blocked-autoplay,
   reduced-motion, all-fail, production build) are included for a human
   final look at the live hero.
5. **Single-file bundle size** (§13) — architectural, pre-existing, out of
   scope for 14.4A.
6. Google Fonts is blocked by sandbox egress — one unrelated console error
   here; loads normally elsewhere.
