# Pin, flip, mobile, fallback crossfade

API details checked against GSAP 3.15.0 and the official ScrollTrigger docs.

## The pinned wrapper [observed]

The observed page pinned an image/video wrapper with a timeline whose
ScrollTrigger used `scrub: 0.8`, `pin`, `invalidateOnRefresh: true` and
`refreshPriority: 1`. The wrapper started at viewport size in `position: fixed`
and ended `absolute` at roughly 1263 x 711 offset into the page: a
scale/size-from-fullscreen "flip" into a framed position. The final size is a
design decision; the numbers are not a spec.

The template does the same with a transform instead of animating width/height
(cheaper, no layout):

```js
gsap.timeline({ scrollTrigger: {
  trigger: wrap, start: 'top top', end: 'bottom bottom',
  pin: stage, pinSpacing: false,
  scrub: 0.8, invalidateOnRefresh: true, refreshPriority: 1,
}}).fromTo(media, { scale: 1, borderRadius: 0 }, { scale: 0.62, borderRadius: 28, ease: 'none' })
```

Option semantics (ScrollTrigger docs):

| Option | Meaning here |
|---|---|
| `scrub: true` | animation locked to the scrollbar |
| `scrub: 0.8` (number) | animation takes 0.8 s to catch up: a second smoothing layer on top of the video lerp |
| `pin: el` | `el` is fixed while the range is active; `pinSpacing` pads the page so following content catches up |
| `pinSpacing: false` | no padding added. Right when the trigger is already a tall section that supplies the scroll length (our case); the default `true` would double the scroll distance |
| `invalidateOnRefresh: true` | flush recorded start values on every refresh/resize, so `fromTo` from "current size" is re-measured |
| `refreshPriority` | refresh order; only needed if triggers were not created top-to-bottom. A pin adds distance that later triggers must include, so the pin refreshes first |

Geometry: the wrap is a CSS-tall section (`height: 400vh`), `start: 'top top'`,
`end: 'bottom bottom'` makes the range `wrap height - viewport height`. Pinned
`stage` is 100vh. Measured in the demo at 700 px viewport: range 560..2660 px;
`stage` is `position: fixed` inside it and returns to normal flow at the end
(`stageTop` 0 at the bottom edge, then scrolls away).

Two ScrollTriggers share the wrap on purpose: the pin/flip one (with a scrub
tween) and the video-progress one (no tween). Keeping them separate lets the
video loop start/stop on `onToggle` without touching the tween, and lets the
fallback path kill one without the other.

## Mobile via gsap.matchMedia [verified in docs]

```js
const mm = gsap.matchMedia()
mm.add({ desktop: '(min-width: 768px)', mobile: '(max-width: 767px)' }, (ctx) => {
  if (ctx.conditions.desktop) { /* timeline with flip */ }
  else ScrollTrigger.create({ trigger: wrap, start, end, pin: stage, pinSpacing: false })
  return () => {}            // optional extra cleanup; GSAP reverts what was created here
})
// teardown: mm.revert()
```

Everything GSAP creates inside the callback is reverted automatically when the
query stops matching, so triggers do not leak across breakpoints. Phones get
pin without scale (cheaper, fewer jank sources). Do not put the video load
inside `mm.add`: it would re-run on every breakpoint change. The source is
chosen once (`data-mobile-src`, a smaller encode).

## Fallback-image crossfade [ours]

When the gate falls back there is no video progress to follow, so the stills
keep the section alive: two stacked `<img>` (first and last frame), the second
fades 0 to 1 over the same range:

```js
gsap.fromTo(still2, { opacity: 0 }, { opacity: 1, ease: 'none',
  scrollTrigger: { trigger: wrap, start, end, scrub: true } })
```

Measured in the demo: still-2 opacity 0 / 0.5001 / 1 at 0 / 50 / 100% of the
range. The pin/flip is unchanged, so layout does not jump when a slow visitor
falls back. Draft behaviour was "show the first still, second at opacity 0";
the crossfade is our improvement. Extract stills from the clip's first and last
frames (`video-encoding.md`) so the swap is not visible.

Reduced motion is a different path: no pin, no scrub, no download; one still,
`.is-static` collapses the tall track to normal flow.

## normalizeScroll trade-offs [observed: used on desktop fine pointer, disabled at a later block]

`ScrollTrigger.normalizeScroll(true)` forces scrolling onto the JS thread so
screen updates synchronize with scroll and mobile address bars do not
show/hide (docs). The observed page enabled it for
`(min-width: 992px) and (pointer: fine)` and disabled it when a
`#normalize-scroll` block reached `bottom bottom`. The scope of that gating
was read from the page config only.

- Pro: removes pin jitter caused by compositor-thread scroll running ahead of
  JS (most visible on iOS and some trackpads).
- Con: replaces native scrolling: momentum, find-in-page overlays, and
  accessibility tools behave differently; nested scrollers and iframes need
  care; it fights other smooth-scroll libraries (never combine with Lenis).
- Default off in the template; opt in with `data-normalize-scroll="true"` only
  after you see pin jitter on a real device. `ScrollTrigger.normalizeScroll()`
  with no argument returns the current normalizer (or null), which is how
  `probe-scrub.js` detects it.
