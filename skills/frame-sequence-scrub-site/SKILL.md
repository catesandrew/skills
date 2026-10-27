---
name: frame-sequence-scrub-site
description: >-
  Use when the user wants a scroll-driven site where AI-generated video clips
  are split into image frames and scroll position picks which frame a canvas
  paints, instead of scrubbing a video element: a product that explodes and
  reassembles, a walk through a space, a transformation played forward and
  backward. Triggers on "image sequence scroll", "canvas frame scrub",
  "scroll-driven 3D without Three.js", "explode on scroll", "scroll plays the
  film", "frame-by-frame scroll animation", or a request to build a scroll
  site from clips with ffmpeg-extracted frames. Covers the frame budget,
  extraction, canvas engine, chapters, reverse playback and the mobile and
  reduced-motion fallbacks; the generation, design-package, copy-gate and
  publish phases live in cinematic-scroll-site.
---

# frame-sequence-scrub-site

The viral "3D scroll" effect is not Three.js or WebGL. It is a film: short clips
become hundreds of JPEG or WebP frames, and the scroll position decides which
frame is painted onto a full-viewport canvas. It is deterministic and needs no
video decoder seek, so it scrubs smoothly everywhere. The price is page weight.

## Frames or video scrub?

| Pick | When |
|---|---|
| **Frames (this skill)** | Short clips (about 5-10 s each, a few of them), a transformation you want to play backward for free, or any browser where `video.currentTime` seeking stutters. |
| **Video scrub** (`scroll-video-site`, `pinned-video-blob-scrub`) | One long continuous move, a tight weight budget, or the user wants a single 15-25 MB file instead of hundreds of stills. |

## Companion skills (use them, do not reimplement)

| Need | Use |
|---|---|
| Setup scan, provider choice, cost gates, design package, copy gate, publish | `cinematic-scroll-site` (Phases 1-6, 9, 10) |
| Start and end frame prompts, the impossible-moment concept list | `product-reveal-prompts` |
| Prompt laws for generations that survive scrubbing | `cinematic-scroll-site/references/prompt-laws.md` |
| Probe, join or inspect clips and frames | `ffmpeg-skill` |
| Video scrub when frames are too heavy | `scroll-video-site` |

If a companion is not installed, say so and follow its phase from the inline notes here.

## Bundled tools

- `scripts/extract-frames.mjs`: clip to `frame_0001.jpg`... with an exact frame count; prints the total weight. `--dry-run` prints the command.
- `template/index.html` + `template/scrub.js`: starter page and canvas engine. Copy into the deploy folder and fill the `{{placeholders}}`.
- Self-checks: `node --test scripts/*.test.mjs`.

## Workflow

1. **Concept.** One subject plus one impossible moment (explosion, fly-through, molten birth, frozen time, bloom, descent, light). The catalog is in `product-reveal-prompts`. Change the subject, never the system.
2. **Anchor image.** One 16:9 image, approved by the user before any video credits move. Use it as the image reference on every clip so the product keeps its identity.
3. **Clips.** Typically three 10-second clips: a hero move, the transformation, a macro. Follow `prompt-laws.md`; run the cost and per-clip video gates from `cinematic-scroll-site` Phase 6.
4. **Pick the budget first.** Decide frames per clip, width and format using `references/frame-budget.md`. Default `${input:frames_per_clip:150}` frames at `${input:frame_width:1600}` px. Say the total weight out loud before extracting.
5. **Extract.** `node scripts/extract-frames.mjs clips/orbit.mp4 _work/frames/orbit --frames 150 --width 1600`. Check the printed count and MB against the budget, then move `frames/` into `assets/`. Raw clips and review files stay in `_work/`, never in the deploy folder.
6. **Build from `template/`.** One `<section class="chapter">` per clip; `data-frames` holds the path with `{n}`, `data-count` the frame count. Bands, loader, poster and looped-MP4 fallback are already wired.
7. **Verify** (see below), then publish with `cinematic-scroll-site` Phase 10.

## Chapters and reverse playback

A transformation clip plays forward for the explosion and backward for the
reassembly. Add a second chapter that points at the same frames with
`data-reverse="true"`: one clip, two moments, no extra credits. It only works if
the motion reads correctly in both directions (see law 2 in `prompt-laws.md`).

## Engine rules (already in `template/scrub.js`, keep them when editing)

- Preload every frame behind a progress bar and unlock scroll only when done; a failed frame must not hang the loader.
- Per chapter: progress from the pinned section, lerp toward it, `frameIndex`, repaint only when the index changes.
- Cover-fit with `drawImage` and cap the canvas at 2x device pixel ratio; mark the chapter dirty on resize.
- Skip chapters that are off screen.
- Frame names are 1-based and zero-padded, matching `frame_%04d`.

## Fallbacks

- `prefers-reduced-motion`: show the designed poster, no autoplay, no frame preload.
- Narrow screens (under 768 px): looped MP4 per chapter instead of hundreds of frames.
- If a host rejects the size: reduce to 100 frames per clip at 1280 px or switch to WebP. Never replace the sequence with a `<video>` on desktop; if that is truly needed, switch to `scroll-video-site`.

## Verify (adversarial, before showing anyone)

- The loader reaches 100 percent, then scroll unlocks.
- Every chapter scrubs forward and back; reverse chapters land on the right frames. The engine writes the painted index to `canvas.dataset.frame`, so assert it at 0, 50 and 100 percent (a reverse chapter reads last frame, middle, first).
- Callouts and bands appear at the intended progress; flick-scroll top to bottom and confirm they land.
- No console errors and no 404 in the network tab for any frame.
- Run the copy gate from `cinematic-scroll-site` (`scripts/copy-gate.mjs`) over `index.html`.
- Test on a phone over a real network and with reduced motion on.

## Common Mistakes

- Generating video before the anchor image is approved.
- Extracting at full width with no weight budget; 450 frames at 1600 px can run to tens of megabytes.
- Using a `<video>` element for the desktop hero, or a template or background video, when the point is the frame scrub.
- Preloading frames on a phone instead of falling back to the looped MP4.
- Off-by-one frame names: ffmpeg starts at `frame_0001`, not `frame_0000`.
- Repainting every animation frame instead of only on a frame change.
- Reverse chapter on motion that only reads one way (pouring, falling debris).
- Autoplaying a looped video under `prefers-reduced-motion` instead of the poster.
- Shipping `_work/` (raw clips, review files, extracted PNGs) inside the deploy folder.
- Paraphrasing authored copy during the build.

## Inputs

| Param | Description | Default |
|---|---|---|
| `${input:frames_per_clip}` | Frames extracted per clip | 150 |
| `${input:frame_width}` | Max frame width in px | 1600 |
