# Engine state machine

Reference implementation: `template/pinned-video-scrub.js` (DOM + GSAP) on top
of `template/scrub-logic.js` (pure, unit-tested). Labels: **[observed]** was
seen running on the inspected page, **[ours]** is this skill's definition.
The React/Lenis variant of the seek loop is in
`skills/scroll-video-site/references/scroll-video-engine.md`; this file only
restates what differs.

```
            init
  reduced-motion / no playable source ----------------> static   (stills, no pin, no download)
            |
         loading --(error | timeout)--------------------> fallback (stills crossfade on scroll)
            |
         (gate passes)
            v
          ready <--> loop running only while the scrub trigger is active
            |
         destroy -----------------------------------------> destroyed
```

`wrap.dataset.state` mirrors the state, `wrap.dataset.reason` says why
(`timeout`, `error`, `reduced-motion`, `no-playable-source`), and a
`pvbs:state` CustomEvent fires on every change. Tests and CSS hook on those.

## 1. Source selection (pure: `chooseSource`)

Order: reduced motion wins, then mobile vs desktop list, then the first
candidate the browser can play (`video.canPlayType(mime)`). `data-*-src` takes a
space-separated candidate list (`clip.mp4 clip.webm`) **[ours]**. Observed page
used a single desktop URL plus an optional mobile URL. Selection happens once
at init; crossing the 767 px breakpoint later does not reload the video.

## 2. Blob load [observed: fetch whole file, Blob URL, `video.load()`]

```js
const res = await fetch(src, { signal })
if (!res.ok) throw new Error('HTTP ' + res.status)
const total = Number(res.headers.get('content-length')) || 0   // 0 => indeterminate ring
const reader = res.body.getReader(), chunks = []
let got = 0
for (;;) {
  const { done, value } = await reader.read()
  if (done) break
  chunks.push(value); got += value.length
  setProgress(total ? got / total : null)       // 0..1 or null
}
video.src = URL.createObjectURL(new Blob(chunks, { type: res.headers.get('content-type') || 'video/mp4' }))
video.load()
```

- Streaming progress through a `ReadableStream` reader **[ours]**; the observed
  page showed a loader but its exact progress source was not read.
- `Content-Length` is the encoded size. It matches the bytes read for MP4
  (not compressed in transit) but not for responses with `Content-Encoding`;
  CORS also hides it unless the server sends `Access-Control-Expose-Headers: Content-Length`
  on cross-origin assets. Missing or zero means indeterminate, never 0%.
- Always pass the `AbortController` signal; the gate and teardown abort it.
- **Error path:** a network failure (offline, CORS, 4xx/5xx) is not final. Set
  `video.src = src` and let the element try (observed fallback: "on fetch error
  use the URL directly"); the element's own `error` event then goes to the gate.
  An `AbortError` means we aborted on purpose: do nothing.
- Why a Blob: seeks hit memory, not the network, and no range requests are
  involved. Cost: the whole file is downloaded before the first scrubbed frame,
  so size budget matters (see `video-encoding.md`).
- `preload="blob"` vs `direct` is `data-preload` **[ours]**; `direct` skips the
  fetch and uses a plain `src`, useful for a quick comparison.

## 3. Ready gate (pure: `readyDecision`) [timeout observed, threshold ours]

Inputs: `errored`, `readyState`, `duration`, `buffered` (fraction),
`threshold`, `elapsed` (ms since init), `timeout`.

| Condition | Result |
|---|---|
| `errored` | `fallback` immediately |
| duration known, `readyState >= 3`, `buffered >= threshold` | `ready` (beats the timeout) |
| otherwise and `elapsed >= timeout` | `fallback` |
| otherwise | `wait` |

- `buffered` = end of the buffered range that starts at 0, divided by
  duration (`bufferedFraction`). **`data-ready-threshold` is our definition:**
  the draft saw the attribute (default 0.6) but not how the page used it. With
  a Blob the whole file is buffered at once so it is effectively 1; the
  threshold only matters with `data-preload="direct"`.
- The timeout clock starts at init and covers download plus metadata. The
  observed default of 2000 ms is a hard budget; a 14 MB file will not finish in
  2 s on most links, so that page effectively served stills to slow visitors.
  Size the timeout to file size and the slowest link you will serve
  (the demo uses 6000 ms). A stall-based timeout (reset on progress) is a
  reasonable variation but was not observed.
- Re-evaluate on `loadedmetadata`, `loadeddata`, `canplay`, `canplaythrough`,
  `progress`, `error`, and once more from a `setTimeout(timeout)` with
  `elapsed` forced to infinity (timer jitter can leave `elapsed` at 1999 ms).
- **Fallback actions:** abort the fetch, revoke the Blob URL, remove `src` and
  `load()` to release the decoder, hide the video, hide the loader, kill the
  scrub trigger, and start the stills crossfade (see `pin-and-flip.md`).

## 4. Ready actions

1. `duration = video.duration`; `video.currentTime = 0`; hide first still and loader.
2. Create the scrub trigger (no `scrub`, no animation: it only supplies
   `progress`): `onUpdate` stores `target = progressToTime(progress, duration)`.
   `scrub` is meaningless without a tween; `scrub: true` in the observed page
   was harmless there.
3. If the trigger is already active (page loaded or scroll-restored mid-range)
   start the loop now, because `onToggle` will not fire.
4. Unlock iOS (below), set state `ready`, `ScrollTrigger.refresh()`.

## 5. Lerp loop [observed: lerp factor 0.18, snap under 0.005 s]

```js
current = lerpStep(current, target, smoothing)   // snaps when |gap| < 0.005
applySeek(current)
raf = requestAnimationFrame(tick)
```

Start and stop from the trigger's `onToggle` (fires when `isActive` flips)
**[observed]**. Two details that matter:

- **Land on the end frame when leaving.** The loop stops on toggle-off, which
  can happen before it converged; `progress` is 0 or 1 at that moment, so set
  `target = current = progressToTime(self.progress)` and seek once. Without
  this the last frame is never shown after a fast flick.
- Per-frame lerp (not time-based) means feel depends on refresh rate. Use
  `1 - Math.exp(-dt * rate)` if you need 60/120 Hz parity (see `scroll-video-site`).

## 6. Seek throttling and coalescing [ours; same idea as scroll-video-site]

`planSeek({ playhead, currentTime, seeking, threshold })` returns:
`skip` if the gap is within `threshold` (0.02 s), `queue` if `video.seeking`
is true, else `seek`. On `queue` set a boolean `dirty`; on `seeked`, if dirty,
seek again toward the **current** playhead (re-read it, never replay a captured
value) so stale targets cannot move the film backward. One seek in flight, one
remembered flag, no queue.

## 7. iOS unlock [observed: an `unlock()` helper exists; trigger not read]

```js
const unlock = () => video.play().then(() => video.pause()).catch(() => {})
unlock()                                                  // muted+playsinline usually succeeds
for (const ev of ['pointerdown', 'touchstart', 'keydown']) addEventListener(ev, unlock, { once: true, passive: true })
```

Requires `muted playsinline`. Not verified on a real iOS device; treat as the
standard workaround, test on hardware.

## 8. visibilitychange, resize, refresh

- `document.hidden`: stop the loop; on visible, restart only if the trigger is
  still active. (rAF is throttled in background tabs, but stopping is cleaner.)
- Layout changes: `ScrollTrigger` handles window resize itself (debounced) and
  re-measures triggers. Call `ScrollTrigger.refresh()` yourself after things
  that change layout without a resize: fonts, images, and the video's
  intrinsic size if it affects the wrapper height. The draft claimed ranges
  are computed "before duration is known"; that only holds if your layout
  depends on the video's metadata. In this design the range is DOM-based, so
  the refresh at ready is cheap insurance.
- Order: create the pin/flip trigger first (higher `refreshPriority`), the
  progress trigger after; ScrollTrigger refreshes in creation order unless
  `refreshPriority` says otherwise, and a pin adds distance that later
  triggers must account for.

## 9. Memory and teardown

- Keep the Blob URL for the life of the page (or SPA view). Do not revoke it
  after `loadedmetadata`: whether seeks keep working afterwards depends on the
  browser and was not tested; revoking at teardown is the safe rule.
- Revoke on fallback and on destroy. One Blob of N MB is held in memory for as
  long as the page lives; do not preload several heavy clips at once.
- `destroy()` order: set a destroyed flag; cancel rAF; clear timers; abort the
  fetch; remove event listeners; kill triggers and the tweens that own them;
  `gsap.matchMedia().revert()`; revoke URL; remove `src` and `load()`.
  In an SPA call it from the route/component unmount; with React StrictMode
  see the double-mount trap in `scroll-video-site`.
