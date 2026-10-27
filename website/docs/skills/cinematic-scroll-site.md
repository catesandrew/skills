---
title: Cinematic Scroll Site
description: End-to-end pipeline for cinematic scroll-driven websites, covering tier choice, a written design package, cost-gated AI image and video generation, ffmpeg scrub encodes, a static build from a starter template, a copy gate, and publishing.
---

# cinematic-scroll-site

## Why It Exists

`scroll-video-site` documents the engine that scrubs a video with scroll, but a real site starts earlier and ends later: someone has to decide what the hero shows, generate the footage without burning credits, encode it so it scrubs smoothly, write copy that does not read as AI, and put the result online. `cinematic-scroll-site` is that whole pipeline as one orchestrating skill.

It was reconstructed from a third-party "10K Websites" skill whose `SKILL.md` was shared publicly while its `references/` folder was not. The phase structure, tiers, gates, and copy rules follow that `SKILL.md`. The reference files (`prompt-laws.md`, `design-package.md`, `ffmpeg-recipes.md`) were written fresh from what the original said each should contain, so their specifics are this repo's, not the original author's. Hosting-specific deploy and troubleshooting files were deliberately dropped: publishing is a static folder on any host, and known pitfalls live in the skill's Common Mistakes list.

## What It Does

The skill runs ten phases: a setup scan, intake, tier choice, concept proposals, a Creative Director's Loop that produces a design package, generation, encode, build, adversarial verification, and publish.

Three tiers set scope and cost. Tier 1 is one hero (about 6 to 8 seconds of scroll) from one starting frame and one video. Tier 2 chains several segments, each starting from the previous clip's final frame, into one long scrub. Tier 3 adds a richer below-fold on top of the chain.

Money is gated at every step. The starting frame is preflighted for free and priced aloud first, the video model is chosen only after the frame is approved (the same shot preflighted on the top two or three models, with real prices and the remaining balance), and every video segment passes a watch-it-yourself gate from a review folder outside the deploy folder before the next credit moves.

The design package (`references/design-package.md`) is the single deliverable of the design loop and the only input to the build: brand premise, palette tokens, type trio, signature element, band map of scroll ranges to copy, a callouts and state-synced UI table (leader-line labels, meters, and backgrounds tied to scroll progress), every line of copy, below-fold outline, and vector layer plan. Copy ships verbatim.

The prompt laws (`references/prompt-laws.md`) include four rules added from the frame-sequence and portfolio-style builds: a transformation clip that reads in both directions is reusable as a reverse chapter, a multi-clip site uses one approved anchor image as the reference for every clip, a real person as the hero needs an identity reference photo and a fixed wardrobe, and rerolls are spent on the hero clip first.

Bundled tooling mirrors the pipeline: `scripts/setup.sh` for the tool scan, `scripts/encode.mjs` for hero, poster, last-frame, and concat encodes, `scripts/copy-gate.mjs` for the em-dash and stock-word check, and a `template/` with a vanilla-JS scrub engine, loading ring, band map, and a poster layout for touch devices and reduced motion. Probing, frame inspection, and delivery checks are delegated to the `ffmpeg-skill` companion; the scrub engine's deeper gotchas live in `scroll-video-site`.

## How To Use It

Triggers on: "build me a website for X", "cinematic scroll site", "scroll-driven hero video", "scrolling website with AI video", "Higgsfield hero", "Kling hero", or "10K websites" style requests.

```sh
skills add -g catesandrew/skills --skill skills/cinematic-scroll-site
```

```sh
npm install @catesworks/skill-cinematic-scroll-site
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs every skill in the repo as a single bundled plugin named `cw`; there is no standalone per-skill plugin.

The generation phase needs an image and video provider (Higgsfield or Kling, chosen with the user; see `references/providers.md`) and `ffmpeg`. Self-checks for the bundled scripts: `node --test scripts/copy-gate.test.mjs scripts/encode.test.mjs`.

## Gotchas & Invariants

- Run the setup scan first and report a ✓/✗ checklist before asking the user anything; do not raise hosting or domains until the user has approved the site.
- Never generate video before the starting frame is approved: a roughly 2-credit fix becomes a roughly 50-credit one.
- Inspect the starting frame yourself for invented real-world logos and broken anatomy before animating; image models add trademarks unprompted.
- Every video segment, in a chain too, passes its own video gate; chained segments start from the previous segment's lossless last frame uploaded as an input image, not a regenerated one.
- Decline the connector's style presets and auto-enhance; they break palette and chaining consistency.
- Prices change: preflight and read them live, never quote from memory.
- A failed or moderation-flagged render gets one reworded retry, then a more lenient model; check the balance instead of assuming a refund, and tell the user about every retry (`references/providers.md`).
- Colorway variants of an approved still come from an `ffmpeg` hue shift, not another generation (`references/ffmpeg-recipes.md`).
- Encode for scrubbing: no audio, short keyframe interval, `+faststart`; try `-g 1` only if a short GOP still stutters.
- Keep raw generations, review clips, extracted frames, and the design package out of the deploy folder.
- Copy from the design package ships verbatim; the copy gate must come back clean (no em dashes, none of the listed stock words) across the whole file, especially lower sections.
- Phones and reduced-motion users get a designed still, not the scrub; say this at the concept stage, not at a money moment.
- Validate band ranges with a flick-scroll test and audit each band's worst-frame legibility before showing anyone.
- Test the live site on desktop and on a real phone over a real network; Chrome shows scroll choppiness first.

## Related Skills

- [scroll-video-site](/docs/skills/scroll-video-site): the scrub engine this pipeline builds on (damped playhead, seek coalescing, Lenis and GSAP wiring, iOS quirks).
- [frame-sequence-scrub-site](/docs/skills/frame-sequence-scrub-site): the canvas frame-scrub variant, for clips extracted to frames instead of a scrubbed video.
- [dithered-motif-site](/docs/skills/dithered-motif-site): another generative-frontend pipeline using produced media as the page centerpiece.
- [five-act-scroll-story](/docs/skills/five-act-scroll-story): a narrower Next.js variant with exactly five user-described acts and an optional Shopify path.
- [point-cloud-assembly-scene](/docs/skills/point-cloud-assembly-scene): a related generative-frontend motif technique.

---

_Sourced from: skills/cinematic-scroll-site/SKILL.md, skills/cinematic-scroll-site/metadata.json, skills/cinematic-scroll-site/references/_
