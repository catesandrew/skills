# Image prompts — Higgsfield `nano_banana_pro`

**Model:** `nano_banana_pro`
**Settings:** `aspect_ratio: 16:9`, `count: 1` (1k resolution is plenty — the
dither downsamples to a coarse cell grid anyway)
**Cost:** 2 credits each

## The subject rule

The subject must be made of **many small discrete elements**. A solid object —
one animal, one face, one smooth mass — turns into an illegible grey blob when
dithered, because the dot field has no internal structure to latch onto.

Expect a painted parchment (or equivalent) border in the output despite a
"no border" instruction in the prompt. That's fine — it's handled downstream
by the crop step in frame extraction (see `frame-extraction.md`).

## Prompt shape (generalize from these three)

Each worked example below follows the same shape:

1. Style + subject, with an explicit **element count** ("thousands of
   individual...", "hundreds of...") to force the many-small-elements
   structure.
2. A flat, plain background — gives the dither clean negative space instead
   of competing texture.
3. A density gradient across the frame (dense at a focal point, thinning
   toward the edges) — gives the dither a natural falloff instead of uniform
   noise.
4. Explicit exclusions ("no figures, no scenery, no horizon, no frame, no
   border") to keep the frame free of anything that isn't the discrete-element
   subject.

## Worked examples

### 1. Molten forge sparks

```
Renaissance old master oil painting study of a great shower of forge sparks
bursting from struck iron, thousands of individual glowing embers arcing outward
and dying into darkness. Deep umber and ember-orange pigments on a plain flat
pale cream parchment background. The spray fills the frame, dense and violent at
the strike point and scattering to isolated single sparks at the edges. No anvil,
no figures, no scenery, no horizon. No frame, no border.
```

Sparks are already points of light, so the dot field becomes the subject
rather than a filter over it. The density gradient from strike point to edge
gives the dither a natural falloff.

### 2. Cathedral rose window

```
Renaissance old master oil painting study of a colossal gothic rose window seen
head-on, hundreds of radiating stone tracery segments and leaded glass panes
forming one vast concentric wheel. Deep umber, slate and cobalt pigments on a
plain flat pale cream parchment background. The window fills the frame, dense
with fine tracery at the centre and breaking into individual panes at the rim.
No wall, no scenery, no figures. No frame, no border.
```

Radial symmetry gives a strong centre of gravity, and the repeated tracery is
exactly the fine structure the Bayer matrix renders well. Looks best in a
cobalt or indigo scheme.

### 3. Falling ash over a lost city

```
Renaissance old master oil painting study of dense falling ash drifting over a
half-glimpsed classical colonnade, thousands of individual flakes suspended at
every depth, the architecture dissolving behind them. Deep umber and pale bone
pigments on a plain flat pale cream parchment background. The fall fills the
entire frame edge to edge, heaviest in the foreground and thinning to isolated
specks in the distance. No sky, no ground line, no figures. No frame, no border.
```

Two layers at different depths — falling particles in front, dissolving
structure behind — which gives the dither more tonal range than a
single-plane motif.

## Adapting to a new subject/style

Keep the four-part shape above. Swap the art style (Renaissance oil painting
is just one option — risograph, halftone print, engraving, etc. all work as
long as they render as flat pigment blocks rather than photographic
gradients) and swap the discrete-element subject, but keep: explicit element
count, flat plain background, a density gradient, and hard exclusions.
