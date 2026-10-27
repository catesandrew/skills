---
title: Frame Sequence Scrub Site
description: Builds a scroll-driven site where AI-generated video clips are extracted to image frames and scroll position picks which frame a canvas paints, with a frame budget, an extraction script, a preloading canvas engine, reverse-playback chapters, and poster and looped-video fallbacks.
---

# frame-sequence-scrub-site

## Why It Exists

The popular "3D scroll" look is usually not Three.js or WebGL. It is a short film cut into frames: scroll position decides which frame is painted, so the page needs no video decoder seeks and scrubs the same way in every browser. The other scroll skills here scrub a video element through `currentTime`, which stutters on some decoders and cannot be reversed for free in a different chapter. This skill covers the frame-based alternative, including its main cost, page weight.

## What It Does

It sits on top of `cinematic-scroll-site`, which keeps the setup scan, provider choice, cost gates, design package, copy gate, and publish phases. This skill adds the parts specific to frames:

- **Concept:** one subject plus one impossible moment, taken from the catalog in `product-reveal-prompts`.
- **Anchor image:** one approved 16:9 image used as the reference for every clip so the product stays consistent.
- **Frame budget** (`references/frame-budget.md`): choose frames per clip, width, and format before extracting, and say the total weight aloud.
- **Extraction** (`scripts/extract-frames.mjs`): turns a clip into 1-based, zero-padded `frame_0001.jpg` files with an exact frame count, refuses a non-empty folder, and prints the total size. `--dry-run` shows the `ffmpeg` command.
- **Engine** (`template/scrub.js` and `template/index.html`): preloads every frame behind a progress bar, then per chapter maps scroll progress through a lerp to a frame index and repaints only when the index changes, with cover-fit `drawImage` and a capped device pixel ratio.
- **Reverse chapters:** a second chapter with `data-reverse="true"` on the same frames plays a transformation backward at no extra generation cost.
- **Fallbacks:** reduced motion shows the designed poster; narrow screens get a looped MP4 and skip the frame preload.

## How To Use It

Triggers on: "image sequence scroll", "canvas frame scrub", "scroll-driven 3D without Three.js", "explode on scroll", "scroll plays the film", or a request to build a scroll site from clips with ffmpeg-extracted frames.

```sh
skills add -g catesandrew/skills --skill skills/frame-sequence-scrub-site
```

```sh
npm install @catesworks/skill-frame-sequence-scrub-site
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

Inputs: `frames_per_clip` (default 150) and `frame_width` (default 1600). Self-checks: `node --test scripts/*.test.mjs`. Extraction needs `ffmpeg` and `ffprobe`.

## Gotchas & Invariants

- Frame names start at `frame_0001`, not `frame_0000`; the engine and the extraction script both assume 1-based names.
- Every frame downloads before scroll unlocks, so pick a weight budget first. Measure with the size the script prints rather than trusting an estimate.
- Do not use a `<video>` element for the desktop scrub, and do not preload frames on a phone; use the looped MP4 there.
- Under `prefers-reduced-motion` show the poster, not an autoplaying loop.
- A reverse chapter only works if the motion reads in both directions; avoid pouring or falling debris.
- A failed frame must not hang the loader; the engine skips frames that did not load, so check the network tab for 404s.
- Keep raw clips, review files, and extracted PNGs in `_work/`, not in the deploy folder.

## Related Skills

- [cinematic-scroll-site](/docs/skills/cinematic-scroll-site): the end-to-end pipeline whose generation, design-package, copy-gate, and publish phases this skill reuses.
- [product-reveal-prompts](/docs/skills/product-reveal-prompts): start-frame and end-frame prompts and the list of impossible-moment concepts.
- [scroll-video-site](/docs/skills/scroll-video-site): the video-scrub alternative when a single file is lighter than hundreds of frames.
- [pinned-video-blob-scrub](/docs/skills/pinned-video-blob-scrub): a GSAP-pinned video scrub for plain-HTML pages.

---

_Sourced from: skills/frame-sequence-scrub-site/SKILL.md, skills/frame-sequence-scrub-site/metadata.json, skills/frame-sequence-scrub-site/references/_
