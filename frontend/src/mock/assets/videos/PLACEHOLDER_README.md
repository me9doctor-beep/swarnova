# Swarnova Video Placeholders

> **Phase 14.4A:** the two homepage hero placeholders
> (`homepage/hero-cinematic*.mp4`, an abstract champagne-gold wash) were
> removed — the hero no longer uses abstract motion. Hero footage slots and
> generation prompts now live in `homepage/hero-reel/README.md`. Only the
> brand-film placeholder below remains.

The `.mp4` files in this folder are intentionally minimal placeholder
stand-ins for production campaign footage. They are small enough to ship
with the mock bundle while still exercising the native `<video>` pipeline
(muted autoplay, loop, playsInline, poster fallback, error recovery).

When the house delivers final compressed H.264 assets, these files are
replaced one-to-one — no UI or data changes required.

## What the placeholders actually are

They are **genuinely moving** clips, not stills:

| file                      | geometry   | frames | duration | fps |
| ------------------------- | ---------- | ------ | -------- | --- |
| `editorial/art-of-gold.mp4`          | 640×360  | 96 | 4.000 s | 24 |

Each clip is a looping champagne-gold wash with a key light that sweeps
left → centre → right and back, a slower rim light, and a gold highlight that
blooms once per loop. Every frame differs from the last, so a glance at the
hero is enough to tell that a real video is decoding — which is the whole
point of a *playback diagnostic* placeholder.

Encoding (chosen for maximum browser compatibility, not quality):

    H.264 baseline profile (0x42), level 3.1   → 4:2:0 by definition
    yuv420p · silent · no B-frames · GOP 48 · scenecut off
    -movflags +faststart (moov before mdat) · CRF 27

`baseline` is deliberately the widest-compatibility profile across
Edge/Chrome/Safari; `faststart` lets playback begin without a second
round trip; `scenecut=0` keeps the keyframe interval exact so the loop point
is predictable.

### Why the previous placeholders were replaced

The earlier files were a single hand-muxed H.264 IDR packet repeated three
times — a "living poster". They parsed as valid MP4 and returned HTTP 200, but
Chromium rejected their packets outright:

    MediaError code 3 (MEDIA_ERR_DECODE)
    PIPELINE_ERROR_DECODE: Failed to send video packet for decoding

The hero's `onError` handler then unmounted the `<video>`, leaving the poster —
which is exactly the "completely static hero" symptom. A container being valid
and a browser being able to decode it are two different claims; these files are
verified against the second one.

## Replacement contract

Each video record in the media layer carries:

    src, mobileSrc, poster, alt, autoplay, loop, muted, playsInline, placement

A backend/CMS can therefore supply desktop, mobile, poster and accessibility
metadata independently. UI components never import these files directly.

Production footage only has to satisfy what `CinematicVideo` already assumes:
an H.264 MP4 (yuv420p) with `moov` before `mdat`. Note that a real encoder
emits SEI before the IDR slice in a keyframe — that is normal and expected.
