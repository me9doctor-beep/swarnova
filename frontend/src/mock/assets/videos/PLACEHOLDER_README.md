# Swarnova Video Placeholders

The `.mp4` files in this folder are intentionally minimal placeholder
stand-ins for production campaign footage. They are small enough to ship
with the mock bundle while still exercising the native `<video>` pipeline
(muted autoplay, loop, playsInline, poster fallback, error recovery).

When the house delivers final compressed H.264/H.265 assets, these files
are replaced one-to-one — no UI or data changes required.

## Placeholder generation

The files were produced with a single-packet H.264 IDR NAL (a flat
champagne-gold frame matching the Swarnova palette) muxed into an MP4
container. They play as a still, silent, looped frame — effectively a
"living poster" — so the cinematic hero behaviour is exercised without
distributing large stock footage.

## Replacement contract

Each video record in the media layer carries:

    src, mobileSrc, poster, alt, autoplay, loop, muted, playsInline, placement

A backend/CMS can therefore supply desktop, mobile, poster and accessibility
metadata independently. UI components never import these files directly.
