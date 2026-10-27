# Accessibility and safety

A snap engine intercepts the most basic input on the web. Treat every point below as a requirement, not polish.

## Reduced motion

- `@media (prefers-reduced-motion: reduce)`: do not start the engine. Native scroll, no tilt (`transform: none !important`), reveals shown immediately. Do not merely shorten the duration; a one-viewport jump with tilt is still vestibular-triggering.
- Lenis has `respectReducedMotion` (default true in 1.3.27: smoothing off, programmatic scrolls instant). That is a backstop, not the plan, because the page would still hijack the wheel. The template checks `matchMedia('(prefers-reduced-motion: reduce)')` before creating Lenis and listens for `change` to destroy or create the engine live.
- Verified in a headless browser with reduced-motion emulation: no engine object, a 150 px wheel moved native `scrollY` to 150, card computed `transform: none`, reveal opacity 1, PageDown scrolled natively (910), and switching emulation back to no-preference started the engine.

## Do not trap scroll

- Always provide the escape hatch: a visible "Free scroll" toggle (the template's `aria-pressed` button) that destroys the engine, and `?snap=off` for support links. Consider remembering it in `localStorage`.
- Never `preventDefault` what you do not handle: `ctrl+wheel` (zoom), horizontal swipes (history), modified keys, and keys on focused controls pass through (see `snap-engine.md`).
- Inner scroll areas get `data-lenis-prevent` plus `tabindex="0"` and an accessible name so keyboard users can scroll them; chaining at their ends is stopped by `overscroll-behavior: contain` (Lenis's stylesheet adds this for `[data-lenis-prevent]`).
- Do not use `overflow: hidden` on `html`/`body` to lock the page: it breaks native scrollbars, find-in-page, and "scroll to focus". The template keeps the document natively scrollable and only intercepts input.
- Never remove the scrollbar; it is a position indicator and an alternate input.

## Keyboard and focus

- Keys: PageUp/PageDown, arrows, Space, Shift+Space, Home, End work. Tab is untouched.
- Tab order must follow visual and DOM order; sections are ordinary landmarks/regions in DOM order, with no positive `tabindex`.
- Tab into an off-screen section triggers a glide to it (focus follow) so the focus ring is visible; sections taller than the viewport are left to the browser's native focus scroll.
- Provide a skip link (template: "Skip to last section") as the first focusable element; it is hidden until focused.
- Visible focus: `:focus-visible` outline, never `outline: none` without a replacement.
- After a hash/keyboard jump do not steal focus; if a section is a new "page", optionally move focus to its heading with `tabindex="-1"` and `focus({ preventScroll: true })`.

## Screen readers

- The page is plain semantic HTML in order; the engine adds no ARIA and moves nothing in the DOM. Screen-reader virtual cursors scroll natively and ignore `wheel`, so reading works regardless of snap.
- Navigation dots: a `<nav aria-label>` with real links (`href="#id"`) and `aria-current="true"` on the active one. Do not build them from `div`s.
- Decorative 3D cards: `aria-hidden="true"` if purely visual; otherwise real text inside the card stays selectable and readable.
- Reveal animations: content hidden with `opacity: 0` is still in the accessibility tree (good). Never use `display: none` or `visibility: hidden` for the pre-reveal state.

## Mobile viewport units

- `100vh` on mobile includes the area behind the collapsing URL bar and overflows; `100dvh` resizes continuously (layout churn and snap targets that move while the bar animates); `100svh` is the small viewport (stable). The template uses `height: 100vh; height: 100svh;` (fallback first). Sections are measured from the DOM, so the engine adapts to whichever unit you choose; the step distance for tall sections uses `window.innerHeight`.
- A `ResizeObserver` on `documentElement` re-measures and realigns after URL-bar collapse or rotation.
- iOS: `touchmove` with `preventDefault` needs a non-passive listener on `window` (the template does). Pull-to-refresh and rubber-banding are suppressed while the engine runs; set `overscroll-behavior: none` on `html` if you want to be explicit.

## Wheel-hijack risks

| Risk | Mitigation |
|---|---|
| Users cannot reach footer links or long content | Make the last section tall or put a normal-flow footer after the snapped region and exempt it |
| Trackpad users skip or stutter | Gesture filter (one flick = one step); test with real trackpad, not only a mouse |
| Page feels broken on slow devices | Fall back to native scroll when the first rAF frames exceed ~50 ms, or when `navigator.hardwareConcurrency <= 2` and `deviceMemory` is low (heuristic; test it) |
| Assistive tech or automation sends `scrollTo` | The engine does not block `window.scrollTo`; after a native jump the next step recomputes from the real position |
| Lenis CDN fails | The module import is caught; the page keeps native scroll with static cards (reveals still work) |
| Users with motor impairments need fine control | Free-scroll toggle; keyboard stepping; no time-limited interactions |

## Checklist

1. Reduced motion on: no hijack, no tilt.
2. Keyboard only: reach every section and every control; focus ring always visible.
3. Screen reader pass: headings in order, nav is links, no unlabeled scrollers.
4. Zoom 200 percent and text-only zoom: content in a section no longer fits? Tall sections must step, not clip (`overflow: hidden` on a fixed-height section clips text at high zoom; use `min-height` instead of `height` for text-heavy sections).
5. Mobile Safari and Chrome Android real devices for URL-bar behaviour.
