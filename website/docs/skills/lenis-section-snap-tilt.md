---
title: Lenis Section Snap Tilt
description: A one-section-per-gesture scroll engine built on Lenis, with trackpad-flick debouncing, touch and keyboard parity, and scroll-driven CSS 3D tilt panels, with a strict split between what was measured on a reference page and what is unverified.
---

# lenis-section-snap-tilt

## Why It Exists

Some landing pages scroll one section per wheel tick: a single flick glides exactly one viewport with a slow start, fast middle, and soft landing, while panels in a CSS 3D scene tilt with scroll. Recreating that is harder than it looks. Lenis smooths scrolling but does not snap, CSS `scroll-snap` cannot be eased or tied to other effects, and a naive "lock during the glide" handler still skips sections because one trackpad flick is dozens of wheel events lasting longer than the glide.

This skill started as a draft reconstructed from runtime measurements of one production React/Tailwind page. It has been rebuilt into a tested engine and reference set, and it keeps the page's measurements separate from this repo's own derivations and from what nobody has verified.

## What It Does

`SKILL.md` carries four labelled sections. Measured: one wheel event of `deltaY` 400 moved `scrollY` by exactly one viewport (1238 px), with samples of 30 px at 92 ms, 358 at 206, 1215 at 414, and settled near 550 ms; five panels under a `perspective: 1700px` parent resting near `rotateX(4deg) rotateY(17.6deg) rotateZ(1deg)`; an 18 px fade-up copy reveal. Derived: those samples fit easeInOutCubic over about 495 ms (1.4 px RMS), so the template uses 0.5 s. Unverified: what drives the tilt, the angle mapping, the WebGL canvas, and the original wheel handling. A decision table compares this approach with CSS scroll-snap, GSAP Observer or ScrollTrigger snap, and plain Lenis smooth scroll.

The `template/` is a no-build demo: `index.html`, `style.css`, `snap-tilt.js` (DOM wiring, Lenis from a version-pinned CDN URL) and `snap-logic.js` (pure, unit-tested logic: target computation including sections taller than the viewport, easing, wheel-gesture filter, key and swipe mapping, progress-to-angle mapping, matrix3d decomposition). It handles wheel, touch, PageUp/PageDown, arrows, Space, Home, End, hash and anchor links, focus following, resize realignment, `data-lenis-prevent` inner scrollers, a free-scroll toggle, and a reduced-motion fallback to native scroll with no tilt.

Five references go deeper: `snap-engine.md` (state machine and the reasoning behind each constant), `tilt-3d.md` (perspective placement, `preserve-3d` flattening, `will-change` budget, angle mapping, pointer parallax, matrix math), `easing-and-timing.md` (the measured table, least-squares fitting, curve table), `accessibility.md`, and `measurement.md` (detecting Lenis, wheel and matrix samplers, a table for identifying what drives a transform). `scripts/` holds paste-into-DevTools `wheel-sampler.js` and `matrix-sampler.js`, `fit-easing.mjs`, and `node --test` self-checks. Nothing needs npm.

## How To Use It

Triggers on: "Lenis section snap", "one section per wheel tick", "fullpage snap with Lenis", "3D perspective tilt on scroll", "rotateX rotateY cards on scroll", "trackpad flick skips sections", or recreating an agency-style scrolling landing page.

```sh
skills add -g catesandrew/skills --skill skills/lenis-section-snap-tilt
```

```sh
npm install @catesworks/skill-lenis-section-snap-tilt
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 60 skills as a single bundled plugin named `cw`; there is no standalone per-skill plugin.

To try the demo, serve `template/` over http (ES modules do not load from `file://`) and open `index.html`. Self-checks: `node --test scripts/snap-logic.test.mjs scripts/tools.test.mjs`. The demo's browser checks used real wheel input from a driver in Chromium at 1280x800: one 400 px tick moved exactly 800 px and settled 488 ms after dispatch; eight 100 px events 30 ms apart gave one section; a 39-event trackpad-shaped flick gave one section; reduced-motion emulation left native scroll with `transform: none`.

## Gotchas & Invariants

- Lenis is only the animator: construct it with `smoothWheel: false` and `virtualScroll: () => false` (or pass `lock: true` to `scrollTo`), otherwise a wheel event mid-glide stops the animation. Re-check after upgrading Lenis.
- One flick equals one step by gesture filtering, not only by locking: the first event after a 120 ms quiet gap, a direction reversal, or a sharp rise after the peak starts a step; ramp-up and momentum-tail events do not.
- Register the wheel listener with `{ passive: false }`, and return early (do not `preventDefault`) for `ctrlKey`, horizontal swipes, and anything inside `[data-lenis-prevent]`.
- Perspective belongs on the parent; `overflow`, `filter`, `opacity` below 1, and `clip-path` on a `preserve-3d` element flatten the scene.
- Keep `will-change` to the few cards that need it; size sections with `100svh` and re-measure on resize.
- Sections taller than the viewport are walked one viewport at a time; Home/End go to the first section and the last section's top.
- The tilt mapping (`rotateY` swinging -35 degrees per viewport) is a placeholder, not the reference page's; measure before claiming a match.
- Always ship a free-scroll escape hatch, and fall back to native scroll with no tilt under `prefers-reduced-motion`.
- Not verified: real trackpads, iOS Safari, Android, and the reference page's tilt driver and canvas.

## Related Skills

- [css-fade-up-reveal](/docs/skills/css-fade-up-reveal): the lighter reveal-only option for the 18 px fade-up copy.
- [pinned-video-blob-scrub](/docs/skills/pinned-video-blob-scrub): GSAP pin plus video scrub, the alternative when a section should hold while media plays.
- [scroll-video-site](/docs/skills/scroll-video-site): scroll-scrubbed video engine with Lenis wiring.
- [cinematic-scroll-site](/docs/skills/cinematic-scroll-site): the end-to-end cinematic scroll page pipeline.

---

_Sourced from: skills/lenis-section-snap-tilt/SKILL.md, skills/lenis-section-snap-tilt/metadata.json, skills/lenis-section-snap-tilt/references/_
