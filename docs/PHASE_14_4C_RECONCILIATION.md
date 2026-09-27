# PHASE 14.4C — Supplied craftsmanship film integrated and validated

Date: 2026-09-27 (Asia/Calcutta)
Working branch: `arena/01a0de70-swarnova`
Baseline: `fa3ee44bb5f002505ff51e7e2993fbf80744a14c`

## 1. Result and approved exceptions

**Technical integration complete for the user's selected delivery: “8-bit + remove CapCut ending.”** The existing Art of Gold player now uses the supplied film and a poster extracted from that film. The small corner watermark remains visible by explicit user approval; no sticker, cover-up component, crop or redesign was added.

This supersedes the earlier blocked review of the 852 × 480, 39.625-second file. The new upload is different footage and a different export. It should not be confused with the previous candidate.

- Located upload `art-of-gold-web.mp4` in remote commit `949b47a` (`Add video again`).
- Fixed the asset registry's stale reference to the deleted `art-of-gold.mp4`.
- Converted only for 8-bit browser delivery and trimmed the final two-second CapCut ending, as approved in chat.
- Kept all 800 pre-outro frames; no new footage, synthetic motion, replacement scenes or audio were generated.
- Extracted the poster from the new film at 32 seconds.
- Existing `BrandFilmSection.jsx`, hero components, product-card components and CSS are unchanged.
- **306/306 tests pass**, production build succeeds, and real Chromium playback passes at all five requested viewport sizes.
- Initial validation was completed without committing or pushing; these changes are now being submitted in the user-requested pull request. No Phase 15, backend, unrelated dependency upgrade, or homepage redesign.

**Important qualifications:** the watermark waiver applies to the film and its extracted poster. This is not a watermark-free delivery. Visual review does not certify that every AI-generated hand/tool action is physically authentic; see §4. Safari/Firefox/device-hardware testing was not performed. The sandbox's existing external Google Fonts request fails, so “zero console errors of any kind” is not claimed.

## 2. Source and delivery metadata

Canonical integrated path:

`frontend/src/mock/assets/videos/editorial/art-of-gold-web.mp4`

The source was first copied to the ignored ingestion workspace before conversion. Its exact original remains recoverable from GitHub upload commit `949b47a`; no remote content was overwritten. Only the delivery copy is included in the resulting repository change, not a second large master file.

| Property | Pushed source | Integrated web copy |
|---|---|---|
| Filename | `art-of-gold-web.mp4` | `art-of-gold-web.mp4` |
| Container | MP4, major brand `mp42` | MP4, major brand `isom` |
| Bytes | **7,749,977** | **9,071,738** |
| Decimal MB | 7.75 MB | **9.07 MB** |
| Duration | 35.333333 s | **33.333333 s** |
| Frames | 848 | **800** |
| Resolution | 1920 × 1080 | **1920 × 1080** |
| Aspect | 16:9, square pixels | **16:9, square pixels** |
| Frame rate | 24 fps | **constant 24 fps** |
| Codec | H.264 High 10, level 5.0 | **H.264 High, level 4.0** |
| Pixel format | `yuv420p10le` | **`yuv420p`**, 8-bit |
| Audio | None | **None** |
| Faststart | Yes | **Yes**, moov before mdat |
| Video bitrate | 1,752,136 bit/s | 2,174,715 bit/s |
| Keyframes | 8 | **18**, approximately two-second GOPs |
| Full decode | Inspected source | **No reported decoder errors** |

Source SHA-256:

`c6041dbcb61651085aaef3fac1f60d399d782671fd983d48510272aaf436dcc6`

Delivery SHA-256:

`3502b0f6f2e1786ab7935e706ea0393e4aa526a8bdd8e328378a462630db8380`

The source High-10 file did start playing in the available Chromium 153 build. It was **not** falsely reported as failing there. Conversion was recommended for the explicit 8-bit delivery contract and broader browser/hardware compatibility, then authorized by the user.

The 8-bit copy is slightly larger than the 10-bit upload because it was encoded at CRF 22 to protect jewellery detail, not forced to match a byte count. It remains inside the proposed 8–12 MB web budget and is far smaller than the user's 39 MB master. No upscaling was performed.

### Approved conversion

Scene/frame inspection located the CapCut ending at **33.333333 seconds**. The last retained frame is at approximately **33.291667 seconds**, still showing the finished necklace. Exactly the final 48 frames were removed.

Equivalent ffmpeg command, using the saved original as input:

```bash
ffmpeg -i supplied-original.mp4 -map 0:v:0 -frames:v 800 \
  -c:v libx264 -preset slow -crf 22 -profile:v high -level:v 4.0 \
  -pix_fmt yuv420p -r 24 -vsync cfr -g 48 -keyint_min 24 \
  -an -movflags +faststart art-of-gold-web.mp4
```

Metadata was verified using ffprobe and the repository ISO-BMFF reader. The latter now reads track handlers, sample timing and the AVC SPS chroma/bit-depth fields so a High-10 or audio-bearing replacement cannot silently pass the new tests.

## 3. Poster

- Filename: **`art-of-gold-poster.jpg`**.
- Path: `frontend/src/mock/assets/images/homepage/art-of-gold-poster.jpg`.
- Source: integrated film at **32.000 seconds**, extracted with ffmpeg, not generated.
- Dimensions: **1920 × 1080**, exact 16:9.
- Size: **177,880 bytes**.
- Subject: finished warm-gold necklace on a brown-charcoal bust in the atelier.
- The main pendant is below/right of the central play button and remains identifiable at desktop and mobile sizes.
- No embedded text, equipment branding, readable screen or CapCut end card. **The permitted corner star mark remains visible.**

Only the film slot uses this poster. The adjacent static editorial's existing atelier image remains unchanged, avoiding an unrelated content redesign. The film no longer uses the old text-bearing atelier poster.

## 4. Visual review and limitations

Inspected a full-duration contact sheet, a dense four-frames-per-second ending contact sheet, the extracted full-resolution poster and last frame, plus real browser playback. The final picture stays on jewellery rather than a black CapCut end card.

Visible story in the supplied film:

| Approximate timing | Content |
|---|---|
| 0–4.83 s | Hand sketching a necklace design |
| 4.83–9.96 s | Molten gold / casting preparation |
| 9.96–14.83 s | Hand shaping / filing a gold necklace framework |
| 14.83–21.21 s | Tweezers and stone-setting-like detail on the gold framework |
| 21.21–25.79 s | Close tool work on a mounted stone |
| 25.79–29.83 s | Polishing/buffing imagery |
| 29.83–33.33 s | Finished warm-gold necklace reveal |

The warm gold, bronze, charcoal, workbench setting and restrained editorial camera treatment fit the existing Swarnova palette more closely than the previous pale-metal payoff. A broad design-to-finished-jewellery story is visible.

**Do not overstate authenticity:** not every originally requested technique is distinctly demonstrated. A separate inspection/loupe beat and engraving stage are not clearly established. The tool-to-mounted-stone and buffing shots are stylized; their mechanical safety/accuracy and exact piece-by-piece continuity are not independently verified. No gross malformed-hand or broken-jewellery defect was obvious in the reviewed samples, but an exhaustive “no AI artefacts / all actions physically correct” claim would be unjustified. No shot was replaced to conceal these limitations.

The small star mark is an **approved exception**, left visible in the footage and poster. No sticker has been introduced into the UI. This film should not be represented as documentary evidence of Swarnova's actual workshop or manufacturing process.

## 5. Integration and unchanged design

Flow remains:

`Asset Registry` → `Homepage Data` → `mockProvider / contentService / useHomepage` → `HomePage` → **`BrandFilmSection`**.

Registry keys:

- `media.artOfGoldVideo` → supplied web-delivery MP4.
- `media.artOfGoldPoster` → extracted poster JPEG.

The `brand_film` record still uses `content.video.src`, `content.video.alt` and `content.poster`. The alt text now describes the supplied design/preparation/shaping/setting/polishing/reveal sequence. UI components do not import mock assets or hard-code a video URL.

Preserved:

- `#art-of-gold`, “Where Heritage Meets Innovation”, supporting copy and caption.
- Section ordering between “Tradition, Reimagined” and “Why Choose Us”.
- Cream background, typography, spacing, max-width, gold border, vignette, play button and responsive 16:9 frame.
- Existing native video component; no second player or additional video slots.

## 6. Playback and responsive validation

Engine: **real headless Chromium 153.0.8010.0**, Playwright-driven, no mocked playhead.

Selector: **`#art-of-gold video`**, not global `document.querySelector('video')`, which would select the hero.

Development `currentSrc`:

`http://127.0.0.1:5173/src/mock/assets/videos/editorial/art-of-gold-web.mp4`

| Viewport | currentTime t1 → t2 | Duration | readyState | paused |
|---|---|---|---|---|
| 1280 × 800 | **0.125692 → 1.557778** | 33.333333 s | 4 | false |
| 1536 × 864 | **0.125266 → 1.534531** | 33.333333 s | 4 | false |
| 1024 × 768 | **0.116779 → 1.536281** | 33.333333 s | 4 | false |
| 768 × 1024 | **0.124790 → 1.536446** | 33.333333 s | 4 | false |
| 375 × 812 | **0.128050 → 1.538012** | 33.333333 s | 4 | false |

All five runs verified:

- Poster displayed first; video exists but is paused before interaction.
- Desktop keyboard Enter and mobile tap activate the labelled play control.
- Real decoded-frame counts increase along with `currentTime`; video opacity reaches 1 and poster fades to 0.
- No autoplay, no loop, inline playback, native controls while playing.
- Pause returns the poster and play affordance; resume advances from the paused position.
- Completion returns the poster and resets to time zero; replay then advances again.
- One entire natural completion at 1280 × 800. Other sizes seek near the end to exercise the genuine ended/reset event, not a synthetic event.
- No horizontal overflow; player dimensions and document position remain stable across play/pause/replay.
- Mobile remains landscape; no portrait asset, altered focal point or extra crop.

Measured inner video dimensions include the existing one-pixel border:

- Large desktop: 1022 × 574 px.
- 1024 viewport: 926 × 520 px.
- 768 viewport: 702 × 394 px.
- 375 viewport: 333 × 186.4375 px.

Desktop/mobile poster screenshots were visually reviewed. The play button does not completely hide the main pendant, and the jewellery remains visible.

### Production browser proof

The single-file build plays the same delivery as `data:video/mp4;base64,…`:

| Viewport | currentTime | Decoded frames | readyState / paused |
|---|---|---|---|
| 1280 × 800 | **1.052782 → 3.292287** | **25 → 80** | 4 / false |
| 375 × 812 | **0.860627 → 2.915168** | **21 → 75** | 4 / false |

### Reduced motion, accessibility and error paths

- Reduced motion: poster only, no video/play button, matching the existing implementation.
- Button has the existing accessible name, native button semantics and working keyboard activation.
- Section heading is labelled; poster/video have descriptive media text.
- Missing/empty source: focused render tests prove static poster without a dead button.
- Media failure: real aborted media requests produce poster fallback and remove broken playback affordances.
- Rejected play promise: deliberate browser policy rejection leaves poster and retry control in place.
- No new decorative transition or motion was added.
- Screen-reader and physical iOS/Android device testing were not performed.

Existing implementation details were deliberately preserved: the play handler tries unmuted playback before a muted retry, but the delivered file has no audio track. Intersection awareness controls preload, not off-screen pausing; user-started playback is not newly paused by scroll.

## 7. Network, console and performance

- Full video GET: **HTTP 200**, **`video/mp4`**, **9,071,738 bytes**.
- Actual Chromium playback uses valid **206 Partial Content** responses, `video/mp4`.
- Poster: **HTTP 200**, **`image/jpeg`**.
- No film/poster 404 and no decoder error in normal playback.
- No JavaScript page errors in the five viewport runs or production checks.
- Existing Google Fonts stylesheet requests fail with `net::ERR_CONNECTION_CLOSED` in this sandbox. This external resource error is reported rather than hidden; screenshots use the available font fallback.

Below-fold loading remains unchanged: `preload="none"` before approaching the film, then `metadata` near the viewport. **Zero craftsmanship-video network requests before scrolling toward the section** in the measured development runs.

Browsers legitimately cancel/resume range transfers after metadata and during the explicit test seeks. Natural-playback run: two range responses, initial range from zero and resumed range from byte 786432. Seek-to-end runs add a tail request around byte 8323072. This is not multiple video elements or an application refetch loop, and is not described as a single-request download. Faststart is confirmed independently by MP4 atom ordering.

### Production build impact

The existing `vite-plugin-singlefile` architecture embeds imported media in HTML. Metadata preloading therefore does **not** defer the film's network bytes in production.

| Build | HTML | Gzip |
|---|---:|---:|
| Baseline recorded in previous validation | 22,839.85 kB | 16,572.68 kB |
| Final build with film + extracted poster | **34,988.36 kB** | **25,717.55 kB** |
| Increase | **12,148.51 kB** | **9,144.87 kB** |

The increase includes base64 expansion of the approximately 9 MB film and 178 KB poster. This limitation is disclosed, not fixed through an unauthorized media/CDN architecture change. Only one delivery film is added; the master and processing intermediates are not included in the tracked patch.

## 8. Phase 14.4A and 14.4B regressions

### Hero / 14.4A

- Playback proof: **0.162957 → 1.377610 seconds**.
- Full measured cycle: **Signature → Bridal → Contemporary → Heritage → Signature**.
- Mobile hero plays through the existing desktop-source fallback.
- Reduced motion has no hero video.
- Media failure returns the hero to poster mode.
- Hero code, footage and CSS unchanged.

### Product cards / 14.4B

JWL-001 checked in Chromium:

- Canonical image present initially; alternate layer absent until hover.
- Desktop sequence reaches left → right → detail, with visible-layer counts **1 → 2 → 3**.
- Mouse leave disengages the layer and returns opacity to zero/primary image.
- Mobile and reduced-motion cards do not create the alternate layer.
- Wishlist toggles; product navigation reaches `/product/JWL-001`.
- No product-card video; image-based design preserved.

Homepage motion hierarchy remains the cinematic hero, user-invited craft film, mouse-invited product-image sequence and existing micro-interactions. No particles, animated gradients, shimmer, parallax, bounce, marquee or scroll animation was added.

## 9. Tests and validation commands

**`npm test`: 306 tests, 306 pass, 0 fail.**

- 291 prior test cases retained.
- 15 focused Phase 14.4C tests added.
- Historical placeholder assertions now check the actual production contract: 1920 × 1080, 800 frames, 33.333 s, 24 fps, High profile/level 4.0 and a 12 MB delivery budget.
- Faststart, valid AVC/container data, real keyframes and IDR assertions remain intact.
- New assertions additionally verify SPS-derived 8-bit 4:2:0, no audio handler, constant frame timing, extracted JPEG dimensions, missing-source/reduced-motion rendering, accessibility, provider/data flow, unchanged layout and no UI mock imports.
- No existing test was removed or skipped to get a pass. Placeholder-specific values were replaced because the diagnostic placeholder was removed, not accepted as the new footage.

**`npm run build`: passes.** No application dependency, TypeScript, React component, layout or CSS change was introduced. `npm ci` reported the existing two dependency advisories (one low, one high); unrelated upgrades were not performed.

A reproducible optional real-browser suite is included at:

`frontend/src/__tests__/support/phase14-4c-browser.mjs`

With an external Playwright installation and Chromium available, run after starting Vite:

```bash
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs \
CHROMIUM_EXECUTABLE=/absolute/path/to/chromium \
BASE_URL=http://127.0.0.1:5173 \
REPORT_PATH=/path/to/browser-results.json \
node src/__tests__/support/phase14-4c-browser.mjs
```

The browser suite is separate from the dependency-free Node suite and does not add Playwright to application dependencies. It exercises all five viewports, natural completion, full hero cycle, product interactions, reduced motion and media/policy failures. Two additional production playback checks were run on the built site. Full ffmpeg decode-to-null produced an empty error log. `git diff --check` passes.

## 10. Files changed

- `src/mock/assets/videos/editorial/art-of-gold-web.mp4` — approved converted/trimmed delivery.
- `src/mock/assets/videos/editorial/art-of-gold.mp4` — obsolete diagnostic placeholder removed, consistent with the upload's deletion.
- `src/mock/assets/images/homepage/art-of-gold-poster.jpg` — frame extracted from supplied footage.
- `src/mock/assets/index.js` — corrected video import; new poster key.
- `src/mock/data/homepage/index.js` — film poster and accurate film description.
- `src/mock/assets/videos/PLACEHOLDER_README.md` — historical status clarified.
- Two historical playback test files — production-media acceptance values.
- `src/__tests__/support/mp4.mjs` — SPS, track-handler and constant-timing inspection.
- `src/__tests__/phase14-4c-craft-film.test.mjs` — 15 focused tests.
- `src/__tests__/support/phase14-4c-browser.mjs` — repeatable Chromium acceptance harness.
- `PHASE_14_4C_RECONCILIATION.md` — this final report, replacing the previous blocked-candidate report.

**Not changed:** `BrandFilmSection.jsx`, hero implementation/assets, ProductCard/multi-angle implementation, design tokens, styles, router, auth, commerce, staff consoles, AI/try-on, backend, package manifest or lockfile.

## 11. Final acceptance

| Requirement | Result |
|---|---|
| Supplied film located / metadata inspected | Pass |
| User-approved 8-bit conversion and CapCut trim | Done |
| Final MP4/H.264/yuv420p/CFR24/no audio/faststart | Pass |
| Visual content reviewed | Done; craft-authenticity limits in §4 |
| No watermark | **Later superseded — the corner mark is now covered by the responsive campaign credit plate (`components/ui/FilmCredit.jsx`); the film and poster are unmodified** |
| New poster from supplied film | Integrated; the credit plate covers the mark on the poster as well |
| Existing architecture and section design | Preserved |
| Click-to-play / actual advancing frames | Pass |
| Pause / resume / replay / natural completion/reset | Pass |
| Five viewport / mobile / reduced-motion checks | Pass |
| Media and policy failure fallback | Pass |
| Network response / MIME / no broken media | Pass |
| Console | No JS page errors; external Fonts failure disclosed |
| 14.4A / 14.4B regressions | Pass |
| Image-based cards / no new animation dependency / no TS / no mock leakage | Preserved |
| Full Node test suite | **306/306 pass** |
| Production build and desktop/mobile playback | Pass |
| Reconciliation report | Updated |
| Phase 15 / backend / redesign | Not started |

**Stop here.** Future watermark-free or more mechanically authentic footage can be a separately approved asset replacement; it was not fabricated during this integration.

---

## 12. Superseding note — the corner mark is now covered in the UI

The waiver above applied to the *delivery*: the mark stayed in the film and in
the poster extracted from it. It has since been superseded by a presentation
change, not a media change:

* one shared component, `components/ui/FilmCredit.jsx` (`FilmCredit`), renders
  the campaign credit plate — word-mark, champagne hairline, one tracked line —
  inside the film frame of both the hero reel and the Art of Gold film;
* it is positioned from the **rendered** frame (`object-fit: cover` mapping,
  `utils/filmFrameGeometry.js`), never from the page, section or viewport, and
  it is clamped inside the frame, so it cannot overflow or cause a scrollbar;
* responsive sizing lives in `index.css` (`.film-credit` and its
  tablet/phone steps) — the component reads those custom properties back, so
  the responsive system stays the single source of truth;
* the media files themselves were not touched: no crop, no blur, no re-encode.

Regression coverage: `src/__tests__/film-credit-geometry.test.mjs` (unit) and
`src/__tests__/support/film-credit-browser.mjs` (optional real-Chromium run).
