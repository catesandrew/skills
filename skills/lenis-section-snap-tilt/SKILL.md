---
name: lenis-section-snap-tilt
description: Use when building a landing page where one wheel, swipe, or key press advances exactly one viewport-height section with an eased glide (Lenis as the animator), and panels or cards sit in a CSS 3D perspective that tilts with scroll. Triggers on "Lenis section snap", "one section per wheel tick", "fullpage snap with Lenis", "scroll snap that feels smooth", "3D perspective tilt on scroll", "rotateX rotateY cards on scroll", "trackpad flick skips sections", or recreating an agency-style scrolling landing page.
---

# lenis-section-snap-tilt

A one-section-per-gesture scroll engine (Lenis animates, a small state machine decides) plus scroll-driven CSS 3D tilt panels and 18 px fade-up copy reveals. A working no-build demo is in `template/`; pure logic is unit-tested.

The measurements below come from one production React/Tailwind page; the code is a re-implementation, not its source.

## Measured (observed on the reference page)

- One wheel event, `deltaY: 400`, moved `scrollY` from 0 to exactly one viewport (1238 px). Samples: 30 px at 92 ms, 358 at 206, 1215 at 414, settled about 550 ms. Slow start, fast middle, soft landing.
- Five panels inside a parent with `perspective: 1700px`; each has `transform-style: preserve-3d; backface-visibility: hidden; will-change: transform`, resting near `rotateX(4deg) rotateY(17.6deg) rotateZ(1deg)`. Their `matrix3d` values changed across scroll.
- Copy reveal: `translateY(18px)` + opacity 0 to `none` + opacity 1.
- `html.lenis`, `data-lenis-prevent` attributes and `scrollend` dispatch were present: Lenis was bundled. Its options were not readable.

## Derived (my analysis, in this repo's tests)

- The three glide samples fit easeInOutCubic over about 495 ms with 1.4 px RMS (`scripts/fit-easing.mjs`); other curves fit worse. Three points constrain a curve family, they do not prove it. The 550 ms "settle" is the animation plus frame latency, so the template uses 0.5 s. See `references/easing-and-timing.md`.

## Unverified (do not present as fact)

- What drives the tilt (Lenis scroll event, GSAP ScrollTrigger, CSS scroll-driven animation, pointer) and the scroll-to-angle mapping. The template's mapping (rest angles, `rotateY` swinging -35 degrees per viewport) is a placeholder.
- The WebGL canvas contents and whether it relates to the tilt.
- The reference's wheel-gesture handling (lock, debounce, inner-scroll rules) and Lenis options.

To close these, follow `references/measurement.md` (paste `scripts/wheel-sampler.js` and `scripts/matrix-sampler.js`, then the driver-identification table).

## When to use which approach

| Need | Pick |
|---|---|
| Sections must stop exactly at section tops, custom easing, tilt/other effects tied to scroll position, keyboard + touch parity | This skill (Lenis `scrollTo` + own input handling) |
| Zero JS, accept browser-controlled feel; content that mixes with long reading | CSS `scroll-snap-type: y mandatory`/`proximity` (no custom easing; momentum and landing vary per browser; `mandatory` plus tall sections can trap users) |
| Already on GSAP, want snapping tied to timelines/pins | GSAP Observer (intercept input) or ScrollTrigger `snap` (snaps after scroll ends, no one-gesture-one-step guarantee) |
| Just want buttery inertia, no stops | Plain Lenis smooth scroll (`smoothWheel: true`, default options) |
| Only a gentle entrance on scroll | `css-fade-up-reveal` |

## Recipe

Run the demo: serve `template/` with any static server (ES modules need http, not `file://`) and open `index.html`.

Core wiring (full version in `template/snap-tilt.js`):

```js
import Lenis from 'https://cdn.jsdelivr.net/npm/lenis@1.3.27/dist/lenis.mjs'
import { GLIDE_SECONDS, easeInOutCubic, computeTarget, createGestureFilter, normalizeDelta } from './snap-logic.js'

const lenis = new Lenis({ autoRaf: true, smoothWheel: false, virtualScroll: () => false }) // Lenis animates only
const filter = createGestureFilter()
let locked = false
const go = (dir) => {
  if (locked) return
  const y = computeTarget({ scrollY, dir, sections: geo, vh: innerHeight, max })
  locked = true
  lenis.scrollTo(y, { duration: GLIDE_SECONDS, easing: easeInOutCubic, force: true, onComplete: () => (locked = false) })
}
addEventListener('wheel', (e) => {
  if (e.ctrlKey || e.target.closest('[data-lenis-prevent]') || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return
  e.preventDefault()
  const dir = filter.accept({ deltaY: normalizeDelta(e.deltaY, e.deltaMode, innerHeight), t: e.timeStamp })
  if (dir) go(dir)
}, { passive: false })
```

Tilt (perspective on the parent, rotation on the child; mapping in `snap-logic.js`):

```js
const local = clamp(scrollY / innerHeight - index, -1, 1)   // 0 = card on screen
card.style.transform = tiltCss(tiltAngles(local))            // rest 4 / 17.6 / 1, swing -35 deg
```

The template also covers touch swipe, PageUp/PageDown/arrows/Space/Home/End, hash and anchor navigation, focus following, resize re-measure, sections taller than the viewport, `data-lenis-prevent` inner scrollers, a free-scroll toggle, and reduced-motion fallback to native scroll with no tilt.

Reference files, load as needed:

- `references/snap-engine.md`: state machine, gesture debounce constants and reasoning, interrupt rules, Lenis option notes.
- `references/tilt-3d.md`: perspective placement, preserve-3d flattening, will-change budget, angle mapping, pointer parallax, matrix3d math.
- `references/easing-and-timing.md`: measured samples, fitting math, curve table, duration choice.
- `references/accessibility.md`: reduced motion, keyboard, screen readers, mobile viewport units, escape hatch.
- `references/measurement.md`: detect Lenis, sample wheel and matrices, identify a transform's driver.

Self-checks: `node --test scripts/snap-logic.test.mjs scripts/tools.test.mjs` (Node prints a harmless module-type warning).

## Common Mistakes

- Leaving Lenis `smoothWheel` on while snapping: Lenis adds wheel deltas to a running target and fights the glide. Use `smoothWheel: false` and ignore Lenis input (`virtualScroll: () => false`), or `lock: true` on `scrollTo`.
- No gesture filter: a trackpad flick is dozens of events over half a second, so locking only during the glide still skips a section when the tail outlasts it. Filter by burst, not by lock alone.
- Registering the wheel handler without `{ passive: false }`: `preventDefault` is ignored and the page also scrolls natively.
- Perspective on the card instead of its parent (the card then has no perspective for its own rotation), or `overflow`/`filter`/`opacity` on a `preserve-3d` element flattening the scene.
- Sizing sections with `100vh` on mobile: use `100svh` (with a `100vh` fallback) and measure tops from the DOM, with a `ResizeObserver` re-measure.
- Swallowing keys that belong to controls (Space on a button, arrows in an input), or calling `preventDefault` on events you do not handle.
- Hijacking tall reading sections or inner scrollers: mark scrollers `data-lenis-prevent`, step tall sections by a viewport, offer a free-scroll toggle.
- Ignoring `prefers-reduced-motion`: fall back to native scroll with no tilt, do not just shorten the animation.
- Importing `lenis` with an unpinned CDN URL: pin the version (the demo pins 1.3.27) and re-run the browser check on upgrades.

## Verification

Use real wheel input (a driver's mouse-wheel call), not `scrollTo`, and sample `scrollY` per frame. In the demo run (Chromium, 1280x800): one 400 px tick moved exactly 800 px and settled 488 ms after dispatch; eight 100 px events 30 ms apart gave one section; a 39-event trackpad-shaped flick gave one section; keys, hash click, touch swipe (CDP touch events), inner scroll, resize realign, and reduced-motion fallback behaved as specified. Not verified on real trackpads, iOS Safari, or Android.

## Related Skills

`css-fade-up-reveal` (the lighter reveal-only option), `pinned-video-blob-scrub` (GSAP pin + video scrub), `scroll-video-site` (scrubbed video engine that also wires Lenis), `cinematic-scroll-site` (end-to-end cinematic page pipeline).
