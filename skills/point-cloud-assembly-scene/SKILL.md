---
name: point-cloud-assembly-scene
description: >-
  Use when building a WebGL/Three.js scene where forms are made entirely of
  points sampled from parametric math (no imported geometry, no scans) that
  drift as loose dust and assemble into shape on scroll or interaction, then
  exhale back apart. Covers parametric point sampling (lathe/revolve
  profiles, swept UV surfaces, boolean plane-cut fractures, proportion over
  raw point count), a single shared `BufferGeometry` with per-point
  `home`/`dust`/`seed` custom attributes driven by one assembly uniform so N
  forms cost one draw call instead of N, cheap fake curl-noise turbulence for
  the dust field, cursor-reactive swirl, the `frustumCulled = false`
  requirement when real positions live in the vertex shader, and a
  documented sentinel-vector bug class where an animation target silently
  breaks in headless/no-pointer environments. Triggers on "point cloud
  effect", "particles assemble into shape", "procedural point cloud
  Three.js", "dust reveal animation", "GPU point cloud morph", "parametric
  geometry no assets", or building a scroll/interaction-driven "form
  emerging from particles" scene.
---

# point-cloud-assembly-scene

## Overview

A scene made of thousands of points, sampled entirely from parametric
equations, that live as loose drifting dust and pull together into a
recognizable shape when a section is active (scroll position, hover, or any
other trigger) — then let go and disperse again when it isn't. No imported
meshes, no 3D scans, no downloaded assets: every point position is computed
math. This skill covers the two hard parts: (1) generating point positions
that actually read as the intended shape at a glance, and (2) architecting
the buffer/shader so that switching between multiple forms is cheap and the
assembly transition feels alive rather than snapping.

**Stack assumed:** Three.js + GLSL (custom `ShaderMaterial`/`RawShaderMaterial`
on a `Points` object) + vanilla JS or any framework wrapper. The technique is
framework-agnostic; only the buffer setup needs adapting to React
(`@react-three/fiber`) vs vanilla Three.js.

## Shape generation: making math read as form

The single biggest quality lever is **even surface coverage, not even
parameter coverage.** Sampling `t` uniformly in `[0, 1]` and mapping it
through a curved profile clumps points wherever the curve is steep and
starves points wherever it's flat. Always compute (or approximate) arc length
and sample uniformly along *that*, then map back to the parameter:

```js
// DON'T: uniform-in-parameter-space, clumps at curves
const t = Math.random();
const { r, y } = profileAt(t);

// DO: uniform-in-arc-length
const s = Math.random() * totalArcLength;
const { r, y } = profileAtArcLength(s); // walk cumulative segment lengths to find t
```

A few generation patterns cover most recognizable forms:

- **Lathe/revolve** — define a 2-D `[radius, height]` profile, sample a point
  along its arc length, then spin it to a random angle around an axis. Good
  for vessels, columns, anything rotationally symmetric.
- **Swept UV surface** — sample a normalized `(u, v)` rectangle, map `u,v`
  through a silhouette function (taper, scallop, lobe) to get 3-D position.
  Good for wings, blades, leaves, ribbons.
- **Boolean plane-cut** — generate a full form, then discard any point on one
  side of an (optionally tilted) plane: `if (dot(p - planeOrigin, planeNormal) > 0) discard`.
  Keep a thin jittered band right at the cut to read as a broken/torn edge
  rather than a perfectly flat cross-section. Good for fractures, ruins,
  partial reveals.
- **Composite/capsule parts** — build organic multi-part forms (hands, limbs,
  branching structures) from small filled-capsule or tapered-cylinder
  primitives rather than one continuous surface function. Easier to get
  proportions right piece by piece.

**Proportion beats point count.** A shape that doesn't read correctly needs
better proportions, not more points — thin/long parts especially tend to
read as generic blobs or "rakes" (a hand with overly long thin fingers is
the canonical failure) regardless of density. Iterate on the geometric
proportions first; density is a finishing pass, not a fix.

## Architecture: one buffer, many forms

The naive approach — a separate `Points` object per form — means N draw
calls and N sets of resident GPU buffers, and a hard cut when switching
between them. Instead, use a **single `BufferGeometry`** sized to the
largest form's point count, with three custom per-point attributes:

- `aHome` — this point's target position in the *currently active* form.
- `aDust` — a stable, randomly-assigned resting position (e.g. a loose
  spherical shell) — computed once, never changed.
- `aSeed` — a random `0–1` value used to stagger timing and vary point size.

Switching forms rewrites `aHome` in place and flags it for GPU re-upload —
no new geometry, no new draw call:

```js
function loadForm(points) {
  aHome.set(points.subarray(0, points.length));
  // any leftover slots (this form has fewer points than the buffer's max)
  // get parked at their dust position so they simply vanish into the field
  for (let i = points.length / 3; i < MAX_POINTS; i++) {
    aHome[i * 3]     = aDust[i * 3];
    aHome[i * 3 + 1] = aDust[i * 3 + 1];
    aHome[i * 3 + 2] = aDust[i * 3 + 2];
  }
  geometry.attributes.aHome.needsUpdate = true;
}
```

A single scalar uniform (`uAssembly`, `0` = fully dust, `1` = fully
assembled) drives a per-point `mix(aDust, aHome, assembly)` in the vertex
shader. Critically, **offset each point's effective progress by its own
`aSeed`** rather than applying the uniform identically to every point — that
stagger is what makes the form *breathe* into existence instead of snapping
as one rigid block. Drive `uAssembly` toward a target (e.g. how centered the
form's trigger section is in the viewport) with easing each frame, the same
damped-toward-target pattern used for scroll-scrubbed video (see
`scroll-video-site`) — same underlying idea, different target quantity.

## Dust field turbulence

True curl noise needs the analytic derivative of a noise field — real cost
for a background effect. Three layered `sin`/`cos` terms per axis produce a
swirling, divergence-free-*looking* field that's effectively free on the
GPU and indistinguishable at this scale:

```glsl
vec3 fakeCurl(vec3 p, float t) {
  float x = sin(p.y * 1.3 + t * 0.5) + cos(p.z * 1.1 - t * 0.4);
  float y = sin(p.z * 1.2 - t * 0.45) + cos(p.x * 1.4 + t * 0.5);
  float z = sin(p.x * 1.1 + t * 0.4) + cos(p.y * 1.3 - t * 0.5);
  return vec3(x, y, z);
}
```

For cursor reactivity: project the pointer onto a fixed plane in scene
space, and drive a Gaussian falloff by distance (`exp(-d*d * k)`) that
scales both a tangential shove from the curl field and a per-point size
boost — grains near the cursor get pushed and brighten. Derive the swirl
*strength* from pointer velocity (not just position) so it decays naturally
when the pointer stops moving, rather than needing a separate timer.

## Rendering setup

- **`points.frustumCulled = false` is required.** Real point positions are
  computed in the vertex shader from custom attributes, not from the
  geometry's literal position buffer — Three.js's automatic bounding-sphere
  computation is wrong for this and will cull the entire object the moment
  its nominal origin leaves the frustum, even though the shader-computed
  positions are on screen.
- **Additive blending + `depthWrite: false` + a soft circular
  `gl_PointCoord` mask** (discard or fade points outside a circle, feather
  the edge) gives overlapping grains a glow instead of hard square dots.

## Common Mistakes

- **Sampling uniformly in parameter space instead of arc length** — produces
  visible clumping at curved sections of a profile; always convert to
  arc-length sampling.
- **One `Points` object per form** — N draw calls, N buffer sets, and no way
  to get a smooth cross-fade. Use the single shared-buffer / rewritten-`aHome`
  pattern instead.
- **Applying the assembly uniform identically to every point** — produces a
  rigid snap instead of an organic assemble/disperse. Stagger by per-point
  seed.
- **Forgetting `frustumCulled = false`** — the object vanishes as soon as its
  literal (unused) position buffer's bounding sphere leaves the frustum,
  even though the real shader-computed geometry is fully on screen.
- **Reusing one mutable vector as both a UI sentinel and a live animation
  target.** A documented real failure: initializing a shared vector to an
  "offscreen" sentinel like `(999, 999)` and overwriting it on
  `pointermove` works fine in a real browser (the pointer moves within
  milliseconds) but is catastrophic in any environment that never fires
  `pointermove` — headless rendering, screenshot automation, SSR hydration
  probes. The sentinel value never gets overwritten, and whatever consumes
  it (a camera target, an easing destination) chases a nonsense value
  forever. Geometry and uniforms all check out; nothing draws (or the camera
  points at empty space) and the bug is invisible in normal interactive use.
  **Never share mutable state between an "unset" sentinel and a value that's
  also a live animation target** — use a separate `hasPointer` boolean
  instead of overloading the position value itself as its own presence flag.
  When geometry/uniforms check out but nothing renders correctly, print the
  camera/animation target before suspecting the shader.
