# Snap engine: state machine and constants

Everything here is implemented in `template/snap-tilt.js` (DOM wiring) and `template/snap-logic.js` (pure decisions, unit-tested). Lenis version verified: 1.3.27.

## Why Lenis is only the animator

A snap engine needs three things: decide the target, animate to it, and report progress. Lenis gives the last two (`scrollTo` with `duration` + `easing`, and a `scroll` event) and brings `html.lenis` class handling and `scrollend`. Its built-in wheel smoothing would fight a snap (it adds `deltaY` to a running target), so the template constructs it as:

```js
new Lenis({ autoRaf: true, smoothWheel: false, virtualScroll: () => false })
```

`virtualScroll` returning `false` makes Lenis ignore every wheel and touch event (verified in the 1.3.27 source: `onVirtualScroll` returns before any `preventDefault` or `animate.stop()`), so the engine owns input. Without it, a wheel event arriving mid-glide reaches Lenis's non-smooth branch, which calls `animate.stop()` and kills the glide. If you would rather not depend on that, pass `lock: true` to `scrollTo`; Lenis then swallows input while locked. Re-check this on a Lenis upgrade (see "Upgrade check").

Other relevant options (from the 1.3.27 typings): `autoRaf` (self-driven rAF, default false), `lerp` (default 0.1, ignored when `duration` is given), `duration` (seconds), `easing`, `smoothWheel` (default true), `syncTouch` (default false), `respectReducedMotion` (default true: programmatic scrolls become instant), `anchors`, `autoToggle`, `allowNestedScroll`. Methods: `scrollTo(target, { offset, immediate, lock, duration, easing, force, onStart, onComplete, userData })`, `on('scroll', cb)` (returns an unsubscribe), `stop()` / `start()`, `resize()`, `destroy()`. Use `data-lenis-prevent` (also `-wheel`, `-touch`, `-vertical`, `-horizontal`) to opt an element out of Lenis input handling; because the template bypasses Lenis input, it honours the same attribute itself (`PREVENT` selector).

## States

```
            wheel/key/swipe/hash                        onComplete | safety timer
  IDLE  ------------------------------>  GLIDING(target)  ------------------------>  IDLE
   ^                                         |  input here is swallowed, not queued
   |                                         v
   +----- resize: re-measure, realign (immediate) ------ reduced-motion / free-scroll toggle: DESTROYED (native)
```

- IDLE: any accepted input computes `computeTarget` from the live `scrollY` and starts a glide.
- GLIDING: `locked = true`. All wheel, key and swipe input is swallowed (the wheel handler still calls `preventDefault`, so the page does not also scroll natively). Reason: queued input is how one trackpad flick becomes three sections.
- Safety timer: `GLIDE_SECONDS * 1000 + 400` ms. `onComplete` is the normal unlock; the timer covers a tab backgrounded mid-glide (rAF paused) and any path where Lenis returns early.
- DESTROYED: `AbortController.abort()` removes every listener, `ResizeObserver` disconnects, `lenis.destroy()`, card transforms cleared. Native scroll resumes untouched.

## Target computation (`computeTarget`)

Inputs: current `scrollY`, direction, section geometry (`top`, `height` per section, document px), `vh`, max scroll. Rules:

1. Current section = last section with `top <= scrollY + 2`. The 2 px epsilon absorbs fractional scroll positions and sub-pixel layout.
2. Down: if the current section extends more than 2 px below the viewport bottom, step by one viewport but never past `bottom - vh` (so a 1.7 viewport section takes two steps: +1 vh, then +0.7 vh). Otherwise go to the next section's top. At the last section, stay.
3. Up: if scrolled into the current section, step up one viewport but not above its top. Otherwise land on the previous section; if that one is taller than the viewport, land on its bottom (`top + height - vh`), not its top, so reversing direction retraces the same stops.
4. Clamp to `[0, max]`.

A mid-section position (hash jump, resize, native scroll) therefore snaps to a neighbour and never skips one. Targets come from measured `top` values, not `index * vh`, so sections of unequal height work.

`measure()` runs on load and from a `ResizeObserver` on `documentElement`: it re-reads `getBoundingClientRect().top + scrollY` per section and calls `lenis.resize()`. After a resize, if the page was on a one-viewport section, it realigns with an `immediate` scroll (otherwise a mobile URL-bar collapse leaves you a few px off a section).

## Wheel gestures

`wheel` listener on `window`, `{ passive: false }` (passive listeners cannot `preventDefault`; Chrome treats window-level wheel listeners as passive by default unless declared otherwise). Early returns, in order, so the browser keeps its native behaviour:

- `e.ctrlKey` (pinch-zoom on trackpads arrives as ctrl+wheel).
- target inside `[data-lenis-prevent]` (inner scrollers).
- `|deltaX| > |deltaY|` (horizontal swipes drive browser history on macOS).

Then `e.preventDefault()`, normalise the delta (`deltaMode` 1 = lines x16, 2 = pages x vh), and feed `createGestureFilter().accept({ deltaY, t })`.

### Gesture filter: one flick = one step

A trackpad flick is not one event: it is a burst of tens of wheel events whose deltas ramp up, peak, then decay over roughly half a second or more. The tests model this as 39 events (6, 18, 40, 70, 90, then 83 decaying to 1); that shape is a model, not a capture from hardware (the browser run replayed it through a driver at about 33 ms spacing, real trackpads are typically faster). Use `scripts/wheel-sampler.js` in `listen` mode to log your own device. A mouse notch is one event of about 100 (Chrome) or 120 (Windows), repeated every 30-150 ms when spun.

The filter returns a direction only for an event that starts a gesture:

| Rule | Constant | Reasoning |
|---|---|---|
| Quiet gap starts a new burst | `quietMs = 120` | Momentum tails arrive ~16-50 ms apart; 120 ms is more than two missed frames at 60 Hz yet short enough that a deliberate second flick after a beat counts. Raise it for sluggish hardware, lower it if users spin a mouse wheel and expect each pause to step. |
| Ignore tiny deltas | `minDelta = 4` | Tail events of 1-3 px are noise. They still reset the quiet timer (they are activity). |
| First qualifying event in a burst fires | n/a | Fires on the leading edge so latency is one frame, not "wait for the gesture to finish". |
| Direction reversal fires | `reverseMin = 20` | A real reversal is intent; a 1-10 px sign flip at the end of a tail is not. |
| Rising delta after the peak fires | `riseRatio = 1.6`, `riseMin = 30`, only after a decay was seen | Lets a second flick start on top of a decaying tail (no pause) without the first flick's own ramp-up (6, 18, 40 ...) re-firing, because the ramp occurs before any decay has been observed. |

Known limits: a continuous, evenly paced mouse-wheel spin with gaps under 120 ms gives one step until the user pauses; this is the intended price of "never skip". A hardware free-spin wheel (Logitech) behaves like a long tail. Tune against the user's device before shipping; the unit tests (`scripts/snap-logic.test.mjs`) encode the four scenarios (single flick, two flicks with a pause, flick on a decaying tail, mouse notches).

## Touch

`touchstart` records `y` and time (single finger only, not inside `[data-lenis-prevent]`); `touchmove` is non-passive and calls `preventDefault()` so the browser does not scroll or pull-to-refresh underneath; `touchend` maps `dy = start - end` through `swipeToStep`: fire when `|dy| >= 40` px, or when faster than 0.3 px/ms and at least 12 px. Alternative: `touch-action: none` on `html` and `touch-action: pan-y` on inner scrollers; the JS route keeps inner scrollers working with no extra CSS but needs the non-passive listener.

## Keyboard

| Key | Action |
|---|---|
| PageDown, ArrowDown, Space | next step |
| PageUp, ArrowUp, Shift+Space | previous step |
| Home / End | first section / last section top |

Ignored when a modifier (ctrl, meta, alt) is held, inside `[data-lenis-prevent]`, in contenteditable, or when the key would act on a focused control: Space and arrows on `input`, `textarea`, `select`, `button`, `a`, `summary`. `preventDefault` is called only for keys the engine handles, so Tab, Enter and browser shortcuts are untouched. End goes to the last section's top, not the page bottom; for a tall last section, press again or use `toIndex`/max if you want the true end.

## Hash and anchor navigation

- Click on `a[href^="#id"]` matching a section: `preventDefault`, `history.pushState`, glide.
- `hashchange` (back/forward): glide.
- Load with a hash: `immediate` jump (no animation on arrival; Lenis's `immediate` option).
- `focusin` on an element in an off-screen section (Tab navigation): glide to that section if it fits the viewport; a taller section is left to the browser's native focus scroll so the focused control is never hidden.

## Sections taller than the viewport

Covered by `computeTarget` (above). Add `data-lenis-prevent` only to elements that scroll internally; a tall section itself is part of the document flow and is walked by steps. If the tall section holds long reading content, consider exempting it entirely (give it a wrapper that returns early in the wheel handler) so people can read at their own pace; snap works for hero-style panels, not for prose.

## Interrupt rules

Chosen: swallow, do not interrupt. Alternatives and when to use them:

- Interrupt (cancel the glide and retarget from the live position) feels more responsive for many-section pages; implement by dropping the `locked` check and calling `computeTarget` from the current animated `scrollY`. The gesture filter still prevents tail events from re-firing, but a quick double flick can then skip a section.
- Queue one pending step: acceptable if the product wants "flick twice, move twice". Cap the queue at one.
- User scroll via scrollbar drag, find-in-page, or middle-click autoscroll bypass `wheel` entirely; after those, the next step recomputes from the actual position, so the page self-heals.

## Upgrade check

After bumping Lenis, verify in a browser: (1) one real wheel tick moves one section, (2) wheel events mid-glide do not truncate the animation, (3) `lenis.destroy()` removes `html.lenis`. If (2) fails, add `lock: true` to the `scrollTo` call.
