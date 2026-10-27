# Easing and timing

## Measured glide (the reference page)

One synthetic wheel event, `deltaY: 400`, viewport 1238 px high, one section = 1238 px. `scrollY` sampled per frame:

| ms after wheel | scrollY | fraction of 1238 |
|---|---|---|
| 92 | 30 | 0.024 |
| 206 | 358 | 0.289 |
| 414 | 1215 | 0.981 |
| ~550 | 1238 | 1.000 (settled) |

Shape: slow start (2.4% in the first 92 ms), fast middle (about 0.83 of the distance in 208 ms, 206 to 414), soft landing. That is an in-out curve, not Lenis's default ease-out-expo (`t => Math.min(1, 1.001 - 2 ** (-10 * t))`, which would be fast from frame one).

## Fit

Model: `y(t) = D * ease((t - t0) / T)` for `t0 <= t <= t0 + T`, clamped outside, with `D = 1238`. Unknowns: duration `T`, start offset `t0` (input latency, usually 0-50 ms), and the curve family. Three samples give two numbers of freedom after the curve is chosen, so a family fit is a consistency check, not proof.

Least squares over a grid:

```
minimise  sum_i ( D * ease((t_i - t0) / T) - y_i )^2     over T in [250, 900] ms, t0 in [0, 80] ms
```

`scripts/fit-easing.mjs` does exactly this (`node scripts/fit-easing.mjs '[[92,30],[206,358],[414,1215]]' 1238`). Result with `t0 = 0`:

| curve | T (ms) | RMS error (px) |
|---|---|---|
| easeInOutCubic | 495 | 1.4 |
| cubic-bezier(.76,0,.24,1) | 470 | 8.2 |
| cubic-bezier(.65,0,.35,1) | 490 | 9.5 |
| easeInOutQuart | 475 | 15.6 |
| easeInOutQuint | 460 | 19.0 |
| easeInOutQuad | 510 | 54.3 |
| easeInOutSine | 510 | 75.6 |
| Lenis default (ease-out expo) | 900 | 501.5 |

easeInOutCubic over about 0.5 s reproduces all three samples within 3 px (predictions 31.8, 356, 1216 vs 30, 358, 1215). The "settled ~550 ms" observation is the 495 ms animation plus up to a couple of frames of rAF/IPC latency, which is why the template uses `GLIDE_SECONDS = 0.5`. The previous draft's 0.55 was the observed end time, not the animation duration.

In the template's own browser run (real wheel input, 1280x800, same curve, 0.5 s) the first movement frame came 47 ms after dispatch and `scrollY` reached the target at 488 ms. Same shape, same order of magnitude; do not expect frame-exact agreement across machines.

## Easing table

| Curve | Formula (t in 0..1) | Feel | Use |
|---|---|---|---|
| easeInOutSine | `-(cos(pi t) - 1) / 2` | gentle, nearly linear in the middle | long scrolls (> 1 s) |
| easeInOutQuad | `t<.5 ? 2t^2 : 1-(-2t+2)^2/2` | soft | calm sites |
| easeInOutCubic | `t<.5 ? 4t^3 : 1-(-2t+2)^3/2` | measured match | default for section snap |
| easeInOutQuart | `t<.5 ? 8t^4 : 1-(-2t+2)^4/2` | snappier middle, longer tails | punchy |
| easeInOutQuint | `t<.5 ? 16t^5 : ...` | very sharp | short hops only |
| cubic-bezier(.65,0,.35,1) | CSS "easeInOutCubic" | close to the cubic above (max error ~0.05 in y) | when you need a CSS string |
| Lenis default | `min(1, 1.001 - 2^(-10 t))` | immediate, long tail | continuous smooth scroll, not snap |

Sanity values for easeInOutCubic: f(0.25) = 0.0625, f(0.5) = 0.5, f(0.75) = 0.9375.

## Converting a captured curve to cubic-bezier

For a curve from `(0,0)` to `(1,1)` with control points `P1 = (x1, y1)`, `P2 = (x2, y2)`:

```
x(s) = 3(1-s)^2 s x1 + 3(1-s) s^2 x2 + s^3
y(s) = 3(1-s)^2 s y1 + 3(1-s) s^2 y2 + s^3
```

Given normalised samples `(x_i = t_i / T, y_i)`, solve for the four parameters by minimising `sum (y(s_i) - y_i)^2` where `s_i` solves `x(s_i) = x_i` (bisection, 40 iterations; see `cubicBezier` in `snap-logic.js`). Constrain `x1, x2` to `[0, 1]`. With fewer than about 8 samples do not fit all four; fix `y1 = 0, y2 = 1` (zero start and end velocity) and search `x1, x2` only. To get more samples, run `wheel-sampler.js` in `listen` mode several times, or capture frames in a screen recording and read pixel offsets.

## Choosing duration

Rule of thumb: 0.4-0.7 s for one-viewport hops. Below 0.35 s the motion reads as a jump and the 3D tilt has no time to read; above 0.8 s users start wheeling again before it settles and perceive lag. Scale with distance if you add long jumps (hash links across five sections): `T = clamp(0.5 + 0.12 * (sections - 1), 0.5, 1.1)`, and keep `GLIDE_SECONDS` for single steps so the gesture lock stays predictable.

## Timing the lock

The lock must outlast the animation, otherwise a tail event can start a second glide as the first ends. The template unlocks on `onComplete` (animation done), then relies on the gesture filter (quiet gap 120 ms, decay tracking) to reject the still-arriving momentum tail. A 39-event trackpad flick lasts ~650 ms, longer than the 500 ms glide, so the filter, not the lock, is what makes one flick equal one step.
