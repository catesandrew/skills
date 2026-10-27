---
name: css-fade-up-reveal
description: Use when a page needs the lightest scroll polish, using native CSS smooth scrolling plus a fade-up (or fade, slide, scale) entrance as elements enter the viewport, with no animation library. Triggers on "fade in on scroll", "fadeInUp", "scroll reveal without GSAP", "scroll-behavior smooth", "Elementor-style entrance animation", "match a simple WordPress scroll animation", "stagger children on scroll", or "animation-timeline view() reveal".
---

# css-fade-up-reveal

A hide-then-reveal entrance in about 40 lines of CSS and 90 of vanilla JS: elements start at `opacity: 0` plus a small transform, an `IntersectionObserver` adds `.is-visible` once, and a CSS transition does the rest. A working copy is in `template/`.

## Observed (facts from inspecting one WordPress/Elementor page)

- `html { scroll-behavior: smooth }` was set.
- 9 elements used Elementor's `fadeInUp` entrance (`.elementor-invisible` swapped to `.animated.fadeInUp` on entering view).
- No parallax, particles, sticky, motion effects or video were active; tracked elements' transforms did not change while scrolling (so it is trigger-once, not scroll-linked).
- A separate site's copy used `translateY(18px)` plus opacity 0 to none plus opacity 1.

## Unverified / assumed

- The original page's durations, delays and easing were **not measured**. The defaults here (700ms, a gentle ease-out cubic-bezier, 24px) are reasonable choices, not copies. Elementor's own stylesheet defaults are not confirmed here either.
- To replace them with measured values, run `scripts/probe-reveals.js` on the target page (see `references/verification.md`).

## Recipe

1. Copy `template/reveal.css` and `template/reveal.js` into the project.
2. Put `<script>document.documentElement.classList.add('js')</script>` in `<head>` before the stylesheet, so content is only hidden when JS can reveal it.
3. Mark elements: `data-reveal` (up), or `data-reveal="fade|down|left|right|scale"`; optional `data-reveal-delay="150"` (ms) or `data-reveal-stagger="100"` on a parent for index-based child delays.
4. Call `Reveal.init()` once. It handles late-inserted nodes, `prefers-reduced-motion`, and missing `IntersectionObserver` (everything shows immediately).

Tune with CSS custom properties (`--reveal-duration`, `--reveal-ease`, `--reveal-y`, `--reveal-x`, `--reveal-scale`, `--reveal-delay`) or `Reveal.init({ threshold, rootMargin, staggerStep })`.

## Which tool

| Need | Use |
|---|---|
| One-shot entrance, any framework or static HTML, no dependency | This skill |
| Reveal tied to scroll position (scrub, pin, parallax), timelines, sequencing across sections | GSAP ScrollTrigger |
| Page is already Elementor/WordPress and edits happen in the editor | Elementor's Entrance Animation setting (see mapping in `references/recipe-variants.md`) |
| Chromium/Safari-only audience, want zero JS, progressive enhancement | CSS `animation-timeline: view()` inside `@supports` (variant in `references/recipe-variants.md`) |
| Pinned video or blob scrub | `pinned-video-blob-scrub` |
| Section snapping with tilt on a Lenis scroller | `lenis-section-snap-tilt` |
| Frame-scrubbed video hero | `scroll-video-site`, or the full pipeline in `cinematic-scroll-site` |

## References

- `references/recipe-variants.md`: fade, slide, scale, stagger, native `view()` variant, Elementor mapping table.
- `references/accessibility-and-fallbacks.md`: no-JS, reduced motion, print, CLS, assistive tech.
- `references/tuning-and-performance.md`: threshold/rootMargin, will-change, batching, SPA and late nodes.
- `references/verification.md`: manual checks, automated checks, measuring a real page.
- `scripts/probe-reveals.js` (DevTools measurement), `scripts/reveal.test.mjs` (`node --test scripts/reveal.test.mjs`).

## Common Mistakes

- Hiding content without a `.js` gate: no-JS visitors, crawlers that skip scripts and failed script loads see a blank page.
- Animating `top`, `margin` or `height`: use only `transform` and `opacity`.
- Re-triggering on every scroll: `unobserve` after the first reveal (the template does).
- Combining `scroll-behavior: smooth` with a JS smooth-scroll library (Lenis, locomotive): pick one.
- Revealing elements that sit in the first viewport via IntersectionObserver delay: above-the-fold hero text should reveal on load or not be hidden at all (hurts LCP).
- Using `display: none` or `visibility: hidden` as the hidden state: it hides content from assistive tech; keep opacity and transform only.
- Putting `will-change` on every element permanently: see `references/tuning-and-performance.md`.
- Quoting the draft durations as "what Elementor does": they are unmeasured defaults.

## Related skills

`pinned-video-blob-scrub`, `lenis-section-snap-tilt`, `scroll-video-site`, `cinematic-scroll-site`.
