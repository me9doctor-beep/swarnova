# PHASE 14.4D — Media delivery: films that start at once, and a seal over the corner mark

Date: 2026-09-27 (Asia/Calcutta)
Working branch: `arena/01a0e1b2-swarnova`
Baseline: `ef9569f` (Phase 14.4C merged)

## 1. What the user reported

1. The homepage hero **did not start its film on load** — the still appeared first and the
   film began seconds later, "lagging".
2. The Art of Gold film **required a click**; it should begin by itself when scrolled to,
   and it should be smooth.
3. The delivered footage carries a **small star mark in one corner** (the Google AI mark,
   noted as a waiver in §1/§4 of `PHASE_14_4C_RECONCILIATION.md`). Cover it with a
   sticker-type component so it is not visible.

## 2. Root cause of the lag — the build, not the player

`vite-plugin-singlefile` sets `build.assetsInlineLimit = () => true`, so **every** asset was
base64-inlined into `index.html`. The production document was **34,988 kB** — 22 MB of the
five delivered films plus ~3.5 MB of stills as data URIs.

A `data:` URL is not range-requestable and cannot be decoded before the whole payload has
arrived. So the browser had to download every film before it could render a single frame:
the hero painted its poster, sat still, and only then began playing. No amount of player
tuning (`preload`, `autoplay`, `playing` gating) could fix that — the bytes were already
inside the document that had to finish loading first.

**Fix** — `vite.config.js` keeps the single-file build for code (JS/CSS stay inlined) and
re-applies `assetsInlineLimit` so media is emitted as ordinary files:

| | before | after |
| - | ------ | ----- |
| `dist/index.html` | 34,988 kB (25,718 kB gzip) | **1,143 kB (290 kB gzip)** |
| films | base64 inside the HTML | 5 × `.mp4`, served with `206 Partial Content` |

Verified after the change: `curl -H "Range: bytes=0-262143"` on the hero film returns
`206 Partial Content`, and every film already has `moov` before `mdat` (faststart), so
playback begins after the first chunk instead of after the whole file.

Deployment note: `dist/` is now a folder (document + media files), not one HTML file.

## 3. The Art of Gold film now starts on scroll

`BrandFilmSection.jsx`:

- `preload` flips to `"auto"` and playback starts **300 px before** the frame enters the
  viewport (`useIntersectionAware` root margin), so what arrives on screen is a film
  already running — not a poster, not a buffering stall.
- Autoplay is muted and inline (permitted without a gesture); a genuinely refused play
  (low-power mode, data saver) falls back to the calm tap affordance, as before.
- Scrolling away pauses the film (no off-screen decode) and re-arms it, so scrolling back
  replays it. Start and pause are separate effects so they cannot fight over the element.
- No player chrome: the delivery has no audio track, and the scroll already provides the
  pause. The labelled button remains for a refused autoplay and for replay after the end.
- Unchanged: poster-first reveal gated on the real `playing` event, reset on completion,
  reduced-motion poster-only, error fallback.

## 4. The corner star mark

New shared component `components/ui/MediaSticker.jsx` — a die-cut house seal (paper ring,
champagne-gold disc, the faceted Swarnova mark and wordmark), tilted 8°, `aria-hidden`,
`pointer-events-none`, no motion, so it never intercepts a tap and costs nothing at
playback time. It is placed in the hero and in the atelier film, above poster and video
alike (so it covers the mark during the buffering window too).

- **Nothing about the delivery changed** — no crop, no blur, no re-encode, no edited frame.
- `corner` defaults to `"bottom-right"`, where Google's AI mark is placed. If a future
  delivery moves the mark, change the prop (one value per placement) — no other edit.
- **The seal is pinned to the film's frame, not to the section.** The hero crops its film
  (`object-fit: cover` with a focal point that changes at 1280px), so a seal anchored to the
  hero box would drift off the mark and into the copy. `.hero__sticker-shell` +
  `.hero__sticker-film` rebuild the film's own cover box in CSS (`max()` over the container's
  `cqw`/`cqh`, offset by the same focal percentage), so the seal travels with the film's
  bottom-right corner: covering the mark where the crop shows that corner — 1024–1279px wide
  viewports, and a sliver on wide desktops — and cropped away with it where the crop hides
  it, which is every phone and tablet. The atelier film needs no wrapper: its 16:9 frame
  *is* the film's frame.
- The hero's reel-position hairlines moved from bottom-right to bottom-left so they cannot
  sit under the seal (they are only ever visible together on wide screens).

## 5. Smaller changes

- `CinematicVideo`: the poster→film handover fades over 400 ms instead of 700 ms. The
  poster is the film's own first frame, so a long crossfade added nothing but delay.

## 6. Verification and limits

- Full Node suite: **317/317 pass** (was 306). New: `src/__tests__/phase14-4d-media-delivery.test.mjs`
  (build rule executed through the plugin's own `config` hook; sticker placement and the
  cover-box/focal CSS; the hero contract is unchanged). Updated:
  `phase14-4c-craft-film.test.mjs` — the four assertions that locked click-to-play and
  "no sticker" now lock scroll-autoplay and the seal.
- Production build succeeds and is served over HTTP with working range requests
  (`206 Partial Content` for the films, the poster and the hero still).

**Not verified here:** no browser could be installed in this sandbox (Playwright's Chromium
download is blocked), so playback was not observed in a real engine — the streaming fix is
verified at the HTTP/asset level and the player logic by unit tests. The mark's corner is
assumed to be bottom-right from Google's placement; the user should confirm on screen, and
it is a one-prop change if it differs.
