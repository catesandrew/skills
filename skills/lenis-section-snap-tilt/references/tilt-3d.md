# CSS 3D tilt panels

## Structure

```html
<div class="tilt-stage">      <!-- perspective lives here -->
  <div class="tilt-card">     <!-- rotation lives here -->
    ...
  </div>
</div>
```

```css
.tilt-stage { perspective: 1700px; perspective-origin: 50% 50%; }
.tilt-card  { transform-style: preserve-3d; backface-visibility: hidden; will-change: transform;
              transform: rotateX(4deg) rotateY(17.6deg) rotateZ(1deg); }
```

Measured on the reference page: parent `perspective: 1700px`; children `preserve-3d`, `backface-visibility: hidden`, `will-change: transform`, resting transform about `rotateX(4deg) rotateY(17.6deg) rotateZ(1deg)`. The rotation order in a `transform` list applies right to left to the element's points, but reads left to right as nested frames; `rotateX rotateY rotateZ` in that order is what `decomposeMatrix3d` assumes.

## Perspective: parent vs child vs function

- `perspective` property on a parent: one shared vanishing point for all children (what the reference does). Siblings converge consistently; cards side by side look like one scene.
- `transform: perspective(1700px) rotateY(...)` on each card: every card gets its own vanishing point at its own center, so a row of cards looks like separate objects. Use for isolated cards (hover tilt).
- `perspective` on the card itself and nothing on the parent: has no effect on the card's own rotation (perspective only affects descendants). This is the classic "my tilt looks flat" bug.
- Distance feel: smaller values (500-800 px) exaggerate depth and make 17 degrees look dramatic; 1700 px is subtle, nearly orthographic. Pick by eye; the value only matters relative to card size.

## preserve-3d pitfalls

`transform-style: preserve-3d` makes an element's children share its 3D space. Properties that force flattening (the element becomes a flat group, children lose depth):

- `overflow` other than `visible` (including `overflow: hidden` for rounded-corner clipping), `clip`, `clip-path`
- `opacity` below 1 (including an animated fade on the same element), `filter`, `mix-blend-mode`, `mask`, `isolation: isolate`
- `backdrop-filter`, `contain: paint`

Rules: put these on a leaf, not on an ancestor of a `preserve-3d` element. Fade the *card's content*, not the card; round corners with `border-radius` on the card plus `overflow: hidden` on an inner wrapper. If the card has no 3D children (a flat panel that only rotates as a unit), `preserve-3d` is unnecessary and can be dropped; the reference sets it, but a flat card does not need it. Note the template's section uses `overflow: hidden` on the section, which is an ancestor of the stage, not a descendant context of the card, so it clips but does not flatten the card.

## backface-visibility

`hidden` hides the card when it rotates past 90 degrees and shows its back. At the measured angles (at most about 35 degrees) it never triggers; it matters if the scroll mapping swings a card through 90+ degrees. Safari needs `-webkit-backface-visibility` only on very old versions.

## will-change budget

`will-change: transform` promotes a layer and reserves GPU memory (roughly width x height x 4 bytes per layer, more with device pixel ratio). Five cards is fine. Dozens of full-viewport layers on mobile is how a page gets killed for memory. Apply only to cards currently near the viewport (toggle via IntersectionObserver) or remove after the animation ends. Do not combine with `filter`/`backdrop-filter` on large areas.

## Mapping scroll progress to rotation

Use section-local progress, not global page progress, so each card has the same behaviour in its own turn:

```
local = clamp(scrollY / vh - index, -1, 1)      // -1 below the viewport, 0 on screen, +1 scrolled past
angle = rest + sign(local) * ease(|local|) * range
```

`tiltAngles(local, { rest, range, ease, stagger })` in `snap-logic.js`:

- Linear (`ease = t => t`): constant angular speed; the default and easiest to reason about.
- Eased (`t => t * t`, or `smoothstep`): small angles near rest so the card is steady while on screen, then a faster swing as it leaves. Usually looks better than linear for a snapped page, because snap holds the page at `local = 0` between glides.
- Per-card offset (`stagger`): shift each card's phase (0.1-0.3) so a row of cards does not rotate in lockstep.
- Because snap gives only 0.5 s of motion per section, a 35 degree swing means 70 deg/s on average; keep `|range|` under about 45 degrees for single-section hops.

The template's defaults (`rest = 4 / 17.6 / 1`, `range.y = -35`) are placeholders chosen to be visible, not measured. Measured: the reference page's `matrix3d` values did change over scroll; the mapping function and which input drove them were not identified (see `measurement.md`).

Write transforms from the Lenis `scroll` event (or one `requestAnimationFrame`), set `element.style.transform` directly, avoid layout reads in the same callback, and set values with fixed precision (3 decimals) to avoid style churn.

## Pointer parallax option

Layer a small pointer-driven offset on top of the scroll angle:

```js
addEventListener('pointermove', (e) => {
  pointer.x = (e.clientX / innerWidth - 0.5) * 2   // -1..1
  pointer.y = (e.clientY / innerHeight - 0.5) * 2
})
// in paint: rotateY += pointer.x * 4; rotateX -= pointer.y * 3
```

Smooth it (`lerp` toward the pointer each frame, factor 0.08) so it never jumps. Only for `(hover: hover) and (pointer: fine)`; skip on touch. Cap at about 4-6 degrees so it never fights the scroll mapping. Disable under reduced motion.

## Mobile and reduced motion

- Under 720 px: single-column layout; tilt at full strength crops the card against the viewport edge. Halve `rest` and `range`, or drop the rotation to `rotateX` only.
- `prefers-reduced-motion: reduce`: no engine, no tilt (`transform: none !important`), no reveal animation. The template does this in CSS and also destroys the engine live if the preference changes.
- Mobile GPUs: avoid `filter: blur` on tilting layers, keep image sizes within the card's rendered size, and cut `will-change` to the current card.

## Matrix decomposition (reading a reference page)

`getComputedStyle(el).transform` returns `matrix3d(m11, m12, m13, m14, m21, ..., m44)`, column-major: element `col*4 + row` of the 16-array is entry (row, col). For `transform: rotateX(a) rotateY(b) rotateZ(c)` the rotation block is:

```
R = Rx(a) * Ry(b) * Rz(c)
  = [ cb*cc                 -cb*sc                 sb     ]
    [ sa*sb*cc + ca*sc      -sa*sb*sc + ca*cc     -sa*cb  ]
    [ -ca*sb*cc + sa*sc      ca*sb*sc + sa*cc      ca*cb  ]
```

Therefore:

```
b = asin(R[0][2])
a = atan2(-R[1][2], R[2][2])
c = atan2(-R[0][1], R[0][0])
```

Before decomposing, divide each column by its length (scale). Translation is `m[12], m[13], m[14]`. Gimbal case: `|R[0][2]| ~ 1` (b near +-90 degrees), where a and c are not separable; set `c = 0` and solve `a = atan2(R[2][1], R[1][1])`. The module round-trips this (`rotationMatrix3d` -> `decomposeMatrix3d`) in the unit tests; it has not been checked against a browser-computed matrix. Caveats: a transform list in another order (for example `rotateY rotateX`), skew, or a parent chain with its own rotation changes the decomposition; compare `el.getBoundingClientRect()` and a parent's matrix too. `scripts/matrix-sampler.js` does the sampling and decomposition in DevTools.

## Debugging checklist

1. Tilt looks flat: perspective on the wrong element, or an ancestor with `overflow`/`filter`/`opacity` flattening a `preserve-3d` chain.
2. Card flickers or disappears: `backface-visibility` with an angle past 90 degrees, or z-fighting between coplanar siblings (offset one with `translateZ(1px)`).
3. Blurry text mid-rotation: expected during transform animation; `will-change` removal after the glide can re-rasterise sharp.
4. Jank: more than a handful of promoted layers, or `box-shadow`/`filter` repainting on each frame.
