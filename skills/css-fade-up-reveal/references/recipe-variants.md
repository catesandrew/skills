# Recipe variants

All variants share the same trigger (`.is-visible` added once by `reveal.js`) and differ only in the starting transform. The template's `data-reveal` values map to the custom properties below.

## Variants

| `data-reveal` | Start state | Notes |
|---|---|---|
| `up` (default) | `translateY(24px)`, opacity 0 | The fadeInUp equivalent |
| `down` | `translateY(-24px)` | Good for items below a sticky header |
| `left` | `translateX(-32px)` | Element moves in from the left |
| `right` | `translateX(32px)` | Mirror; flip both in RTL layouts |
| `fade` | no movement | Safest for large blocks (no overflow-x risk) |
| `scale` | `scale(0.94)` | Cards and images; keep above ~0.9 to avoid a pop |

Horizontal slides can create a horizontal scrollbar while off-screen. Put `overflow-x: clip` on the page wrapper (not `hidden` on `body`, which can break `position: sticky`).

## Staggered children

Index-based, with a CSS custom property (works everywhere; `reveal.js` sets `--reveal-delay` from `data-reveal-stagger`):

```html
<ul data-reveal-stagger="80">
  <li data-reveal>One</li>
  <li data-reveal>Two</li>
</ul>
```

Hand-written, no JS needed for the delay (the observer still adds `.is-visible`):

```html
<li data-reveal style="--reveal-delay: 160ms">Three</li>
```

Cap the total delay (the template caps at 600ms) so a 30-item list does not take 2.4s to finish.

JS-free index with `sibling-index()` (CSS Values 5): `transition-delay: calc(sibling-index() * 80ms);`. Support is new and limited (Chromium-based browsers first; check current support tables before relying on it). Treat it as an enhancement behind `@supports (transition-delay: calc(sibling-index() * 1ms))`, with the custom-property approach as the baseline. Note it counts all siblings, not only `[data-reveal]` ones.

## Native scroll-driven variant (progressive enhancement)

`animation-timeline: view()` ties progress to the element's position in the viewport, so it is scroll-linked (it reverses on scroll up), unlike the trigger-once recipe. Wrap it so unsupported browsers fall back to the observer recipe:

```css
@supports (animation-timeline: view()) {
  .reveal-native {
    animation: reveal-in linear both;
    animation-timeline: view();
    animation-range: entry 0% entry 60%;
  }
  @keyframes reveal-in {
    from { opacity: 0; transform: translate3d(0, 24px, 0); }
    to   { opacity: 1; transform: none; }
  }
}
@media (prefers-reduced-motion: reduce) {
  .reveal-native { animation: none; }
}
```

Do not apply both `data-reveal` and `.reveal-native` to one element. Do not gate hiding on `.js` here; the keyframes only run where supported, so there is no hidden-forever state. Test in a current Chromium and Safari; Firefox support has lagged, which is what the `@supports` guard is for.

## Elementor mapping

Elementor's Entrance Animation (Advanced tab) and its class names map as follows. Values on the left are Elementor setting names; the CSS variable column is what to set in this recipe.

| Elementor | This recipe | Notes |
|---|---|---|
| Fade In Up (`fadeInUp`) | `data-reveal="up"` | Elementor's fadeInUp travels a larger percentage-based distance by default; measure before matching (see `verification.md`) |
| Fade In Down (`fadeInDown`) | `data-reveal="down"` | |
| Fade In Left (`fadeInLeft`) | `data-reveal="left"` | Elementor's "left" means it comes from the left |
| Fade In Right (`fadeInRight`) | `data-reveal="right"` | |
| Fade In (`fadeIn`) | `data-reveal="fade"` | |
| Zoom In (`zoomIn`) | `data-reveal="scale"` | |
| Animation Duration (Slow / Normal / Fast / custom) | `--reveal-duration` | Preset ms values are not confirmed here; read the computed `animation-duration` with the probe |
| Animation Delay (ms) | `data-reveal-delay="<ms>"` or `--reveal-delay` | |
| `.elementor-invisible` | hidden start state (`html.js [data-reveal]`) | |
| `.animated` | the transition/animation is running | |

Elementor uses CSS `@keyframes` (an animation), while this recipe uses a transition. Both end at the same state; the difference matters only if you want to reuse Elementor's keyframes, in which case set `animation-name` instead.
