// Self-check: node --test scripts/snap-logic.test.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  easeInOutCubic, cubicBezier, computeTarget, nearestIndex, clampIndex, normalizeDelta,
  keyToStep, swipeToStep, createGestureFilter, localProgress, tiltAngles, tiltCss,
  decomposeMatrix3d, rotationMatrix3d,
} from '../template/snap-logic.js'

const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) <= eps, `${a} != ${b}`)

test('easing endpoints, clamping and monotonic', () => {
  assert.equal(easeInOutCubic(0), 0)
  assert.equal(easeInOutCubic(1), 1)
  assert.equal(easeInOutCubic(-3), 0)
  assert.equal(easeInOutCubic(9), 1)
  let prev = -1
  for (let i = 0; i <= 200; i++) {
    const v = easeInOutCubic(i / 200)
    assert.ok(v >= prev)
    prev = v
  }
})

test('easeInOutCubic over 495 ms reproduces the measured samples within 3px', () => {
  for (const [ms, px] of [[92, 30], [206, 358], [414, 1215]]) {
    near(easeInOutCubic(ms / 495) * 1238, px, 3)
  }
})

test('cubicBezier(0.65,0,0.35,1) is monotonic with exact endpoints and close to easeInOutCubic', () => {
  const f = cubicBezier(0.65, 0, 0.35, 1)
  assert.equal(f(0), 0)
  assert.equal(f(1), 1)
  let prev = -1
  for (let i = 0; i <= 100; i++) { const v = f(i / 100); assert.ok(v >= prev); prev = v }
  near(f(0.5), 0.5, 1e-6)
  assert.ok(Math.abs(f(0.25) - easeInOutCubic(0.25)) < 0.05)
})

const vh = 800
const secs = [{ top: 0, height: 800 }, { top: 800, height: 800 }, { top: 1600, height: 1800 }, { top: 3400, height: 800 }]
const max = 4200 - vh

test('computeTarget: one section per step, clamped at both ends', () => {
  assert.equal(computeTarget({ scrollY: 0, dir: 1, sections: secs, vh, max }), 800)
  assert.equal(computeTarget({ scrollY: 800, dir: -1, sections: secs, vh, max }), 0)
  assert.equal(computeTarget({ scrollY: 0, dir: -1, sections: secs, vh, max }), 0)
  assert.equal(computeTarget({ scrollY: max, dir: 1, sections: secs, vh, max }), max)
})

test('computeTarget: walks a tall section a viewport at a time, then snaps', () => {
  assert.equal(computeTarget({ scrollY: 800, dir: 1, sections: secs, vh, max }), 1600)
  assert.equal(computeTarget({ scrollY: 1600, dir: 1, sections: secs, vh, max }), 2400)
  assert.equal(computeTarget({ scrollY: 2400, dir: 1, sections: secs, vh, max }), 2600) // bottom of tall section
  assert.equal(computeTarget({ scrollY: 2600, dir: 1, sections: secs, vh, max }), 3400)
  assert.equal(computeTarget({ scrollY: 3400, dir: -1, sections: secs, vh, max }), 2600) // lands on its bottom
  assert.equal(computeTarget({ scrollY: 2600, dir: -1, sections: secs, vh, max }), 1800)
  assert.equal(computeTarget({ scrollY: 1800, dir: -1, sections: secs, vh, max }), 1600)
})

test('computeTarget: a mid-section position snaps to a neighbour, never skips', () => {
  assert.equal(computeTarget({ scrollY: 300, dir: 1, sections: secs, vh, max }), 800)
  assert.equal(computeTarget({ scrollY: 300, dir: -1, sections: secs, vh, max }), 0)
})

test('nearestIndex and clampIndex', () => {
  assert.equal(nearestIndex(900, secs), 1)
  assert.equal(nearestIndex(-50, secs), 0)
  assert.equal(nearestIndex(99999, secs), 3)
  assert.equal(clampIndex(-1, 5), 0)
  assert.equal(clampIndex(9, 5), 4)
  assert.equal(clampIndex(3, 0), 0)
})

test('normalizeDelta handles lines and pages', () => {
  assert.equal(normalizeDelta(3, 1, vh), 48)
  assert.equal(normalizeDelta(1, 2, vh), vh)
  assert.equal(normalizeDelta(120, 0, vh), 120)
})

test('keyToStep maps navigation keys and leaves others alone', () => {
  assert.deepEqual(keyToStep('PageDown'), { dir: 1 })
  assert.deepEqual(keyToStep('ArrowUp'), { dir: -1 })
  assert.deepEqual(keyToStep(' '), { dir: 1 })
  assert.deepEqual(keyToStep(' ', true), { dir: -1 })
  assert.deepEqual(keyToStep('Home'), { to: 'first' })
  assert.deepEqual(keyToStep('End'), { to: 'last' })
  assert.equal(keyToStep('a'), null)
})

test('swipeToStep: distance or velocity, ignores taps', () => {
  assert.equal(swipeToStep(120, 400), 1)
  assert.equal(swipeToStep(-120, 400), -1)
  assert.equal(swipeToStep(20, 30), 1) // short but fast
  assert.equal(swipeToStep(20, 400), 0)
  assert.equal(swipeToStep(5, 10), 0)
})

// A synthetic trackpad flick: ramp up, peak, ~1s decaying tail, 16 ms apart.
function flick(start, sign = 1) {
  const out = []
  let t = start
  for (const d of [6, 18, 40, 70, 90]) { out.push({ deltaY: sign * d, t }); t += 16 }
  for (let d = 85; d >= 1; d = Math.floor(d * 0.93)) { out.push({ deltaY: sign * d, t }); t += 16 }
  return { events: out, end: t }
}

test('gesture filter: one trackpad flick (ramp + momentum tail) fires exactly once', () => {
  const f = createGestureFilter()
  const { events } = flick(1000)
  assert.ok(events.length > 30)
  assert.deepEqual(events.map((e) => f.accept(e)).filter(Boolean), [1])
})

test('gesture filter: two flicks separated by a pause fire twice', () => {
  const f = createGestureFilter()
  const a = flick(0)
  const b = flick(a.end + 300)
  assert.deepEqual([...a.events, ...b.events].map((e) => f.accept(e)).filter(Boolean), [1, 1])
})

test('gesture filter: a fresh flick on top of a decaying tail (no pause) fires again', () => {
  const f = createGestureFilter()
  const tail = flick(0).events.slice(0, 20)
  const t = tail.at(-1).t + 16
  const fresh = [{ deltaY: 25, t }, { deltaY: 70, t: t + 16 }, { deltaY: 95, t: t + 32 }]
  assert.deepEqual([...tail, ...fresh].map((e) => f.accept(e)).filter(Boolean), [1, 1])
})

test('gesture filter: rapid mouse notches fire once, a notch after a pause fires again', () => {
  const f = createGestureFilter()
  const fired = []
  for (let i = 0; i < 6; i++) fired.push(f.accept({ deltaY: 100, t: i * 40 }))
  fired.push(f.accept({ deltaY: 100, t: 600 }))
  assert.deepEqual(fired, [1, 0, 0, 0, 0, 0, 1])
})

test('gesture filter: ignores tiny deltas, honours direction and in-burst reversal', () => {
  const f = createGestureFilter()
  assert.equal(f.accept({ deltaY: 2, t: 0 }), 0)
  assert.equal(f.accept({ deltaY: -100, t: 1000 }), -1)
  assert.equal(f.accept({ deltaY: -100, t: 1030 }), 0)
  assert.equal(f.accept({ deltaY: 100, t: 1060 }), 1)
})

test('tilt: rest at local 0, clamps outside [-1,1], ease and per-card stagger', () => {
  const rest = tiltAngles(0)
  assert.deepEqual(rest, { x: 4, y: 17.6, z: 1 })
  near(tiltAngles(1).y, 17.6 - 35)
  near(tiltAngles(5).y, tiltAngles(1).y)
  near(tiltAngles(-1).y, 17.6 + 35)
  near(tiltAngles(0, { stagger: 0.5 }).y, 17.6 - 17.5)
  near(tiltAngles(0.5, { ease: (t) => t * t }).y, 17.6 - 35 * 0.25)
  near(localProgress(1600, 1, 800), 1)
  assert.equal(localProgress(0, 3, 800), -1)
  assert.equal(tiltCss(rest), 'rotateX(4.000deg) rotateY(17.600deg) rotateZ(1.000deg)')
})

test('matrix3d decomposition round-trips rotateX rotateY rotateZ and reads translation', () => {
  for (const [x, y, z] of [[4, 17.6, 1], [0, 0, 0], [-12, 30, 5], [20, -45, -10]]) {
    const d = decomposeMatrix3d(rotationMatrix3d(x, y, z))
    near(d.rotateX, x, 1e-9); near(d.rotateY, y, 1e-9); near(d.rotateZ, z, 1e-9)
    near(d.scale[0], 1, 1e-9)
  }
  const m = rotationMatrix3d(4, 17.6, 1); m[12] = 10; m[13] = -5; m[14] = 3
  assert.deepEqual(decomposeMatrix3d(m).translate, [10, -5, 3])
})
