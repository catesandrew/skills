---
name: dithered-motif-site
description: >-
  Use when building a "dithered particle-field" animated hero/background —
  a still or video subject made of many small discrete elements (sparks,
  falling ash, a rose window, a flock, crowds, falling particles, repeated
  architecture) rendered as an animated Bayer-dithered dot field on a canvas,
  with pointer-reactive warp, used as a full-bleed page background. Covers the
  whole manual pipeline: (1) writing Higgsfield `nano_banana_pro` image
  prompts and `seedance_2_0` (image-to-video) prompts whose SUBJECT is
  dither-compatible — the rule that a solid object (one face, one animal, one
  smooth mass) turns into an illegible grey blob and only "many small
  discrete elements" survives dithering, and that video prompts MUST demand a
  locked-off static camera or the loop becomes unusable; (2) ffmpeg frame
  extraction (~11fps, crop any painted border before scale, flatten
  background noise); (3) the canvas dither engine itself — downscale-to-buffer,
  Rec.709 luma, percentile auto-levels PINNED for the whole sequence (never
  recomputed per frame, or density visibly pulses), the invert flag (decided
  by dark-on-light vs light-on-dark SOURCE, independent of page color scheme),
  8x8 Bayer ordered-dither quantization, and batched-fillStyle circle/square
  cell drawing; (4) crossfade-the-wrap looping for non-cyclic motifs (most
  natural motifs have no true loop point — do not hunt for a seam that
  doesn't exist) vs scored-seam looping for genuinely cyclic ones; (5)
  pointer-interaction by displacing sampling coordinates (not drawn output) —
  directional lean for wind/fall, rotational twist for radial subjects,
  gentle scatter for swarms, and why radial ripple is almost always wrong;
  (6) page composition and text legibility over a dot field via gradient
  scrim, mix-blend-mode:multiply (light grounds only), or a solid backing
  panel. Triggers on "dithered background", "dither animation", "Bayer dither
  canvas", "particle dither hero", "dot field animation", "dithered video
  loop", "ordered dither ordered-dither matrix", "pointer warp dither", or
  adapting a source image/video into this effect.
---

# dithered-motif-site

## Overview

Full pipeline for turning a described subject into an animated, pointer-reactive,
Bayer-dithered dot-field background: source image/video prompt -> frame
extraction -> canvas dither engine -> looping -> pointer interaction -> page
composition. Sourced from a working Higgsfield/Renaissance-oil-painting
implementation; the prompt style and the algorithm below are proven together,
but every stage generalizes to other visual styles as long as the **subject
rule** in Step 1 is respected.

**The one rule everything else depends on:** the subject must be made of many
small discrete elements (sparks, ash, tracery, a flock, a crowd, crops in a
field, repeated architecture). A solid object — one face, one animal, one
smooth mass — turns into an illegible grey blob when dithered, because the
dot field has no internal structure to latch onto. If the source is a solid
object, change the source; don't fight the dither settings.

## Pipeline

1. **Image prompt** (Higgsfield `nano_banana_pro`) — see
   `references/image-prompts.md`. Generate via the `generate_image` MCP tool
   if available, or hand the user the filled prompt to paste manually.
2. **Video prompt** (Higgsfield `seedance_2_0`, image-to-video) — see
   `references/video-prompts.md`. Locked-off camera language is
   non-negotiable; a drifting subject cannot be fixed downstream.
3. **Frame extraction** (ffmpeg) — see `references/frame-extraction.md`.
4. **Dither engine** — see `references/dither-engine.md` for the full
   algorithm/parameter spec and `references/dither-engine.ts` for a reference
   TypeScript canvas implementation to adapt directly into the target repo
   (React/Next.js `<canvas>` component or vanilla).
5. **Looping** — crossfade-the-wrap for non-cyclic motifs (the common case);
   scored-seam matching only for genuinely cyclic subjects. Covered in
   `references/dither-engine.md`.
6. **Pointer interaction** — displace sampling coordinates, not drawn output.
   Covered in `references/dither-engine.md`.
7. **Page composition** — full-bleed canvas, legibility solution (scrim /
   blend-mode / backing panel), canvas background = page ground color so
   empty cells read as background, not white. Covered in
   `references/dither-engine.md`.

## Load-bearing gotchas (do not skip)

- **Pin auto-levels for the whole sequence.** Compute the 2nd/98th percentile
  luma levels once, reuse for every frame. Recomputing per frame makes dot
  density visibly pulse — this is the single easiest thing to get wrong.
- **Invert is about the SOURCE, not the page theme.** Dark subject on light
  background -> invert so dots land on the subject. Light subject on dark
  background -> don't invert. This is independent of whether the page itself
  is light or dark mode.
- **Crop before scale** if the source has a painted/generated border baked
  in (common with AI image models) — otherwise it dithers into a hard
  rectangle sitting mid-page.
- **Airiness = cell size vs dot fill, not dot count.** If the result looks
  heavy and flat, raise `pixelSize` and lower `dotScale` together — do not
  just add more dots.
- **Most natural motifs have no true loop point.** Don't hunt for a seam
  that doesn't exist; crossfade the wrap instead (see reference doc for the
  short-sequence edge case).
- **Avoid radial ripple** for pointer interaction on natural motifs — it
  reads as a lens artifact sitting on top of the image, not something
  happening to the subject. Match interaction shape to subject shape instead
  (directional lean / rotational twist / gentle scatter).
- **`mix-blend-mode: multiply` for text legibility only works on light
  grounds.** On dark grounds use a scrim or backing panel instead.

## Sanity checklist before shipping (from source material)

- Dot density constant across the whole loop — if it pulses, auto-levels
  aren't pinned.
- No visible jump at the wrap — if there is, lengthen the crossfade.
- Headline readable at every point in the animation, not just one screenshot.
- Subject still reads as itself at the chosen `pixelSize` — coarser is more
  striking but there's a point where it dissolves.
- Looks right on a narrow viewport where the canvas is much smaller relative
  to `pixelSize` — small canvases usually need a finer grid.

## References

- `references/image-prompts.md` — Higgsfield `nano_banana_pro` prompt
  patterns and three worked examples (molten forge sparks, cathedral rose
  window, falling ash over a lost city).
- `references/video-prompts.md` — Higgsfield `seedance_2_0` image-to-video
  settings and prompt patterns, worked examples matching the image prompts.
- `references/frame-extraction.md` — ffmpeg commands for frame rate, crop,
  and background-noise flattening.
- `references/dither-engine.md` — full algorithm spec: buffer downscale,
  luma conversion, auto-levels, invert, floor clamp, 8x8 Bayer quantization,
  batched cell drawing, parameter table, color approaches (sampled / duotone
  / blended), looping, pointer interaction, page composition.
- `references/dither-engine.ts` — reference TypeScript canvas implementation
  of the engine above, meant to be adapted (not copy-pasted verbatim) into
  the target app's component structure.
