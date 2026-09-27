# PHASE 14.4 VIDEO PLAYBACK HOTFIX 2 — Root Cause & Real-Browser Validation

Date: 2026-09-26
Branch: `arena/01a0dbe7-swarnova`
Scope: real browser playback + homepage console cleanup + favicon cleanup.
No new features, no redesign, no RBAC / commerce / auth changes.

---

## 0. Headline

The hero was static because **the placeholder MP4s were not decodable by any
browser**. They parsed as valid ISO-BMFF and returned HTTP 200, which is why the
previous hotfix concluded they were fine. Chromium rejected their packets with
`MEDIA_ERR_DECODE`, the hero's `onError` handler set `failed = true`, and the
`<video>` element was unmounted — leaving the poster `<img>` as the only thing
in the hero.

Everything below is measured, not inferred. Validation was performed by driving
a real browser (**HeadlessChrome/153.0.8010.0**) against the running Vite dev
server and against the production build.

---

## 1. Actual root causes

### 1.1 Hero static — the MP4s did not decode (primary)

Loading each placeholder directly into a bare `<video>` in the real browser:

```
/src/mock/assets/videos/homepage/hero-cinematic.mp4
  events fired : loadedmetadata, error
  readyState   : 1 (HAVE_METADATA)
  networkState : 1
  paused       : true
  duration     : 3
  videoWidth   : 64      videoHeight: 64
  currentTime  : 0  →  0      (never advanced)
  error.code   : 3 (MEDIA_ERR_DECODE)
  error.message:
    PipelineStatus::PIPELINE_ERROR_DECODE: Failed to send video packet for
    decoding: {timestamp=2000000 duration=1000000 size=6184 is_key_frame=1
    encrypted=0}
```

Identical failure for `hero-cinematic-mobile.mp4` (size=1552) and
`art-of-gold.mp4` (size=6184).

The container was structurally well-formed — `ftyp`/`moov`/`mdat`, one `stsd`
entry, `avcC` present, `moov` before `mdat` — and `loadedmetadata` fired, which
is exactly what the earlier structural checks tested. The H.264 *bitstream*
inside was not decodable. Container validity and decoder acceptance are two
different claims; only the first had been verified.

**Why that produced a static hero rather than a broken frame.** In
`CinematicVideo`, the video was rendered behind `effectiveSrc && !failed && …`.
The decode error fired `handleError` → `setFailed(true)` → the `<video>` was
removed from the DOM. Observed, before the fix:

```
document.querySelectorAll("video").length        === 1     // brand film only
document.querySelectorAll(".hero video").length  === 0     // hero had none
document.querySelector(".hero .cinematic-media-wrap")      // existed
  → innerHTML was a single <img class="cinematic-media … opacity-100">
matchMedia("(prefers-reduced-motion: reduce)").matches === false
```

So the hero rendered `CinematicVideo` (the wrap was present, proving
`hasVideo === true` and `video.src` was a valid string) but the video element
was gone. The `206 video/mp4` response for `hero-cinematic.mp4` in the network
log was the brief initial mount before the error landed.

### 1.2 Latent deadlock in the autoplay gate (fixed while in there)

The autoplay effect gated `video.play()` on `canPlay`, which was set only by
`canplay` / `loadeddata` / `canplaythrough`. The hero uses
`preload="metadata"`, and a media element at `HAVE_METADATA` is under no
obligation to fire `canplay` until playback is requested. That is a
self-sustaining deadlock: no `play()` → no buffering → no `canplay` → no
`play()`. It was masked by 1.1 (the element never got that far) and would have
become the next "static hero" report.

### 1.3 `ReferenceError: Link is not defined`

`src/pages/customer/home/components/NewsletterSection.jsx:28` rendered
`<Link to="/privacy">` with no import of `Link`. The project's routing
abstraction is `ContentLink` (which owns the `react-router-dom` `Link`
decision via `src/utils/links.js`); this file bypassed it and never imported
the identifier.

Confirmed in the real browser before the fix:

```
CONSOLE_ERROR: ReferenceError: Link is not defined
  The above error occurred in the <NewsletterSection> component. React will
  try to recreate this component tree from scratch using the error boundary
  you provided, ErrorBoundary.
```

It did not blank the page because `HomePage` wraps each section in its own
`ErrorBoundary` (`HomePage.jsx:96`), so only the newsletter section was
replaced. It was a genuine runtime error, independent of the video bug.

### 1.4 `GET /favicon.ico 404`

`index.html` declared no `rel="icon"`. When a document declares no icon,
browsers issue an implicit `GET /favicon.ico`. This project has no `public/`
directory and ships no `.ico`, so that request could only ever 404.

---

## 2. Fixes applied

| # | File | Change |
| - | ---- | ------ |
| 1 | `pages/customer/home/components/NewsletterSection.jsx` | `<Link to="/privacy">` → `<ContentLink href="/privacy">`, importing the existing abstraction. No second link system introduced. |
| 2 | `index.html` | Declared `rel="icon"` with the BrandMark facet inlined as a `data:image/svg+xml` URI. Inline because the production artefact is one self-contained HTML file (`vite-plugin-singlefile`) and no `public/` asset pipeline exists. |
| 3 | `mock/assets/videos/**.mp4` | All three replaced with genuinely moving clips (see §3). |
| 4 | `components/ui/CinematicVideo.jsx` | Honest state machine; readiness now also signalled by `loadedmetadata`; reveal gated on the real `playing` event; `muted` property kept in step; `data-playback-state` exposed. |
| 5 | `index.css` | `.cinematic-media-wrap` now establishes its own stacking context (`z-index: 0`) so the inner video's `z-index: 1` stays **inside** the wrap and can no longer paint above the section's veil/copy (the bug that made the bright video swallow the copy). Inside the wrap: poster `z-index: 0`, video `z-index: 1`, unlayered on purpose — Tailwind v4 emits utilities into `@layer utilities` and unlayered CSS outranks layered CSS, so a `z-[1]` utility would have lost to the existing `.cinematic-media { z-index: 0 }`. |
| 6 | `pages/customer/home/components/BrandFilmSection.jsx` | Added `onPlaying` as the reveal signal alongside `onPlay`. |
| 7 | `mock/assets/index.js`, `mock/data/homepage/index.js`, `videos/PLACEHOLDER_README.md` | Comments that described the placeholders as a "still champagne frame" / "living poster" corrected. |
| 8 | `pages/customer/home/components/HeroSection.jsx`, `index.css` | Veil / top fade / bottom hairline get `pointer-events-none` and `.hero__copy` is `pointer-events:none` except its links/CTAs, so the tap-to-play affordance beneath the copy stays tappable while the CTAs remain live. |

The gradient veil, hero composition, type hierarchy and CTA behaviour are
untouched.

### 2.1 The playback state machine is now honest

```
LOADING → READY → PLAYING        happy path
              ↘ BLOCKED          autoplay refused → calm play affordance
              ↘ FAILED           decode/network error → poster stands in
```

- `canPlay` means *"worth attempting playback"*. It deliberately does **not**
  mean *"the film is on screen"*.
- `playing` is set **only** by the browser's `playing` event, and it is the
  **only** gate for `opacity-100` (`const videoRevealed = playing && !failed`).
  The component can no longer claim playback that is not advancing.
- `failed` → the `<video>` is removed and the poster remains (designed
  fallback, no black frame).
- `blocked` → the calm play affordance appears; a successful `playing` event
  clears it, so it never lingers once autoplay works.
- The resolved state is mirrored onto `data-playback-state`, so the lifecycle
  is readable in DevTools without reaching into React.
- Exactly one effect starts playback; the pause effect only pauses. They can no
  longer fight over the element.

---

## 3. Replacement placeholders — real generated video

Generated as raw RGB frames (numpy) piped to `ffmpeg 7.0.2` / `libx264`.

```
640×360 and 360×640 · 96 frames · 4.000 s · 24 fps
H.264 baseline (profile_idc 0x42) · level 3.1 · yuv420p · silent
GOP 48 · min-keyint 48 · scenecut=0 · -movflags +faststart · CRF 27
```

Baseline is 4:2:0 by definition, which is what the yuv420p requirement means,
and is the widest-compatibility profile across Edge/Chrome/Safari.

Content: a looping champagne-gold wash with a key light sweeping
left → centre → right and back, a slower rim light, and a gold highlight that
blooms once per loop. All motion is periodic over the clip length, so the loop
point is seamless.

**These are not single-frame "living posters."** Measured mean absolute
per-channel difference between decoded frames:

```
hero-cinematic.mp4          96 frames 640x360
  frame   0 vs  12: 36.02   12 vs  24: 17.42   24 vs  48: 52.14
  frame  48 vs  72: 29.12   72 vs  95: 30.16   all-identical? False

hero-cinematic-mobile.mp4   96 frames 360x640
  frame   0 vs  12: 25.24   12 vs  24:  8.24   24 vs  48: 34.11
  frame  48 vs  72: 10.76   72 vs  95: 10.55   all-identical? False

art-of-gold.mp4             96 frames 640x360
  frame   0 vs  12: 36.02   12 vs  24: 17.42   24 vs  48: 52.14
  frame  48 vs  72: 29.12   72 vs  95: 30.16   all-identical? False
```

### 3.1 MP4 structure (read from the files, not assumed)

```
hero-cinematic.mp4           640x360  samples=96  timescale=12288
  duration=49152 => 4.000s  fps=24.00  keyframes(stss)=2
  avcC profile=0x42 (baseline)  level=0x1f (3.1)
  first sample = 4287 bytes, NAL types [6 (SEI), 5 (IDR)]
  major brand isom · compatible [isom, iso2, avc1, mp41] · moov before mdat
  134,858 bytes

hero-cinematic-mobile.mp4    360x640  samples=96  4.000s  24.00fps  stss=2
  profile=0x42 level=0x1f  first sample 4284 bytes  NAL [6, 5]   96,631 bytes

art-of-gold.mp4              640x360  samples=96  4.000s  24.00fps  stss=2
  profile=0x42 level=0x1f  first sample 4287 bytes  NAL [6, 5]  134,858 bytes
```

Note the `SEI (6)` before the `IDR (5)`. That is what a real encoder emits, and
it is why one existing assertion had to be corrected — see §7.

---

## 4. Real-browser evidence — HERO

Environment: HeadlessChrome/153.0.8010.0, viewport 1440×900,
`--autoplay-policy=no-user-gesture-required`, against `http://localhost:5173/`.

### 4.1 Element state

```
video.currentSrc   /src/mock/assets/videos/homepage/hero-cinematic.mp4
video.readyState   4        (HAVE_ENOUGH_DATA)
video.networkState 1        (NETWORK_IDLE)
video.paused       false
video.muted        true
video.autoplay     true
video.loop         true
video.playsInline  true
video.duration     4
video.videoWidth   640      videoHeight 360
video.error        null
data-playback-state         "playing"
computed opacity   video 1        poster 0
computed z-index   video 1        poster 0
play fallback      not rendered
```

### 4.2 The most important test — `currentTime` must increase

```
currentTime before : 1.535
  +1.2 s           : 2.743
  +1.2 s           : 3.951
ADVANCING = true
```

### 4.3 Frames visibly change (decoded pixels, not just the clock)

Frames were sampled by drawing the live `<video>` to a canvas and reading back
pixels, so this measures what the browser actually decoded:

```
decoded-frame mean|Δ|  t0→t1 : 10.44      t1→t2 : 26.34
```

And at the composited-screenshot level (1440×900 hero captures at t=0/1/2 s):

```
t0 vs t1 : 24.963     t1 vs t2 : 13.325     t0 vs t2 : 18.104
```

### 4.4 Loop

```
seeked to 3.850 s → after 1.5 s: currentTime 1.331, paused false
(wrapped past 4.000 and continued)
```

### 4.5 Autoplay stays muted, no play button on the happy path

`muted true`, `autoplay true`, `data-playback-state "playing"`, play affordance
absent. The hero is ambient autoplay, not click-to-play.

---

## 5. Real-browser evidence — MOBILE, REDUCED MOTION, FALLBACKS

### 5.1 Mobile (viewport 375×812)

```
video.currentSrc   hero-cinematic-mobile.mp4
video.videoWidth   360      videoHeight 640      (portrait source selected)
readyState 4       paused false       currentTime 1.5257 (advancing)
```

The mobile source is genuinely selected at 375px and the desktop source at
1440px — resolved in React via the 767px `matchMedia` query, not via
`<source media>`.

### 5.2 Reduced motion (`prefers-reduced-motion: reduce` emulated)

```
matchMedia("(prefers-reduced-motion: reduce)").matches : true
.hero video elements : 0
.hero img elements   : 1     poster opacity 1
```

Static poster, no video element, no autoplay. Normal browsers are **not**
treated as reduced-motion — the default run reports `matches: false` and plays.

### 5.3 Video error fallback

Forcing a bogus source on the live hero element:

```
before: data-playback-state "playing"
after : data-playback-state "failed"
        .hero video elements 0
        poster opacity 1
        hero <h1> still present
```

Poster stands in; no black frame, no broken icon, copy unaffected.

### 5.4 Autoplay genuinely blocked → calm fallback → recovery

Simulated by stubbing `HTMLMediaElement.prototype.play` to reject the first call
with `NotAllowedError` (the honest way to force a rejection in a headless
engine — see the note below):

```
blocked : data-playback-state "blocked"
          play affordance visible   true
          poster opacity 1          paused true
after tap: data-playback-state "playing"
          play affordance visible   false
          paused false              currentTime 2.016      video opacity 1
```

The affordance appears only when autoplay actually fails, and disappears once
playback starts. Tapping it resumes playback.

Two supporting facts verified in the same run:

- The affordance is actually **tappable**: the veil/top-fade now carry
  `pointer-events-none` and `.hero__copy` is `pointer-events:none` except for
  its own `a`/`button` elements, so the full-height copy block and the
  decorative veils no longer swallow the tap that belongs to the affordance.
- The copy's CTAs stayed interactive: `document.elementFromPoint` over
  "Explore Collections" and "Create with AI" returns the CTA itself
  (`clickable`), not an overlay.

Note on reproducibility: Chromium permits *muted* autoplay even under
`--autoplay-policy=document-user-activation-required`, so a persistent,
genuine autoplay block cannot be produced for a muted video in headless
Chromium. That is good news for the product (ambient autoplay just works) and
is why the rejection is simulated. On a device that truly blocks autoplay
(e.g. iOS low-power), the same code path runs: `play()` rejects,
`needsTap` is set, and the tap resumes.

---

## 6. Real-browser evidence — BRAND FILM ("The Art of Gold")

```
BEFORE click : src art-of-gold.mp4 · readyState 4 · paused true
               duration 4 · currentTime 0 · preload "metadata"

clicked button[aria-label="Play the art of gold film"]

AFTER click  : currentTime 0.600 · paused false
               video opacity 0.964 (mid cross-fade) · poster opacity 0.036

currentTime  : 0.600 → 1.811 → 3.016        ADVANCING = true
decoded-frame mean|Δ| : 34.01 / 20.15

END / RESET  : seeked to duration-0.25 → after 1.5 s
               currentTime 0 · paused true · play button returned
```

---

## 7. Console & network

### 7.1 Console

```
React runtime errors (ReferenceError / TypeError / Unhandled) : 0
```

The only console error remaining in this sandbox is
`net::ERR_CONNECTION_CLOSED` for `fonts.googleapis.com`, caused by the
sandbox's network egress allowlist — not by the application.

### 7.2 Network

Plain `GET` (no `Range` header):

```
200  video/mp4  134858 bytes  /src/mock/assets/videos/homepage/hero-cinematic.mp4
200  video/mp4   96631 bytes  /src/mock/assets/videos/homepage/hero-cinematic-mobile.mp4
200  video/mp4  134858 bytes  /src/mock/assets/videos/editorial/art-of-gold.mp4
```

When the `<video>` element fetches, it sends a `Range` header and the server
answers `206 Partial Content`. That is the correct response to a range request,
not a pipeline defect; no 404 or 500 was observed for any media asset.

### 7.3 Favicon

```
favicon.ico requested : NO
```

The document now declares `rel="icon"` as an inline `data:image/svg+xml` URI,
so the implicit request is never issued. A direct `GET /favicon.ico` still
returns 404 — that path is simply never reached, and this project serves no
`.ico` by design.

---

## 8. Production build

```
npm run build → ✓ 2229 modules transformed, built in ~5.8 s
dist/index.html  5,485,634 bytes (gzip 3,557,813)
```

`vite-plugin-singlefile` inlines everything, so the videos become data URIs:

```
inlined data:video/mp4;base64 URIs : 3
  decoded 134859 / 96633 / 134859 bytes   (match the source files)
external .mp4 references : 0
```

Serving `dist/` and re-running the same browser checks:

```
React runtime errors : 0        favicon.ico requested : NO
hero  : srcIsDataUri true · readyState 4 · paused false · muted true
        duration 4 · 640x360 · state "playing" · error null
        currentTime 1.649 → 2.852          ADVANCING = true
brand : currentTime 0.801 → 2.004 · paused false   ADVANCING = true
```

---

## 9. Tests

```
npm test → # tests 243   # pass 243   # fail 0
```

Baseline was 226 passing; 17 focused tests were added in
`src/__tests__/phase14-4-hotfix2-playback.test.mjs`, backed by a new
dependency-free ISO-BMFF reader in `src/__tests__/support/mp4.mjs`:

- actual dimensions per placement (640×360, portrait 360×640), 16:9 / 9:16 only
- actual frame count, duration and fps; non-zero duration; ≥ 48 frames
- browser-decodable structure: brand set, `moov` before `mdat`, `avc1`/`avcC`,
  baseline profile ⇒ 4:2:0, plausible `level_idc`
- declared keyframes plus an IDR slice in the first keyframe, and every NAL in
  that sample is a legitimate VCL/parameter-set type
- file size bounds that a stub could not satisfy
- `canPlay` is **not** the opacity gate; `playing` is; all six
  `data-playback-state` values are reachable
- the `preload="metadata"` deadlock cannot recur (readiness signalled by
  `loadedmetadata`/`loadeddata`/`canplay`; exactly one effect starts playback)
- explicit poster/video stacking; veil preserved
- autoplay muted; reduced-motion static; fallback only on genuine block
- brand film reveals on the real `playing` event and resets on `ended`
- NewsletterSection routes through `ContentLink`; a repo-wide sweep fails if any
  `.jsx` renders `<Link>` without importing it
- `index.html` declares an inlined icon and points at no `.ico`
- the `{src, mobileSrc, poster, alt, autoplay, loop, muted, playsInline}`
  contract is intact and no component hard-codes an asset path

### 9.1 One existing assertion was corrected, not weakened

`phase14-4-video-playback-hotfix.test.mjs` asserted that the **first byte** of
the first sample was `0x65` (an IDR slice NAL). That only ever held for the
hand-muxed placeholder: every real encoder emits `SEI (6)` before the IDR.
Left in place, that test would reject legitimately encoded production footage —
which the media contract explicitly requires to be swappable without component
changes. It was replaced with a length-prefixed AVCC NAL walk asserting the
keyframe **carries** an IDR slice, which is both correct and stricter. No other
assertion was relaxed; the suite is 17 tests larger.

---

## 10. Remaining limitations

1. **The placeholders are synthetic gradients, not campaign footage.** They
   exist to prove playback. Replace them one-to-one before launch.
2. **The validation browser is Chromium, not Edge.** Everything above was
   measured in HeadlessChrome/153.0.8010.0. Edge is Chromium-based and supports
   H.264 baseline / yuv420p / `playsInline` muted autoplay, and the assets were
   encoded to the widest-compatibility profile deliberately — but Edge itself
   was not driven here. The `currentTime` readings in §4.2/§6 are the check to
   repeat in Edge.
3. **Google Fonts is unreachable from this sandbox** (egress allowlist), which
   produces one unrelated console error. It will load in a normal browser.
4. **`GET /favicon.ico` still 404s if requested directly.** The browser no
   longer requests it because the document declares an icon.
5. **Keyframe interval is 48 frames (2 s).** Fine for a placeholder; production
   footage may want a shorter GOP for scrubbing.
6. **The single-file build is 5.49 MB** because every image and video is base64
   inlined. Adding full-length production footage to this bundle will not scale;
   serving media as real files is a separate architectural decision, out of
   scope here.

---

## 11. How to reproduce

```bash
cd frontend
npm install
npm test            # 243 passing
npm run build       # single-file dist/index.html
npm run dev         # http://localhost:5173/
```

In the browser console:

```js
const v = document.querySelector(".hero video");
v.currentSrc; v.readyState; v.paused; v.duration; v.error;
v.currentTime;                      // note it
await new Promise(r => setTimeout(r, 1000));
v.currentTime;                      // must be larger
document.querySelector(".hero .cinematic-media-wrap").dataset.playbackState;
// "playing"
```
