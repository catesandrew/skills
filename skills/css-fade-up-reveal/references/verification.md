# Verification

## Manual checks (template or your own page)

1. Load with scroll at the top. Below-the-fold `[data-reveal]` elements have computed `opacity: 0`.
2. Scroll down slowly. Each element gains `.is-visible` exactly once; computed opacity goes 0 to 1 and `transform` to `none`.
3. Scroll back up. Elements stay visible (no re-trigger).
4. DevTools, Rendering panel, "Emulate CSS prefers-reduced-motion: reduce", reload: everything visible at once, no transition.
5. DevTools, Settings, Debugger, "Disable JavaScript", reload: all content visible and readable.
6. Print preview: all content visible.
7. Insert a node with `data-reveal` from the console after load; scroll to it; it reveals.
8. Tab through links and buttons: focus order matches visual order.

## Automated checks

Pure logic:

```sh
node --test scripts/reveal.test.mjs
```

This covers `parseVariant`, `parseDelay` and `staggerDelay` (loaded from `template/reveal.js` via `require`, no dependencies).

Browser behaviour with Playwright (any runner), against `template/demo.html` opened via `file://` or a static server:

```js
await page.goto(url)
const visible = () => page.$$eval('[data-reveal]', els => els.filter(e => e.classList.contains('is-visible')).length)
// initial: fewer than total; after scrolling to the bottom: equals total
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
await page.waitForTimeout(1500)
// reduced motion
await page.emulateMedia({ reducedMotion: 'reduce' })
// no JS
const ctx = await browser.newContext({ javaScriptEnabled: false })
// assert every [data-reveal] computed opacity is "1" and <html> has no "js" class
```

## Measuring a real page's reveal timings

Goal: replace the unmeasured draft values (duration, easing, distance, delay) with observed ones.

1. Open the target page in Chrome. Scroll to the top and reload.
2. Paste `scripts/probe-reveals.js` into the DevTools console. If the page uses a different class, first set `window.__PROBE_SELECTOR = '.your-selector'` and paste again.
3. Scroll slowly from top to bottom, then run `__probe.report()`.
4. Per element, read the table:
   - `class` column: the class swap (for Elementor, `elementor-invisible` replaced by `animated fadeInUp`).
   - `animation`/`transition` columns: computed `animation-name`, `animation-duration`, `animation-timing-function`, `animation-delay`, or the transition equivalents. Elementor uses keyframes, so expect `animation-name: fadeInUp`.
   - `animationend`/`transitionend` row: `elapsed=` is the measured duration in seconds.
   - `transform` on the `initial` row: a `matrix(1, 0, 0, 1, tx, ty)`; `ty` is the starting vertical offset in px at the first sample (percentage-based keyframes resolve against element height, so it varies per element).
5. To see the real keyframe distance: DevTools, Elements, find `@keyframes fadeInUp` in the Styles pane or Sources, and read the `from` transform.
6. Record the values (and the source page's Elementor settings) in your project notes, then update `--reveal-duration`, `--reveal-ease`, `--reveal-y` to match.

`__probe.stop()` removes the observers.

## Last verified

Self-check and browser results for the shipped template are recorded in the skill's docs page and the commit that introduced them; rerun the checks above after changing `reveal.js` or `reveal.css`.
