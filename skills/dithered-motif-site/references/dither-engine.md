# The dither engine

This technique only works on subjects made of **many small discrete
elements** — a flock, a crowd, a field of crops, falling particles, repeated
architecture, a plume of smoke. A solid object (one face, one animal, one
smooth mass) turns into an illegible grey blob, because the dot field has no
internal structure to latch onto. If the source is a solid object, change the
source rather than fighting the settings.

If the source is video, scrub it and confirm the camera is locked off.
Nothing downstream can undo a moving camera, and a drifting subject makes the
loop unusable. If it drifts, regenerate the clip.

Note whether the subject is **dark on a light background** or **light on a
dark background**. This decides the `invert` flag in the algorithm below and
is the most common thing to get backwards.

## 1. Per-frame algorithm

1. Draw the source into an offscreen buffer, downscaled so one cell covers
   each `pixelSize` block of the output. All subsequent work happens on this
   small buffer, which is what makes it cheap.
2. Convert to luma with Rec. 709 weights: `0.2126 R + 0.7152 G + 0.0722 B`.
3. Auto-level against the 2nd and 98th percentiles of the luma histogram —
   then **pin those levels for the entire sequence**. Recomputing per frame
   makes the dot density visibly pulse. This is the single easiest thing to
   get wrong.
4. Apply brightness and contrast.
5. **Invert if the subject is dark on a light background**, so the dots land
   on the subject rather than the empty background. Invert the other way if
   the subject is light on dark. This is about the *source*, not about
   whether the page has a dark or light color scheme — those are
   independent.
6. Optionally clamp anything below a small floor (~0.02 normalized) to zero.
   This kills residual background texture. Raise it if haze is still
   visible; drop it to 0 if it's eating real detail.
7. Quantize with an 8x8 Bayer ordered-dither matrix into N tone levels. Build
   the 8x8 by recursing a 4x4 into each quadrant. Bayer gives the
   characteristic regular grid; error-diffusion (Floyd-Steinberg) gives a
   looser organic scatter if that's preferred instead.
8. Draw each cell as a filled circle whose radius scales with its tone
   level. Bucket cells by quantized color before drawing, so `fillStyle` is
   set a few dozen times per frame instead of once per dot. Squares also
   work and read more graphic; dots read softer.

## 2. Parameters — the ones that actually matter

```
pixelSize   6–14   cell size in output pixels. Bigger = coarser, more graphic.
spacing     0.3–0.5  fraction of each cell left as gap
dotScale    0.7–0.9  dot radius as a fraction of the remaining cell
levels      2–6    tone steps. 2 = hard 1-bit. 6 = smooth gradation.
contrast    20–35
brightness  −10–+5
```

**Airiness is cell size against dot fill, not dot count.** Big cells with
small dots leave background visible between every dot and read as delicate
and atmospheric. Small cells with full-size dots pack into a solid mass. If
it looks heavy and flat, raise `pixelSize` and lower `dotScale` together —
do not just add more dots.

## 3. Color — pick one of three approaches

- **Sampled.** Take each dot's color from the source pixel. Preserves the
  original artwork's palette. Use when the source color *is* the appeal.
- **Duotone.** Ignore source color entirely; draw every dot in one flat ink.
  Boldest and most graphic. Use for poster-like or risograph looks.
- **Blended.** Sample, then mix toward a scheme color by a `colorMix`
  factor. High mix (0.6–1.0) keeps the artwork's own palette; low mix
  (0.1–0.3) forces it into the brand color while retaining some internal
  variation.

Blended at a low mix is usually the right default for a branded page: the
subject keeps its structure but the page keeps its identity.

## 4. Animation and looping

Play frames at the rate they were extracted at (11fps from
`frame-extraction.md`).

**Most natural motifs have no true loop point.** Turbulent subjects —
flocks, smoke, falling particles, wheeling light — never return to a
previous state, so cutting from the last frame back to the first always
visibly jumps. Do not spend time hunting for a seam that does not exist.

Instead, **crossfade the wrap**: over the final ~8 frames, blend the opening
frames back in with rising alpha, so the sequence dissolves into its own
start. Guard the blend index against running past the end of the array when
the sequence is short — with a single still there is no tail to blend at
all.

If the subject *is* genuinely cyclic (a walk cycle, a rotation), a real loop
point exists instead: score every candidate window by how closely its last
frame matches its first, *relative to the average step between adjacent
frames*. A seam below ~1.0x the average step is invisible. Scoring the raw
seam alone finds loops that close but still jump.

## 5. Pointer interaction

Displace the **sampling coordinates** of each cell, not the drawn output.
The warp then costs nothing extra per frame, because it happens while
reading the already-downscaled buffer.

Give it a wide radius (~60% of the canvas) and a soft eased falloff, so it
reads as a field effect rather than a cursor-shaped bubble tracking the
mouse.

Match the motion to the subject:

- **Directional lean** (cells lean away horizontally, lift slightly) — for
  wind crossing a field, falling particles, anything with a natural
  direction.
- **Rotational twist** about the cursor — for radial subjects: a rose
  window, a vortex, a spiral.
- **Gentle scatter** — for swarms and crowds.

**Avoid radial ripple.** On a natural motif it reads as a lens artifact
sitting on top of the image rather than something happening to the subject
itself. It is the most obvious choice and almost always the wrong one.

## 6. Page composition

Full-bleed canvas behind everything. Headline and CTA over it.

**Legibility over a dot field** is the main design problem, and there are
three ways to solve it — pick per design:

1. **Gradient scrim.** A directional gradient over the artwork, heaviest on
   the side carrying the type. Cheapest and most flexible.
2. **Blend mode.** On light grounds, set the type to
   `mix-blend-mode: multiply` so dots show through the letterforms instead
   of punching a hole in the field. This looks excellent but only works on
   light backgrounds — on dark grounds skip it and rely on color contrast.
3. **Solid backing panel.** For centred copy over a dense dither, put a
   solid panel behind the text block. Necessary when the dither is heavy
   (low `levels`, high `dotScale`); unnecessary when it's airy.

Set the canvas background to the scheme's ground color so the "empty" cells
are the page background, not white.

## 7. Sanity checks before shipping

- Does the dot density stay constant across the whole loop? If it pulses,
  the auto-levels are not pinned.
- Is there a visible jump at the wrap? If so, lengthen the crossfade.
- Can the headline be read at every point in the animation, not just the
  frame that happened to get screenshotted?
- Does the subject still read as itself at the chosen `pixelSize`? Coarser
  is more striking but there is a point where the subject dissolves.
- Does it still look right on a narrow viewport, where the canvas is much
  smaller relative to `pixelSize`? Small canvases usually need a finer grid.

See `dither-engine.ts` for a reference TypeScript implementation of Steps
1-5 above, meant to be adapted into the target app's component/rendering
structure rather than copy-pasted verbatim.
