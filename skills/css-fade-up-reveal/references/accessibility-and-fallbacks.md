# Accessibility and fallbacks

Principle: the hidden state is purely visual and only exists when JS is running and motion is allowed. Every failure path must end with content visible.

## No JavaScript

CSS hides only under `html.js`. Add the class in an inline head script before the stylesheet:

```html
<script>document.documentElement.classList.add('js')</script>
```

Without JS the class is never added and content renders normally. A `<noscript>` style override is a second option but unnecessary with the gate. If the main script fails to load after the inline gate ran, content stays hidden: keep the inline gate and `reveal.js` in the same page, and consider a short timeout that removes `.js` if `Reveal` is undefined:

```html
<script>setTimeout(function(){ if(!window.Reveal) document.documentElement.classList.remove('js') }, 3000)</script>
```

## prefers-reduced-motion

The CSS shows everything with no transition under `@media (prefers-reduced-motion: reduce)`, and `reveal.js` adds `.is-visible` immediately. `scroll-behavior` returns to `auto`. A softer policy (keep a plain opacity fade, drop movement) is acceptable: set `--reveal-y: 0px` and keep a short duration under the media query.

## IntersectionObserver absent

Old browsers and some embedded webviews lack it. `reveal.js` shows everything immediately when `'IntersectionObserver' in window` is false.

## Print

Print styles force `opacity: 1; transform: none`. Without this, unrevealed content prints blank.

## Layout shift and Lighthouse

- Transforms and opacity do not cause layout shift, so CLS is unaffected as long as the hidden state keeps the element's box (never `display: none`).
- Do not hide above-the-fold LCP content behind a reveal: the element is not painted until the observer fires, which delays LCP. Leave hero text un-marked or reveal it on load.
- `content-visibility: auto` on long sections skips rendering off-screen, which can change observed intersection timing and, without `contain-intrinsic-size`, shift layout when sections render. If using both, set `contain-intrinsic-size` on the sections.
- Lighthouse reports non-composited animations only for properties other than transform/opacity; this recipe should not trigger it.

## Assistive technology and focus

- Opacity 0 does not remove an element from the accessibility tree, so screen readers still read it; this is intended. Do not add `aria-hidden` or `display: none` to the hidden state.
- Focus order follows the DOM and is unaffected. A focusable element that is still at opacity 0 can receive focus invisibly: for interactive elements, also reveal on `focusin` (`el.addEventListener('focusin', ...)` adding `.is-visible`), or do not put `data-reveal` on interactive controls.
- Avoid revealing content that conveys an error or status message; those should appear immediately.
- Vestibular safety: keep travel distances small (under ~40px) and avoid scaling large areas.
