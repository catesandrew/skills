# Inspecting an unknown page for this pattern

Goal: decide whether a page uses a pinned, Blob-scrubbed video, and capture the
numbers to copy. Use the DevTools console (or the Chrome DevTools / Playwright
MCP `evaluate` tool). All snippets are read-only except the scroll sampler.

Fast path: paste `scripts/probe-scrub.js`, then `await __probe.run()`.
Pieces below if the page does not expose `window.ScrollTrigger` or you want one
check at a time.

## 1. Is GSAP/ScrollTrigger present, which version, how many triggers

```js
({ gsap: window.gsap?.version, st: window.ScrollTrigger?.version,
   plugins: ['Flip','SplitText','ScrollSmoother'].map(n => [n, !!window[n]]),
   count: ScrollTrigger.getAll().length })
```

## 2. Dump the triggers

```js
console.table(ScrollTrigger.getAll().map((t, i) => ({
  i, trigger: t.trigger?.className || t.trigger?.tagName, pin: !!t.pin,
  start: Math.round(t.start), end: Math.round(t.end), scrub: t.vars.scrub,
  pinSpacing: t.vars.pinSpacing, refreshPriority: t.vars.refreshPriority,
  progress: +t.progress.toFixed(3), active: t.isActive })))
```

Look for: a pinned trigger (`pin: true`) whose range is thousands of px, and
a second trigger on the same wrapper with no scrub (the progress source).
`t.vars` holds the original config: start/end strings, `onToggle`, etc.

## 3. Find the video and its source

```js
[...document.querySelectorAll('video')].map(v => ({
  src: (v.currentSrc || v.src).slice(0, 60), blob: (v.currentSrc || v.src).startsWith('blob:'),
  readyState: v.readyState, duration: v.duration, size: v.videoWidth + 'x' + v.videoHeight,
  muted: v.muted, playsInline: v.playsInline, preload: v.preload,
  buffered: [...Array(v.buffered.length)].map((_, i) => [v.buffered.start(i), v.buffered.end(i)]),
  data: { ...v.dataset }, wrapData: { ...v.closest('[data-video-wrap],section,div').dataset } }))
```

A `blob:` `src` with `readyState 4` means the Blob-preload pattern. Empty `src`
after a slow load means the gate fell back to stills. The original MP4 URL does
not appear on the element: read it from the network panel (filter `media`, or
`performance.getEntriesByType('resource').filter(r => /\.(mp4|webm)/.test(r.name))`,
whose `encodedBodySize` gives the size).

```js
performance.getEntriesByType('resource')
  .filter(r => /\.(mp4|webm)(\?|$)/.test(r.name))
  .map(r => ({ file: r.name.split('/').pop(), MB: +(r.encodedBodySize / 1e6).toFixed(1), ms: Math.round(r.duration) }))
```

## 4. Probe the clip itself

Save the file from the network panel, then:
`ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,nb_frames,duration:format=bit_rate -of default=nw=1 clip.mp4`
and keyframe cadence: `ffprobe -v error -select_streams v -show_entries packet=flags -of csv=p=0 clip.mp4 | awk '/K/{k++} END{print NR/k " frames per keyframe"}'`

## 5. Sample progress vs currentTime

```js
const v = document.querySelector('video'), t = ScrollTrigger.getAll().find(x => !x.pin && x.trigger?.contains(v))
const rows = []
for (let i = 0; i <= 10; i++) {
  scrollTo(0, t.start + (t.end - t.start) * i / 10)
  await new Promise(r => setTimeout(r, 700))                // let the lerp settle
  rows.push({ progress: +t.progress.toFixed(2), time: +v.currentTime.toFixed(2), expected: +(t.progress * v.duration).toFixed(2) })
}
console.table(rows)
```

Judging: `time` tracks `expected` within about a frame and is monotonic; at
progress 0 and 1 it clamps to 0 and duration. A constant offset means a
different mapping (e.g. the video only covers part of the range). Sample with
longer `settle` first, then shorter to see lerp lag. Programmatic `scrollTo`
jumps skip the visible easing: judge feel with real wheel input.

## 6. Watch the loop live

```js
const v = document.querySelector('video'); let n = 0
const stop = setInterval(() => console.log(n++, v.currentTime.toFixed(3), v.seeking, v.readyState), 100)
// scroll by hand, then: clearInterval(stop)
```

`seeking` flickering true/false while you scroll slowly means coalesced seeks.
`currentTime` frozen while scroll moves means the loop is stopped (outside the
toggle range) or the fallback is active.

## 7. Detect normalizeScroll and matchMedia setups

```js
!!ScrollTrigger.normalizeScroll()          // current normalizer or null
matchMedia('(min-width: 992px) and (pointer: fine)').matches
```

Resize the viewport across 767/992 px and re-run step 2; trigger sets that
change are `gsap.matchMedia()` branches.

## What to record

GSAP/ScrollTrigger versions, trigger count, pin target and range px, scrub
values, video size (MB) and duration, blob or not, readyState, desktop/mobile
source split, timeout (inspect `v.dataset`), fallback behaviour (throttle the
network to "Slow 3G" and reload). Anything not observed running goes under
Unverified in your notes.
