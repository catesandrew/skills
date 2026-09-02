---
title: Dithered Motif Site
description: Provides the full pipeline for building an animated, pointer-reactive, Bayer-dithered dot-field background from a described subject, from Higgsfield image/video prompts to the canvas dither engine and page composition.
---

# dithered-motif-site

## Why It Exists

This skill has no traceable prior history anywhere — a search of `~/.dotfiles` for any path named `dithered-motif-site`, any commit message mentioning "dithered", and a pickaxe search for the literal string "dithered" across `agent-skills/` all return zero hits. It first appears in the public repo's bulk `13fbfbc` ("Initial import: 49 cross-agent skills migrated from dotfiles") commit despite that commit's "migrated from dotfiles" framing — meaning either that framing is imprecise for this one skill specifically, or it was added fresh as part of the same commit sweep rather than actually migrated. No further detail is available; this is stated plainly rather than guessed at.

## What It Does

The skill documents a complete, six-stage manual pipeline for turning a described subject into an animated, pointer-reactive, Bayer-dithered dot-field used as a full-bleed page background. It opens with the one rule everything else depends on: the subject must be made of many small discrete elements (sparks, ash, tracery, a flock, a crowd, repeated architecture) — a solid object (one face, one animal, one smooth mass) turns into an illegible grey blob when dithered, because the dot field has no internal structure to latch onto. If the source is a solid object, the fix is to change the source, not the dither settings.

The pipeline runs: (1) an image prompt for Higgsfield `nano_banana_pro`, generated via the `generate_image` MCP tool or handed to the user to paste manually; (2) a video prompt for Higgsfield `seedance_2_0` (image-to-video), where locked-off static camera language is non-negotiable because a drifting subject cannot be fixed downstream; (3) ffmpeg frame extraction at roughly 11fps, cropping any painted border before scaling and flattening background noise; (4) the canvas dither engine itself, covering downscale-to-buffer, Rec.709 luma conversion, percentile auto-levels that must be pinned once for the whole sequence (never recomputed per frame, or dot density visibly pulses), an invert flag decided purely by dark-on-light vs. light-on-dark in the *source* (independent of the page's own light/dark theme), 8x8 Bayer ordered-dither quantization, and batched-fillStyle circle/square cell drawing; (5) looping — crossfade-the-wrap for non-cyclic motifs (the common case, since most natural motifs have no true loop point) versus scored-seam matching only for genuinely cyclic subjects; (6) pointer interaction by displacing sampling coordinates rather than drawn output — directional lean for wind/fall, rotational twist for radial subjects, gentle scatter for swarms — explicitly warning that radial ripple is almost always the wrong choice because it reads as a lens artifact rather than something happening to the subject.

Five reference files back the pipeline: `image-prompts.md` and `video-prompts.md` (Higgsfield prompt patterns with three worked examples — molten forge sparks, cathedral rose window, falling ash over a lost city), `frame-extraction.md` (ffmpeg commands), `dither-engine.md` (the full algorithm/parameter spec), and `dither-engine.ts` (a reference TypeScript canvas implementation meant to be adapted, not copy-pasted, into the target app).

## How To Use It

Triggers on: "dithered background", "dither animation", "Bayer dither canvas", "particle dither hero", "dot field animation", "dithered video loop", "ordered dither ordered-dither matrix", "pointer warp dither", adapting a source image/video into this effect.

```sh
skills add -g catesandrew/skills --skill skills/dithered-motif-site
```

```sh
npm install @catesworks/skill-dithered-motif-site
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 52 skills as a single bundled plugin named `cw` — there is no standalone per-skill plugin.

## Gotchas & Invariants

- The subject must be many small discrete elements, never a single solid mass — this is the one rule everything downstream depends on.
- Video prompts must demand a locked-off static camera; a drifting subject cannot be corrected in post.
- Auto-levels (2nd/98th percentile luma) must be computed once and pinned for the entire sequence — recomputing per frame is "the single easiest thing to get wrong" and makes dot density visibly pulse.
- The invert flag depends on the source image's own dark/light polarity, not on whether the page itself uses light or dark mode.
- Crop any painted/generated border before scaling, or it dithers into a hard rectangle sitting mid-page.
- To fix "heavy and flat" results, raise `pixelSize` and lower `dotScale` together — don't just add more dots.
- Most natural motifs have no true loop point; crossfade the wrap rather than hunting for a seam that doesn't exist.
- Avoid radial ripple for pointer interaction on natural motifs; match interaction shape to subject shape instead.
- `mix-blend-mode: multiply` for text legibility only works on light grounds — use a scrim or backing panel on dark grounds.
- Canvas background color should match the page ground color so empty cells read as background, not white.

## Related Skills

- [scroll-video-site](/docs/skills/scroll-video-site) — another generative-frontend pipeline skill using produced media as a page centerpiece.
- [point-cloud-assembly-scene](/docs/skills/point-cloud-assembly-scene) — a related generative-frontend particle/motif technique.
- [design-critique-loop](/docs/skills/design-critique-loop) — the review loop suited to judging a build using this effect.

---

_Sourced from: skills/dithered-motif-site/SKILL.md, skills/dithered-motif-site/metadata.json, public-repo commit `13fbfbc`_
