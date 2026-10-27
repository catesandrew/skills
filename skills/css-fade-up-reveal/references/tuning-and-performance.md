# Tuning and performance

## Threshold and rootMargin

The defaults are `threshold: 0.15` and `rootMargin: '0px 0px -8% 0px'`: an element reveals once 15% is visible and its top is above the lower 8% of the viewport, so it does not fire while barely peeking in.

| Situation | threshold | rootMargin |
|---|---|---|
| Normal blocks (default) | 0.15 | `0px 0px -8% 0px` |
| Short items, text lines | 0 | `0px 0px -10% 0px` |
| Very tall elements (taller than the viewport) | 0 (a 0.15 ratio may never be reachable) | `0px 0px -10% 0px` |
| Reveal slightly before entering | 0 | `0px 0px 10% 0px` (positive grows the root) |
| Reveal late, once clearly in view | 0.4 | `0px 0px -15% 0px` |

Tall-element trap: with `threshold: 0.15`, an element more than ~6.7 times the viewport height can never have 15% visible. Use 0 for such elements.

## What to animate

Only `transform` and `opacity`; both can be composited without layout or paint. Never animate `top`, `left`, `margin`, `width`, `height` or `filter: blur` on many elements.

## will-change policy

`will-change: transform, opacity` promotes a layer, which costs GPU memory. The template does not set it by default. Use it only when profiling shows first-frame jank, and then only on the not-yet-visible state, removing it after `transitionend`:

```css
html.js [data-reveal]:not(.is-visible) { will-change: transform, opacity; }
```

A transition from `opacity: 0` creates its own compositor layer for the duration anyway.

## Many elements

- One shared observer (the template) is cheaper than one per element.
- Unobserve after reveal so the observer's working set shrinks as the user scrolls.
- For hundreds of items (long tables, feeds), reveal only the first few and render the rest plain, or use CSS `view()` which runs on the compositor with no JS per element.
- Batch DOM writes: the observer callback only adds a class, which is already a single write per element.

## SPA and route changes

Call `Reveal.init()` once, at app start. Because it observes DOM mutations, nodes rendered by a router are picked up automatically. If you swap the whole `<body>` or a root that the observer does not watch, call `handle.refresh()` after the route renders, or `handle.destroy()` then `Reveal.init()` again. Framework tip: initialize in a root-level mount hook (React `useEffect` in the layout, Angular `AfterViewInit` of the root), and call `destroy()` on unmount to avoid duplicated observers.

If the scroll position is restored on back navigation, elements already in view reveal immediately (the observer fires on first observation), so there is no flash of hidden content.

## Late-inserted nodes

`reveal.js` runs a `MutationObserver` on `body` (`childList`, `subtree`), scans added nodes, and prepares any `[data-reveal]` inside them. Cost is proportional to nodes added. Nodes added while hidden elsewhere (inside a collapsed accordion) reveal when they intersect, which is correct.

## Timing defaults

700ms and the ease-out curve are drafts, not measured values. Short, subtle entrances (300 to 600ms) read as polish; above ~1s feels sluggish. Measure the source page before matching it.
