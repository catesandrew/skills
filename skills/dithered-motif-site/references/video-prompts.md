# Video prompts — Higgsfield `seedance_2_0`

**Model:** `seedance_2_0` (image-to-video)
**Cost:** 45 credits per clip

```
model: seedance_2_0
aspect_ratio: 16:9
duration: 5
resolution: 1080p
mode: std
generate_audio: false
medias: [{ value: <image job_id or media_id>, role: "start_image" }]
```

The image's job ID from the `nano_banana_pro` generation can be passed
straight into `medias[].value` — no need to re-upload it.

## The locked-off camera rule (non-negotiable)

Without explicit locked-off-camera language, the subject travels across frame
and the loop becomes unusable. If a clip comes back drifting, **regenerate**
rather than trying to fix it downstream — the frame-extraction/crop step can
flatten and crop, but it cannot undo a moving camera.

Animate what's *inside* the frame (light, particles, motion of discrete
elements), never the frame's relationship to the subject. For radial
subjects, state "no rotation" explicitly — radial subjects tempt the model to
spin them, which reads as a spinning wheel rather than an animated surface.

## Worked examples (matching the image prompts)

### Rose window

```
A colossal gothic rose window seen head-on, light slowly wheeling through the
leaded panes as the glass shifts from cool to warm, dust turning in the beams,
the stone tracery holding perfectly still. Renaissance old master oil painting
style, deep umber, slate and cobalt on flat pale cream parchment. LOCKED-OFF
STATIC CAMERA: the window stays centred and fills the frame at constant size,
never drifting. No camera pan, no zoom, no rotation. Flat empty cream background,
no wall, no scenery, no figures.
```

Animating the **light** rather than the window. Architecture that physically
moves looks wrong, and a rotating rose window reads as a spinning wheel.
Wheeling light keeps the structure authoritative while still giving the
dither something to work with frame to frame.

### Falling ash

```
Dense ash falls continuously over a half-glimpsed classical colonnade, thousands
of individual flakes drifting down at different speeds and depths, the nearest
tumbling fast and the distant ones barely moving, the architecture standing
motionless behind them. Renaissance old master oil painting style, deep umber and
pale bone on flat pale cream parchment. LOCKED-OFF STATIC CAMERA: the frame stays
put, only the ash moves. No camera pan, no zoom. Flat empty cream background, no
sky, no ground line, no figures.
```

The parallax instruction — near flakes fast, far flakes slow — does real
work. It makes the fall read as depth instead of a flat texture scrolling,
and gives the two planes different motion rates, which the crossfade loop
(see `dither-engine.md`) handles well.

## Prompt shape checklist for a new subject

- What's animating (light / particles / motion of discrete elements) —
  never the camera and never the subject's overall position/size.
- `LOCKED-OFF STATIC CAMERA:` clause, spelled out (no pan, no zoom, and "no
  rotation" for radial subjects).
- Reuse the same style/palette language as the matching image prompt so the
  video reads as an animated version of the same still.
- If the subject has depth (near/far layers), state differing motion speeds
  per depth — gives the dither more tonal range and helps the loop read as
  3D rather than a flat scrolling texture.
