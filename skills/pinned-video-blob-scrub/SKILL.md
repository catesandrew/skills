---
name: pinned-video-blob-scrub
description: Use when a plain-HTML or Webflow-style page that already loads GSAP needs a pinned hero section where scroll scrubs one MP4 preloaded as a Blob, with a ready-timeout fallback to still images, data-attribute configuration, or a reduced-motion path. Triggers on "scrub video on scroll with GSAP", "preload video as blob for scrubbing", "pinned video hero", "ScrollTrigger pin video", "video scroll fallback image", "data-video attributes", or recreating a Webflow-style scroll video section from an inspected page.
---

# pinned-video-blob-scrub

A section pins a media wrapper with GSAP `ScrollTrigger` while a second
trigger maps scroll progress to `video.currentTime`. The MP4 is fetched whole
and played from a Blob URL so seeks never wait on the network; a ready gate
swaps in stills if the video is slow, broken, or motion is reduced.

Derived from runtime inspection of one production page (GSAP 3.15 with
ScrollTrigger/Flip/SplitText, 25 ScrollTriggers, a 14 MB / 8.4 s MP4). The
runnable template in `template/` was verified separately (see Verification).

## Which skill

| Situation | Use |
|---|---|
| GSAP-only page (Webflow, plain HTML), video lives inside a pinned section, config via `data-*` | **this skill** |
| React + Vite + Lenis, full-bleed fixed video behind the whole page | `scroll-video-site` |
| Need the whole job: concept, AI-generated footage, encode, build, copy gate, publish | `cinematic-scroll-site` (its template is the full-page vanilla variant) |
| No scrubbing needed: autoplay loop, or a still that changes | CSS-only (`<video autoplay muted loop playsinline>`, `position: sticky`) |

Sibling skills for the rest of such a page: `css-fade-up-reveal` (text
reveals without GSAP) and `lenis-section-snap-tilt` (section snapping with
Lenis; do not combine Lenis with `normalizeScroll`).

## Observed (on the inspected page)

- One tall section; a timeline pins an image/video wrapper with `scrub: 0.8`,
  `pin`, `invalidateOnRefresh: true`, `refreshPriority: 1`. Wrapper starts
  `position: fixed` at viewport size and ends `absolute` at about
  1263x711 (a scale-from-fullscreen flip).
- Config by attributes: `data-scroll-start`, `data-scroll-end`,
  `data-smoothing` (0.18), `data-ready-timeout` (2000), `data-ready-threshold`
  (0.6), `data-preload="blob"`, `data-desktop-src`, `data-mobile-src`.
- MP4 fetched as a Blob, `video.src` becomes `blob:`, `readyState` 4, muted
  `playsinline`; a rAF lerp loop (factor 0.18, snap under 0.005 s) runs only
  between the scrub trigger's `onToggle` start and stop.
- A ready timeout falls back to stills; fetch errors fall back to the plain
  URL; an `unlock()` helper exists for iOS.
- `ScrollTrigger.normalizeScroll(true)` on `(min-width: 992px) and (pointer: fine)`,
  turned off once a later block reaches `bottom bottom`.

## Recipe (what the template implements)

Markup contract (full table in `references/data-attributes.md`):

```html
<section data-video-wrap data-scroll-start="top top" data-scroll-end="bottom bottom"
         data-smoothing="${input:smoothing:0.18}" data-ready-timeout="${input:readyTimeout:6000}"
         data-desktop-src="${input:desktopSrc:assets/clip.mp4 assets/clip.webm}"
         data-mobile-src="${input:mobileSrc:assets/clip-mobile.mp4}">
  <div data-pin><div data-media>
    <img data-still="1" src="..." alt=""><img data-still="2" src="..." alt="">
    <video data-video muted playsinline preload="auto"></video>
    <div data-loader role="progressbar">...</div>
  </div></div>
</section>
```

Steps (details and code in `references/engine.md`):

1. **Choose source** (`chooseSource`): reduced motion or no playable
   candidate means stills and no download; else mobile list under 768 px, else
   desktop list; first `canPlayType`-accepted candidate wins.
2. **Load**: `fetch` with an `AbortController`, read `res.body` chunks for a
   progress ring (`Content-Length`; indeterminate if absent), build a `Blob`,
   `video.src = URL.createObjectURL(blob)`. Fetch failure: use the URL directly.
3. **Gate** (`readyDecision`): ready when duration is known, `readyState >= 3`
   and buffered fraction >= threshold; error or timeout means stills.
4. **Pin and flip**: `gsap.matchMedia()`; desktop timeline with `pin`,
   `pinSpacing: false`, scale from fullscreen; phones pin only
   (`references/pin-and-flip.md`).
5. **Progress trigger** (no tween): `onUpdate` sets `target = progress *
   duration`; `onToggle` starts and stops the loop and, on leaving, seeks once
   to the exact end frame.
6. **Loop**: `current = lerpStep(current, target, smoothing)`; seek through
   `planSeek` (skip / seek / queue) so only one seek is in flight.
7. **Teardown**: `destroy()` aborts the fetch, kills triggers and
   `matchMedia`, revokes the Blob URL, clears `src`.

Encode the clip for scrubbing (short GOP, no audio, size budget, mobile and
WebM variants, stills) with `references/video-encoding.md`; the hero encode in
`skills/cinematic-scroll-site/references/ffmpeg-recipes.md` is compatible.
Inspect an existing page with `scripts/probe-scrub.js` and
`references/measurement.md`.

Files: `template/{index.html, style.css, pinned-video-scrub.js, scrub-logic.js, assets/}`
(GSAP and ScrollTrigger 3.15.0 from jsdelivr with SRI hashes), pure-logic
tests in `scripts/scrub-logic.test.mjs`. Run `node --test scripts/scrub-logic.test.mjs` (no
dependencies). Serve the template over HTTP (`fetch` and ES modules do not
work from `file://`).

## Unverified

- `data-ready-threshold` semantics: the attribute and default were seen, its
  use was not. The fraction-of-duration-buffered meaning is this skill's.
- The observed page's iOS `unlock()` trigger; real-device iOS/Safari seeking
  of Blob URLs, and whether revoking the Blob early is safe.
- Progress-ring values mid-download (checked only at start and completion on
  localhost), Slow-3G behaviour, 120 Hz feel.
- Whether the 2000 ms observed timeout was tuned for the 14 MB file; at that
  size most connections would have taken the fallback.
- normalizeScroll gating details beyond the media query; SPA teardown in a
  real framework (`destroy()` was written but never executed).

## Common Mistakes

- Setting `currentTime` straight from `onUpdate`: use the lerp loop and
  coalesced seeks, or seeks pile up and the video lags the scroll.
- Stopping the loop on `onToggle` without a final seek: a fast flick leaves
  the video short of its last frame. Seek to `progress * duration` on leave.
- `pinSpacing` left at default on a section that is already tall: the scroll
  distance doubles. Use `pinSpacing: false` when the trigger supplies the length.
- Timeout shorter than the download: slow visitors never see the video. Size
  `data-ready-timeout` to file size and slowest target link.
- Scrubbing a normal web encode (`-g 48+`): seeks decode seconds of frames.
  Re-encode with `-g 1` to `-g 6`, no audio.
- No `muted` + `playsinline` (+ `webkit-playsinline`): iOS refuses programmatic
  seeking or goes fullscreen.
- Revoking the Blob URL right after metadata: some browsers re-fetch on seek.
  Revoke on fallback and teardown only.
- Creating triggers out of page order without `refreshPriority`, or running
  the load inside `matchMedia.add` (re-downloads on every breakpoint change).
- Combining `normalizeScroll` with Lenis or another smooth-scroll library.
- Judging feel with programmatic `scrollTo` jumps; use real wheel input and a
  real phone.
- Opening `index.html` via `file://`: Blob fetch and modules fail; serve it.

## Verification

Serve `template/` over HTTP and check: `video.src` starts with `blob:` and
`readyState === 4`; `currentTime` is within a frame of `progress * duration`
and clamps at both ends; the pinned element is `position: fixed` inside the
range and returns to flow after it; with the clip blocked or delayed past the
timeout `data-state` becomes `fallback` and `data-reason` says why; with
`prefers-reduced-motion: reduce` it is `static` and no clip is requested.
`scripts/probe-scrub.js` performs the same checks on any page.
