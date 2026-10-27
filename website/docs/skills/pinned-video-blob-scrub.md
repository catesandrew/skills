---
title: Pinned Video Blob Scrub
description: Recreates a GSAP ScrollTrigger pinned hero whose scroll position scrubs a Blob-preloaded MP4 through a lerped, seek-coalesced loop, with a ready-timeout fallback to stills, a reduced-motion path, mobile sources, and data-attribute config.
---

# pinned-video-blob-scrub

## Why It Exists

`scroll-video-site` covers the React and Lenis flavor of video scrubbing: a fixed full-bleed film behind the whole page. A lot of real pages are not built that way. They are Webflow or plain-HTML pages that already load GSAP, and the scrubbed video sits inside one pinned section. This skill was drafted from runtime inspection of one such production page (GSAP 3.15 with ScrollTrigger, Flip and SplitText; 25 ScrollTriggers; a pinned image/video wrapper; a 14 MB, 8.4 s MP4 preloaded as a Blob and scrubbed through a lerped rAF loop; a ready timeout that falls back to stills). Everything there was read at runtime rather than copied from source, and the page itself is deliberately not named.

The first draft was a single `SKILL.md` with several items marked unverified. The upgrade turned it into a runnable, tested template and separated what was observed from what this skill defines or verified on its own.

## What It Does

The skill splits strictly into Observed (what the inspected page did), Recipe (what the template implements) and Unverified (what nobody has run).

The template under `template/` is a no-build demo: GSAP and ScrollTrigger 3.15.0 from jsdelivr with SRI hashes, a configurable ES module, and a separate pure-logic module (`scrub-logic.js`) holding progress-to-time clamping, the lerp step with snap threshold, seek planning, the ready-gate decision, source selection and attribute parsing. Those functions have `node --test` self-checks and no dependencies.

The engine fetches the clip with a stream reader (progress ring from `Content-Length`, indeterminate if absent), builds a Blob URL, and gates readiness on duration, `readyState` and buffered fraction against a timeout. A rAF lerp loop runs only while the scrub trigger is active, coalesces seeks so one is in flight at a time, and seeks once to the exact end frame when the trigger deactivates. Pin and flip use `gsap.matchMedia()`: a scale-from-fullscreen timeline on desktop, pin only on phones, `pinSpacing: false` because the tall section already supplies the scroll length. Slow, failed or reduced-motion loads show stills (a scroll-linked crossfade, or one static image with no download).

References cover the full engine state machine, pin and flip details, encoding for scrubbing with exact ffmpeg commands, the data-attribute contract, and a measurement guide with a paste-into-DevTools probe (`scripts/probe-scrub.js`).

Measured on the template (Chromium via Playwright, 700 px viewport, 6 s clip, range 560 to 2660 px): `video.src` became a `blob:` URL with `readyState` 4. At 25, 50 and 75 percent progress `currentTime` was 1.481, 2.981 and 4.481 s against 1.5, 3.0 and 4.5 expected, and clamped at 0.001 before the range and exactly 6 s at the end and beyond. The stage was `position: fixed` inside the range with media scale 0.905, 0.81 and 0.715, and back in normal flow at the end. Blocking the clip gave `fallback` (reason `error`); delaying it 9 s with a 6 s timeout gave `fallback` (reason `timeout`) after 6117 ms; the still crossfade read opacity 0, 0.5001 and 1. Emulated `prefers-reduced-motion` gave `static` with zero clip requests. A 390 px viewport requested only `clip-mobile.mp4` (320 px wide).

## How To Use It

Triggers on: "scrub video on scroll with GSAP", "preload video as blob for scrubbing", "pinned video hero", "ScrollTrigger pin video", "video scroll fallback image", or recreating a Webflow-style scroll video section.

```sh
skills add -g catesandrew/skills --skill skills/pinned-video-blob-scrub
```

```sh
npm install @catesworks/skill-pinned-video-blob-scrub
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 60 skills as a single bundled plugin named `cw`; there is no standalone per-skill plugin.

To try the demo, serve `template/` over HTTP (not `file://`) and open `index.html`. Self-checks: `node --test scripts/scrub-logic.test.mjs`. To inspect an existing page, paste `scripts/probe-scrub.js` into the DevTools console and run `await __probe.run()`.

## Gotchas & Invariants

- Never set `currentTime` straight from `onUpdate`; use the lerp loop and keep at most one seek in flight.
- When the trigger toggles off, seek once to `progress * duration`, or a fast flick leaves the video short of its last frame.
- Use `pinSpacing: false` when the trigger is already a tall section; the default doubles the scroll distance.
- The ready timeout is a hard budget from init and covers the download. The observed 2000 ms default is too short for a 14 MB file on most links; size it to the file.
- `data-ready-threshold` is this skill's definition (fraction of duration buffered); the original page's use of it was not observed.
- Encode with a short GOP (`-g 1` to `-g 6`), no audio, `yuv420p`, `+faststart`; budget roughly 8 to 15 MB desktop and 3 to 6 MB mobile for a Blob preload.
- Keep `muted` and `playsinline` on the video; the iOS play-then-pause unlock is untested on real hardware.
- Do not revoke the Blob URL early; revoke on fallback and teardown.
- Do not combine `normalizeScroll` with Lenis, and keep it opt-in.
- Do not put the load inside `gsap.matchMedia().add`, or it re-downloads at every breakpoint change.

## Related Skills

- [scroll-video-site](/docs/skills/scroll-video-site): the React and Lenis full-bleed variant, and the origin of the seek-coalescing design.
- [cinematic-scroll-site](/docs/skills/cinematic-scroll-site): the full pipeline from concept and generation to encode, build and publish.
- [css-fade-up-reveal](/docs/skills/css-fade-up-reveal): scroll text reveals without GSAP, for the sections around the pinned video.
- [lenis-section-snap-tilt](/docs/skills/lenis-section-snap-tilt): Lenis section snapping for the rest of the page.

---

_Sourced from: skills/pinned-video-blob-scrub/SKILL.md, skills/pinned-video-blob-scrub/metadata.json, skills/pinned-video-blob-scrub/references/, skills/pinned-video-blob-scrub/template/, skills/pinned-video-blob-scrub/scripts/_
