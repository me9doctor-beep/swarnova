# Swarnova Hero Reel — Footage Slots (Phase 14.4A)

This folder is where the four cinematic homepage hero films go. **It is
intentionally empty of video**: no real campaign footage has been delivered
yet, and the hero is never animated with a synthetic stand-in (no gradients,
no shimmer, no Ken Burns, no stills-to-video fakes). Until a slot is filled,
the hero shows the Signature campaign photograph, still.

## Drop-in procedure (no UI change)

1. Add the files below to this folder.
2. In `src/mock/assets/index.js`, replace the matching `const … = null;` with
   an import, e.g.

   ```js
   import heroReelSignatureVideo from "./videos/homepage/hero-reel/signature-gold.mp4";
   import heroReelSignatureMobileVideo from "./videos/homepage/hero-reel/signature-gold-mobile.mp4";
   ```

3. Done. `mock/data/homepage/index.js` already references every slot; the
   hero starts playing the moment a slot is non-null, and rotates as soon as
   two or more slots are filled. A real API/CMS supplies the same fields.

| slot | desktop file | mobile file | poster (already in repo) |
| ---- | ------------ | ----------- | ------------------------ |
| 1 · Signature Gold | `signature-gold.mp4` | `signature-gold-mobile.mp4` | `images/homepage/hero.avif` |
| 2 · Bridal Gold | `bridal-gold.mp4` | `bridal-gold-mobile.mp4` | `images/homepage/hero-reel/bridal-gold-poster.avif` |
| 3 · Contemporary | `contemporary.mp4` | `contemporary-mobile.mp4` | `images/homepage/hero-reel/contemporary-gold-poster.avif` |
| 4 · Heritage Statement Gold | `heritage-statement.mp4` | `heritage-statement-mobile.mp4` | `images/homepage/hero-reel/heritage-gold-poster.avif` |

## Technical specification

| | desktop | mobile |
|-|---------|--------|
| container / codec | MP4 · H.264 (High or Main profile) · yuv420p | same |
| geometry | 1920×1080 or 1600×900 (16:9); the hero crops with `object-fit: cover` | 720×1280 (9:16) *or* reuse a 1280×720 centre-right crop |
| duration | 8–12 s, target **10 s** | same clip, same duration |
| frame rate | 24 / 25 / 30 fps, constant | same |
| audio | **none** (strip the track: `-an`) | none |
| bitrate | ~3–5 Mbps, target ≤ 5 MB per clip | ~1.5–2.5 Mbps, ≤ 2.5 MB |
| streaming | `-movflags +faststart` (moov before mdat) | same |
| GOP | keyframe every 1 s (`-g 24`/`25`/`30`) | same |
| first frame | must match the slot's poster (it crossfades from it) | same |
| last frame | calm, similar exposure to the first (it is held during the 1.8 s dissolve into the next film) | same |

Reference encode:

```bash
ffmpeg -i master.mov -an -c:v libx264 -profile:v high -pix_fmt yuv420p \
  -vf "scale=1920:-2,fps=25" -crf 23 -preset slow -g 25 \
  -movflags +faststart signature-gold.mp4

ffmpeg -i master.mov -an -c:v libx264 -profile:v main -pix_fmt yuv420p \
  -vf "crop=ih*9/16:ih:iw*0.62-ih*9/32:0,scale=720:-2,fps=25" -crf 25 \
  -preset slow -g 25 -movflags +faststart signature-gold-mobile.mp4
```

(The mobile crop centres on ~62% of frame width, where the model sits.)

## Composition rules (all four films)

* Model occupies the **right ~45%** of a 16:9 frame; face in the upper third.
* The **left ~50%** is soft, out-of-focus, low-contrast backdrop — the
  headline, body copy and CTAs sit there. No face, no bright jewellery, no
  specular highlights, no high-contrast detail may cross into that half.
* Warm champagne-taupe / bronze backdrop, burgundy wardrobe, 22K yellow gold —
  the palette of the existing hero photograph.
* Camera: slow, continuous, motivated. Push-in, gentle arc or lateral drift —
  never a cut, whip, zoom-snap or handheld shake. Total travel ≈ 5–10 %.
* Subject motion: natural and small — a breath, a head turn, lowering or
  lifting the gaze, a hand settling near the necklace. Earrings sway; the
  gold catches and releases light as she moves.
* No text, no logos, no watermark, no lens flares, no particles.

## Generation prompts (image-to-video from the poster keyframe)

Use each slot's poster as the **start frame** (image-to-video), so the film
opens exactly on the poster and the dissolve is seamless.

### 1 · Signature Gold — start frame `hero.avif`

> Cinematic luxury jewellery commercial, 10 seconds, 16:9, 25 fps, photoreal.
> A beautiful Indian woman in a deep burgundy silk off-shoulder drape, hair in
> a soft low bun with loose strands, wearing an ornate 22K gold and polki
> necklace with ruby drops and matching long ruby-and-polki earrings. She is on
> the right side of the frame against a plain warm taupe studio backdrop; the
> left half of the frame stays empty, soft and dark enough for text. She slowly
> lifts her lowered gaze and turns her head a few degrees toward camera, a
> gentle breath moving her shoulders; the earrings sway slightly and the gold
> and stones catch soft warm light. Camera: very slow push-in with a slight arc
> to the left, ending on a slightly tighter portrait. Soft warm key light from
> the right, gentle falloff, shallow depth of field, 85 mm. Mood: timeless,
> elegant, premium. No text, no logos, no cuts.

### 2 · Bridal Gold — start frame `bridal-gold-poster.avif`

> Cinematic bridal jewellery commercial, 10 seconds, 16:9, 25 fps, photoreal.
> A beautiful Indian bride in a burgundy embroidered bridal lehenga with a
> sheer red dupatta over her hair, wearing a gold kundan and polki bridal
> necklace with ruby drops, long gold jhumka earrings, a gold maang tikka and
> a nath. She stands on the right of the frame against a warm taupe backdrop;
> the left half remains plain and soft for text. She smiles softly with eyes
> lowered, her hennaed hand gently settling near the necklace, then raises her
> eyes; the jhumkas sway and the kundan glints. Camera: slow lateral drift from
> right to left combined with a gentle push-in that ends on a close-up of the
> necklace and earrings. Premium warm golden lighting, shallow depth of field.
> Mood: bridal, rich, elegant. No text, no logos, no cuts.

### 3 · Contemporary — start frame `contemporary-gold-poster.avif`

> Cinematic modern luxury jewellery commercial, 10 seconds, 16:9, 25 fps,
> photoreal. A beautiful Indian woman with sleek dark hair tucked behind her
> ear, in an off-shoulder wine-coloured satin dress, wearing a sculptural 18K
> gold collar necklace with a pear diamond pendant and geometric gold drop
> earrings. She sits on the right of the frame in a minimal warm-taupe modern
> interior; the left half is a clean soft wall for text. She turns her head
> slowly from profile toward three-quarter, a small breath; the pendant and
> earrings catch a soft travelling highlight. Camera: slow side move (trucking
> left) with a subtle push-in. Soft directional daylight from the right.
> Mood: modern, minimal, premium. No text, no logos, no cuts.

### 4 · Heritage Statement Gold — start frame `heritage-gold-poster.avif`

> Cinematic heritage jewellery commercial, 10 seconds, 16:9, 25 fps,
> photoreal. A beautiful Indian woman in a burgundy Banarasi silk sari with a
> gold border, hair in a soft low bun, wearing layered antique temple-gold
> necklaces with emerald and ruby accents, large ornate gold chandbali earrings
> and gold bangles. She sits on the right of the frame in a warm, dim heritage
> interior with carved wooden pillars softly out of focus; the left half stays
> dark, plain and soft for text. She slowly lifts her lowered gaze and turns
> slightly toward the light; the chandbalis sway, the engraved gold catches
> candle-warm highlights. Camera: slow push-in that settles into a detailed
> close-up of the face, earrings and necklace. Warm sophisticated low-key
> lighting. Mood: heritage, timeless, luxury. No text, no logos, no cuts.

## Acceptance checks before committing a clip

* `ffprobe` reports H.264, yuv420p, no audio stream, 8–12 s, constant fps.
* First frame visually matches the poster.
* Nothing bright or detailed crosses the left half of the frame.
* In the browser (`npm run dev`):

  ```js
  const v = document.querySelector(".hero video");
  v.currentSrc; v.readyState; v.paused; v.duration;
  const t = v.currentTime; await new Promise(r => setTimeout(r, 1000));
  v.currentTime > t; // true
  ```
