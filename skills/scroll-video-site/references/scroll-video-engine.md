# ScrollVideo engine — extended notes

Supplementary detail for the pattern summarized in `SKILL.md`. Read that
first; this file is the deeper gotcha list plus the constants worth
exposing/tuning.

## Why the naive approach fails

```js
// DON'T: seeks on every scroll tick
scrollTrigger.onUpdate = (self) => {
  video.currentTime = self.progress * video.duration;
};
```

Seeking a compressed video is asynchronous and not free — the decoder has to
locate the nearest keyframe and decode forward to the requested time. Scroll
events (even Lenis-smoothed ones) can fire far more often than the decoder
can keep up, so each new seek request preempts the previous one before it
resolves. The visible symptom is stutter that gets worse the faster the user
scrolls — exactly backwards from what feels good.

## The fix, restated as state machine

Three pieces of state:

- `targetTime` — where scroll *wants* the video to be right now (updated by
  ScrollTrigger, cheap, can update every frame).
- `playhead` — an internally eased value chasing `targetTime` (updated by the
  RAF loop, damped so it doesn't jump).
- `isSeeking` — whether the `<video>` element currently has a seek in flight.

Loop body, roughly:

```js
function tick(now) {
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  const damping = 1 - Math.exp(-dt * DAMPING_RATE); // e.g. DAMPING_RATE ≈ 8-12
  playhead += (targetTime - playhead) * damping;

  if (!isSeeking && Math.abs(playhead - video.currentTime) > SEEK_THRESHOLD) {
    isSeeking = true;
    pendingSeek = null;
    video.currentTime = playhead;
  } else if (isSeeking) {
    // a newer value arrived while we were mid-seek — remember it, don't act yet
    pendingSeek = playhead;
  }

  requestAnimationFrame(tick);
}

video.addEventListener('seeked', () => {
  isSeeking = false;
  if (pendingSeek !== null) {
    const next = pendingSeek;
    pendingSeek = null;
    isSeeking = true;
    video.currentTime = next;
  }
});
```

`SEEK_THRESHOLD` (a small time delta, e.g. 0.05–0.15s) avoids issuing a seek
for sub-perceptible differences — without it the loop can thrash on
floating-point noise even when scroll is effectively still.

**Rejecting backward staleness:** if the user scrolls down past a point, then
an old queued `pendingSeek` from a moment ago (still pointing to an earlier,
smaller time) finally gets its turn, applying it would visibly snap the film
backward. Guard: only apply a queued seek if it's still consistent with the
*current* `targetTime` direction, or simply always re-read `targetTime`
(not a captured `pendingSeek` value) at the moment `seeked` fires, so you
always seek toward where scroll currently is, not where it was.

## `requestVideoFrameCallback`

Where supported, use it to schedule the next playhead-sync check aligned to
an actually-decoded frame rather than the display's paint cycle. This mostly
matters on high-refresh-rate displays (120Hz+) where a plain
`requestAnimationFrame` loop can run faster than the video can realistically
produce new frames, wasting cycles and occasionally causing the "am I ahead
of the decoder" checks to be noisier than necessary. Fall back to
`requestAnimationFrame` where it's unavailable (Safari support has
historically lagged) — the pattern above works correctly either way, this is
a smoothness refinement, not a correctness requirement.

## Constants worth exposing at the top of the module

```ts
export const DAMPING_RATE = 10;      // higher = snappier, lower = smoother/laggier
export const SEEK_THRESHOLD = 0.08;  // seconds; avoid thrashing on sub-perceptible deltas
```

Tune `DAMPING_RATE` per project — a slower, moodier site can go lower (more
lag, smoother feel); a snappier product demo can go higher.

## StrictMode cleanup trap, concretely

```js
useEffect(() => {
  const video = videoRef.current;
  // ... wire listeners, start RAF loop ...
  return () => {
    // DON'T do this unconditionally — StrictMode mounts, cleans up, remounts
    // in dev, and clearing src here causes a flash/reload on every nav:
    // video.removeAttribute('src');
    // video.load();

    cancelAnimationFrame(rafId);
    video.removeEventListener('seeked', onSeeked);
  };
}, []);
```

Only clear `src`/call `load()` in a cleanup path that's provably tied to a
real unmount (e.g. gated by a ref flag set on the *second* effect run, or
simply never clear `src` at all and let the browser garbage-collect it on
actual navigation away from the route).
