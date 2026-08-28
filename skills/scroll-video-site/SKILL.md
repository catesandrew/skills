---
name: scroll-video-site
description: >-
  Use when building a full-bleed, scroll-scrubbed video landing page — a
  single cinematic video file (an 8-40s continuous camera-move clip) sits
  fixed behind the page and scroll position maps directly to the video's
  `currentTime`, with synchronized chapter content, GSAP ScrollTrigger,
  Lenis smooth scrolling, and an optional autoplay "tour" control for hands-off
  viewing. Covers the ScrollVideo engine (RAF-damped playhead easing toward a
  ScrollTrigger-set target time, seek-coalescing so rapid scrubbing never
  queues stale seeks, `requestVideoFrameCallback` usage, StrictMode-safe video
  lifecycle, Safari/iOS quirks), wiring Lenis through GSAP's ticker instead of
  a second RAF loop, an Auto Tour control that pauses on any manual scroll
  input, and the anti-slop constraints that keep the interface from covering
  the film. Triggers on "scroll-scrubbed video", "video scrubbing
  scrolltrigger", "currentTime scroll sync", "cinematic scroll video landing
  page", "video background scroll site", "scrub video with scroll position",
  or adapting a single hero video into a one-page scroll experience.
---

# scroll-video-site

## Overview

A one-page, cinematic microsite built around a single pre-generated video
file: the video is pinned full-viewport behind the interface, and scrolling
from the top of the document to the bottom scrubs the video from its first
frame to its last. Chapter content (headlines, annotations, CTAs) animates in
sync with the underlying footage. This skill covers the mechanism that makes
that reliable — naive `video.currentTime = scrollProgress * duration` stutters
badly and breaks on Safari/iOS — plus the surrounding scroll infrastructure
(Lenis + GSAP ScrollTrigger) and an optional autoplay tour for passive
viewing.

**Prerequisite:** the video file already exists (generated externally or
sourced some other way) and is available at a static path the app serves,
e.g. `/public/media/<name>.mp4` → `/media/<name>.mp4`. This skill does not
generate video; it builds the site around one.

**Stack assumed below:** React + Vite + Tailwind + GSAP (ScrollTrigger) +
Lenis + react-router. Adapt component boundaries to the target repo's actual
stack — the load-bearing part is the *engine*, not the framework.

## The ScrollVideo engine

The naive approach — set `video.currentTime` directly from scroll progress —
produces visible stutter because seeking a compressed video is not
instantaneous, and rapid scroll events fire far faster than the decoder can
seek. The fix is to decouple "what scroll wants" from "what the decoder does":

1. **ScrollTrigger only sets a target.** On scroll, compute
   `targetTime = progress * video.duration` and store it — do not seek yet.
2. **One `requestAnimationFrame` loop eases toward the target.** Maintain an
   internal `playhead` value and each frame move it toward `targetTime` with
   frame-rate-independent exponential damping (not a fixed per-frame step, or
   the perceived speed changes with refresh rate):
   ```js
   const damping = 1 - Math.exp(-dt * DAMPING_RATE);
   playhead += (targetTime - playhead) * damping;
   ```
3. **Only issue a new seek if the decoder isn't already seeking.** Track a
   `seeking` flag from the video element's `seeking`/`seeked` events. If a
   seek is in flight when the RAF loop wants to move the playhead, do not
   call `video.currentTime =` again — queue only the newest requested target
   and drain it on `seeked`. An unbounded seek queue is the #1 cause of
   scroll-scrub sites feeling laggy or "behind" the scroll position.
4. **Reject stale queued values that would move the film backward** once a
   newer, later target has already superseded them (can happen when a user
   scrolls down then a queued seek from a moment ago finally resolves).
5. **Prefer `requestVideoFrameCallback`** where available to align the
   playhead update with actual decoded frames rather than the display's
   refresh rate — reduces perceived judder on variable-refresh displays.
6. **Read real duration from `loadedmetadata`.** Never hardcode clip length;
   source clips vary and a hardcoded duration silently desyncs the last few
   percent of scroll.
7. **Do not throttle `ScrollTrigger.refresh()` calls into the RAF loop** —
   call it only on real layout changes (resize, route change), never on a
   timer or scroll tick.

Element requirements: native `<video>`, fixed + full-viewport,
`object-fit: cover`, `muted`, `playsInline`, `preload="auto"`,
`disablePictureInPicture`. Include a restrained loading/buffered-progress
overlay — video-scrub sites feel broken if the user can scroll ahead of what's
buffered with no indication why the frame froze.

**StrictMode safety:** React 18/19 StrictMode double-invokes effects in dev.
Do not remove the video's `src` in a cleanup function that runs on the
first (thrown-away) mount — this causes a visible flash/reload on every dev
navigation and has bitten real ScrollVideo implementations. Guard cleanup so
it only tears down real unmounts, not the StrictMode probe-mount.

**Safari/iOS:** iOS Safari restricts autoplay and can be stricter about rapid
programmatic seeking. Keep the video muted (required for any autoplay-like
behavior) and test scrubbing specifically on iOS Safari, not just desktop
Chrome — seek-queue bugs that are invisible on desktop show up as visible
stutter on iOS.

See `references/scroll-video-engine.md` for the fuller gotcha list and
`references/scroll-video-engine.tsx` for a reference component implementing
the above.

## Smooth scrolling (Lenis + GSAP)

Wire Lenis through GSAP's own ticker rather than giving it a second
independent `requestAnimationFrame` loop — two competing RAF loops driving
scroll state is a common source of jitter and of ScrollTrigger reading a
stale scroll position:

```js
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
```

Keep every page-specific ScrollTrigger synchronized to this single driver.
Preserve keyboard scrolling, anchor navigation, and browser accessibility —
Lenis's smoothing should not swallow native scroll semantics. Reset scroll
position cleanly on route changes. Disable decorative smoothing entirely
under `prefers-reduced-motion` (real scroll, not artificially smoothed, for
users who've opted out of motion). Ensure setup/teardown is StrictMode-safe.

## Auto Tour (optional autoplay control)

A small fixed control that plays the entire scroll experience hands-off —
useful for a passive "watch it play" mode on a cinematic site. If included:

- States: `Start Tour` → `Pause`/`Resume` while running → `Replay` on
  completion, with a live percentage readout.
- Drive it with a linear GSAP tween animating a normalized 0–1 progress value
  (not raw scrollTop, so it's independent of document height), feeding that
  into Lenis's imperative scroll API.
- Offer a 1×/2× speed toggle with concrete target durations (e.g. 20s at 1×,
  10s at 2×) rather than a vague "fast" toggle.
- **Any manual input pauses it**: wheel, touch, pointer drag, and keyboard
  scroll keys (PageUp/PageDown/Home/End/Space/arrows). Escape stops the tour
  without resetting the user's current scroll position. Route changes kill
  all active tweens.
- Update progress through refs or CSS custom properties, not React state, to
  avoid a re-render on every animation frame.
- Give it visible keyboard focus and an `aria-live` status region so
  screen-reader users get the same "tour running / paused / done" feedback.

## Anti-slop constraints

The interface exists to explain and dramatize the film, not compete with it.
Avoid the tells of a generic AI-generated site layered over the video:

- No floating glassmorphism panels, no constant blur, no gradient blobs.
- No generic SaaS feature-card grid — content should be diegetic to what the
  video is doing at that scroll position (measurement instruments, labels,
  annotations tied to the film's subject), not a bolted-on marketing section.
- Don't animate every element — restraint reads as intentional; animating
  everything reads as a template.
- No scroll hijacking beyond the intentional video-scrub itself, no fake
  loading delays, no motion unrelated to what's on screen.
- Large opaque panels that obscure the film defeat the point of the format.
- No horizontal overflow, no unreadable micro-labels, fully responsive on
  both desktop and mobile (mobile is not an afterthought pass).

## Common Mistakes

- **Seeking on every scroll event.** Causes visible stutter; always route
  through the damped-playhead + seek-coalescing pattern above, never a direct
  `video.currentTime =` assignment inside a scroll handler.
- **Two independent RAF loops** (one for Lenis, one for the video playhead,
  one for ScrollTrigger) fighting each other — drive Lenis off GSAP's ticker,
  and keep the video's easing loop as the only other RAF consumer.
- **Hardcoding video duration** instead of reading `loadedmetadata` — breaks
  the moment the source clip's length changes.
- **Removing the video's `src` in a StrictMode double-invoked cleanup** —
  causes a dev-only flash/reload; guard against tearing down the probe-mount.
- **No pause-on-manual-input for Auto Tour** — a user who starts scrolling
  during an autoplay tour and finds it fighting them will bounce immediately.
- **Ignoring `prefers-reduced-motion`** — disable Lenis smoothing and any
  decorative parallax for users who've opted out; the video-scrub itself can
  remain (it's the core content), but forced smoothing/parallax on top of it
  should not.
- **Testing scrubbing only on desktop Chrome** — iOS Safari's stricter
  autoplay/seek behavior surfaces bugs invisible elsewhere.
