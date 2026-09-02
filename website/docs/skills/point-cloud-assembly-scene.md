---
title: Point Cloud Assembly Scene
description: Builds WebGL/Three.js scenes composed entirely of parametrically sampled points that drift as loose dust and assemble into shape on scroll or interaction, with a single shared buffer geometry and rendering pitfalls documented.
---

# point-cloud-assembly-scene

## Why It Exists

Unlike most of this catalog, this skill was authored directly in the public `catesandrew/skills` repo, not migrated from dotfiles — confirmed by an empty result across all three dotfiles archaeology passes (path match, message grep, and pickaxe). It was added in commit `1b364bf` ("feat: add point-cloud-assembly-scene skill"). Per that commit's own message, it captures a Three.js technique for scenes where "forms are sampled entirely from parametric math (no imported geometry/scans) and assemble from drifting dust on trigger," covering arc-length-correct shape sampling, a shared `BufferGeometry` with per-point home/dust/seed attributes so N forms cost a single draw call, fake curl-noise turbulence, and two specific real-world gotchas (`frustumCulled = false`, and a sentinel-vector-as-animation-target bug). The commit explicitly notes the skill was "distilled and rewritten from a public build-log page, not copied verbatim" — i.e. it generalizes a technique observed elsewhere into a reusable, non-verbatim skill rather than documenting Andrew's own prior production code.

## What It Does

The skill covers two hard problems in building a "particles assemble into a recognizable shape" WebGL effect. First, shape generation: it stresses that even *surface* coverage — not even *parameter* coverage — is what makes procedural math read as a recognizable form, and prescribes sampling uniformly along arc length (walking cumulative segment lengths) rather than uniformly in the raw curve parameter, which otherwise clumps points at steep sections and starves flat ones. It gives four concrete generation patterns: lathe/revolve (2-D radius/height profile spun around an axis, good for vessels/columns), swept UV surfaces (silhouette function over a `(u,v)` rectangle, good for wings/blades/leaves), boolean plane-cut (discard points on one side of a plane, with a jittered band at the cut edge to read as torn rather than flat, good for fractures/ruins), and composite capsule/cylinder parts for organic multi-part forms like hands or limbs. It emphasizes proportion over point density as the primary quality lever — thin/long parts read as generic blobs regardless of density until the underlying proportions are fixed.

Second, it covers the buffer architecture for switching between multiple forms cheaply: one shared `BufferGeometry` sized to the largest form, with `aHome` (current target position), `aDust` (a stable randomly-assigned resting position, computed once), and `aSeed` (per-point random stagger value) as custom attributes, all driven by a single `uAssembly` uniform mixed per-point in the vertex shader — critically offset by each point's own `aSeed` so the assembly *staggers* into an organic breathing motion rather than snapping as one rigid block. It also documents a cheap three-layered sin/cos "fake curl noise" function for dust-field turbulence (real curl noise needs an analytic derivative, unnecessary at this visual scale) and cursor-reactive swirl driven by pointer *velocity* rather than raw position so it decays naturally.

Its "Common Mistakes" section is effectively a debugging reference: parameter-space vs arc-length sampling clumping, one-`Points`-object-per-form defeating cross-fades, uniform (non-staggered) assembly progress producing a rigid snap, forgetting `frustumCulled = false` (which silently culls the whole object because Three.js's automatic bounding-sphere check doesn't know real positions live in the vertex shader), and — the most detailed entry — a documented real bug class where a shared mutable vector doubles as both an "unset" sentinel (e.g. `(999, 999)`) and a live animation target, which works fine interactively (the pointer fires within milliseconds) but breaks catastrophically and silently in headless/no-pointer environments (SSR, screenshot automation) because the sentinel is never overwritten.

## How To Use It

Triggers on: "point cloud effect", "particles assemble into shape", "procedural point cloud Three.js", "dust reveal animation", "GPU point cloud morph", "parametric geometry no assets", building a scroll/interaction-driven "form emerging from particles" scene.

```sh
skills add -g catesandrew/skills --skill skills/point-cloud-assembly-scene
```

```sh
npm install @catesworks/skill-point-cloud-assembly-scene
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 52 skills as a single bundled plugin named `cw` — there is no standalone per-skill plugin.

## Gotchas & Invariants

- Sample uniformly along arc length, never uniformly in raw curve parameter — parameter-space sampling visibly clumps at curved sections.
- Use one shared `BufferGeometry` sized to the largest form and rewrite `aHome` in place when switching forms — a separate `Points` object per form means N draw calls and no smooth cross-fade.
- Offset the `uAssembly` progress by each point's own `aSeed`; applying it uniformly to every point produces a rigid snap instead of an organic assemble/disperse motion.
- `points.frustumCulled = false` is required whenever real positions are computed in the vertex shader — Three.js's automatic bounding-sphere culling is wrong for this and will invisibly cull the entire object.
- Never let one mutable vector serve as both an "unset" sentinel and a live animation target — use a separate `hasPointer` boolean, or the value will chase a nonsense sentinel forever in any environment that never fires `pointermove` (headless render, SSR, screenshot automation).
- Proportion beats point count — fix geometric proportions first; adding density does not fix a shape that doesn't read correctly.
- Derive swirl/turbulence strength from pointer *velocity*, not raw position, so it decays naturally without a separate timer.

## Related Skills

- [scroll-video-site](/docs/skills/scroll-video-site) — the skill's own text points to this for the shared damped-toward-target easing pattern driving `uAssembly`.
- [dithered-motif-site](/docs/skills/dithered-motif-site) — sibling generative-frontend/WebGL skill in this catalog.

---

_Sourced from: skills/point-cloud-assembly-scene/SKILL.md, skills/point-cloud-assembly-scene/metadata.json, catesandrew/skills git history (commit `1b364bf`)_
