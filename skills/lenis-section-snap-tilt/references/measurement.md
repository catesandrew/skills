# Measuring an unknown page

Goal: reproduce another page's scroll feel without its source. Everything below is observation; record what you saw, not what you assume.

## 1. Detect Lenis

Run in the console:

```js
({
  htmlClass: document.documentElement.className,                 // 'lenis', 'lenis-smooth', 'lenis-scrolling', 'lenis-stopped'
  globalLenis: !!window.lenis,                                   // Lenis 1.3.x sets window.lenis = { version, ... } (a plain info object, not the instance)
  version: window.lenisVersion,                                  // string, set by Lenis 1.3.x
  preventAttrs: document.querySelectorAll('[data-lenis-prevent],[data-lenis-prevent-wheel],[data-lenis-prevent-touch]').length,
  lenisCss: [...document.styleSheets].some(s => { try { return [...s.cssRules].some(r => /\.lenis\b/.test(r.cssText)) } catch { return false } }),
  nativeSmooth: getComputedStyle(document.documentElement).scrollBehavior,
})
```

Interpretation:

- `html.lenis` plus `lenis-smooth` while moving: Lenis is active and animating.
- `window.lenis` exists but has no `scrollTo`: it is the info stub in 1.3.x; the instance is in the app's closure. Apps often store it on `window.__lenis`, a React ref, or a context; search with `Object.keys(window).filter(k => /lenis/i.test(k))`.
- Only `data-lenis-prevent` attributes and no class: Lenis was bundled but not started, or was destroyed (the reference page showed prevent attributes and `scrollend` dispatches; its options were not readable).
- ScrollSmoother (GSAP) or Locomotive: different classes (`smooth-wrapper`, `has-scroll-smooth`).
- Native only: `scroll-behavior: smooth` or `scroll-snap-type` in computed style.

## 2. Wheel sampler

`scripts/wheel-sampler.js` (paste into the console). It dispatches `new WheelEvent('wheel', { deltaY: 400 })` at the viewport center (or in `listen` mode waits for your real gesture), samples `scrollY` each `requestAnimationFrame`, and prints: distance, sections moved (distance / `innerHeight`), first-move latency, settle time, and samples at 30/60/92/150/206/300/414/500/600 ms.

Procedure:

1. Reload with the page at scroll 0, devtools closed docked to the side (a large docked panel changes `innerHeight`).
2. Run in `synthetic` mode. If nothing moves, the page ignores untrusted events: switch to `listen` and use the real wheel.
3. Repeat at deltaY 100, 400, 1200 and from mid-page: snap pages move the same distance for all three; smooth-scroll pages scale with delta.
4. Rapid test: dispatch 5 events 30 ms apart (loop with `setTimeout`) and check the final position: snap pages with a lock land one section away.
5. Feed `fit input` to `node scripts/fit-easing.mjs '<json>' <distance>` to choose a curve and duration (math in `easing-and-timing.md`).

What the reference measurements showed: deltaY 400 -> exactly one `innerHeight` (1238 px); 30 px at 92 ms, 358 at 206, 1215 at 414, settled about 550 ms.

Pitfalls: the first frame after dispatch includes input latency (tens of ms); background tabs throttle rAF (keep the tab focused); devtools device emulation can change wheel handling.

## 3. Matrix sampler

`scripts/matrix-sampler.js` lists every element with a non-`none` transform, decomposes `matrix3d` into `rotateX/Y/Z` degrees and translation, and reports the nearest ancestor's `perspective` and the element's `transform-style`/`will-change`.

```js
matrixSample('top')         // at scroll 0 (the script runs once on paste)
// scroll by a real gesture to section 2
matrixSample('s2')
matrixTable()               // compare rows by label
```

Sweep at least five positions per element including between sections (mid-glide) so you can see whether rotation is linear in `scrollY`. Fit: pick two rest positions, compute `d(angle)/d(scrollY)`, then test a mid sample for linearity (eased if it deviates).

What the reference showed: five tilted panels with rest near rotateX 4, rotateY 17.6, rotateZ 1 degrees under a 1700 px perspective parent, `matrix3d` values changing across scroll. Not captured: the per-position angle table.

## 4. Identify what drives a transform

Observed fact (the matrix changes) is separate from cause. Candidates and tests:

| Candidate | Test |
|---|---|
| Lenis `scroll` event -> JS writes `style.transform` | In DevTools, Elements panel: select the card, watch `style` attribute flash on scroll. Event Listeners panel does not list Lenis's emitter; use the Performance tab and look for a function writing style in the rAF/scroll task. |
| Native `scroll` listener or rAF loop | `getEventListeners(window).scroll` (Chrome console only); Performance tab flame chart. |
| GSAP ScrollTrigger scrub | `window.gsap` / `ScrollTrigger` globals; `ScrollTrigger.getAll()` lists triggers with `trigger`, `start`, `end`, `scrub`. Inline `style.transform` with `translate3d` + rotate and a `pin-spacer` wrapper. |
| CSS scroll-driven animation | `getComputedStyle(el).animationTimeline` is `scroll()` or `view()`; `el.getAnimations()` returns animations with `timeline instanceof ScrollTimeline`/`ViewTimeline`. No JS needed. |
| IntersectionObserver class toggle + CSS transition | `style` attribute unchanged; a class changes at the threshold; `getAnimations()` shows CSSTransition entries. |
| Framer Motion / `useScroll` | React DevTools; transform written as inline style from a motion value. |
| Pointer parallax | Matrix changes with mouse movement while `scrollY` is fixed. Test by moving the pointer without scrolling. |

A decisive experiment: freeze scroll (set `lenis.stop()` if reachable, or `document.documentElement.style.overflow='hidden'`) and move the pointer; then dispatch `scroll` events without moving the page. Whichever changes the matrix is the driver. Record the outcome in the same Measured/Unverified split the skill uses.

## 5. Canvas

For the unidentified WebGL canvas: `document.querySelector('canvas').getContext('webgl2') || ...getContext('webgl')` returns the existing context if one was created with the same type; read `getParameter(gl.VERSION)` and check `window.THREE`/`window.PIXI`/`window.__THREE__` globals, the bundle for `three`/`ogl`/`regl` strings (Network tab, search), and whether it redraws on scroll (add a `requestAnimationFrame` counter and a `canvas.toDataURL()` diff, or use Spector.js). Do not assume it relates to the tilt.
