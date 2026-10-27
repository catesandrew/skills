# data-* attribute contract

"Observed" means the attribute name (and default where stated) was read from
the inspected page's markup or script config. "Ours" means this skill defines
or extends it; behaviour is verified in the template, not on the original page.
Parsing and defaults live in `parseConfig` (`template/scrub-logic.js`).

## On the wrapper (`[data-video-wrap]`)

| Attribute | Default | Meaning | Status |
|---|---|---|---|
| `data-video-wrap` | - | marks the section the script initializes (one engine per element) | observed |
| `data-scroll-start` | `top top` | ScrollTrigger `start` string for the scrub (and pin) range | observed |
| `data-scroll-end` | `bottom bottom` | ScrollTrigger `end` string | observed |
| `data-smoothing` | `0.18` | lerp factor per frame, clamped 0.01-1; higher is snappier | observed |
| `data-ready-timeout` | `2000` | ms from init to give up and show stills (covers download + metadata) | observed (default); semantics ours |
| `data-ready-threshold` | `0.6` | fraction of the clip that must be buffered from 0 before ready; mostly relevant with `data-preload="direct"` | attribute observed, **semantics ours** |
| `data-preload` | `blob` | `blob` fetches the whole file and uses an object URL; `direct` uses a plain `src` | observed value `blob`; `direct` ours |
| `data-desktop-src` | - | URL, or space-separated candidates (first playable wins) | observed (single URL); list ours |
| `data-mobile-src` | `''` | same, used when `(max-width: 767px)`; empty means use desktop | observed |
| `data-normalize-scroll` | off | `"true"` calls `ScrollTrigger.normalizeScroll(true)` | ours (observed page enabled it in JS, not via attribute) |

## Output attributes (written by the script)

| Attribute | Values | Meaning |
|---|---|---|
| `data-state` | `loading`, `ready`, `fallback`, `static`, `destroyed` | engine state; use for CSS and tests (ours) |
| `data-reason` | `timeout`, `error`, `reduced-motion`, `no-playable-source`, `desktop`... | why the last non-loading state was entered (ours) |

## On children

| Selector | Role |
|---|---|
| `[data-video]` | the `<video muted playsinline preload="auto">` (observed) |
| `[data-pin]` | element ScrollTrigger pins (the observed page pinned an image/video wrapper) |
| `[data-media]` | element scaled by the flip timeline |
| `[data-still="1"]`, `[data-still="2"]` | first/last frame images: placeholder, fallback, reduced-motion (ours) |
| `[data-loader]` | `role="progressbar"` ring; `--p` CSS variable 0..1; `.indeterminate` when no Content-Length (ours) |

## Validation notes

- Unknown or non-numeric numbers fall back to defaults instead of throwing.
- `data-ready-threshold` outside 0-1 is clamped.
- Because everything is attribute-driven, several sections can share one script;
  each gets its own engine and its own Blob (memory scales with count).
