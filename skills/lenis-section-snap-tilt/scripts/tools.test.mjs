// Self-check: node --test scripts/tools.test.mjs  (fit-easing + matrix-sampler decomposition)
import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { fit } from './fit-easing.mjs'
import { rotationMatrix3d } from '../template/snap-logic.js'

test('fit recovers easeInOutCubic and its duration from synthetic samples', () => {
  const D = 500
  const f = (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2)
  const samples = [100, 200, 300, 400].map((t) => [t, f(t / D) * 1000])
  const [best] = fit(samples, 1000)
  assert.equal(best.curve, 'easeInOutCubic')
  assert.equal(best.durationMs, 500)
  assert.ok(best.rmsPx < 0.01)
})

test('fit on the measured samples ranks easeInOutCubic first at about 495 ms', () => {
  const [best] = fit([[92, 30], [206, 358], [414, 1215]], 1238)
  assert.equal(best.curve, 'easeInOutCubic')
  assert.ok(Math.abs(best.durationMs - 495) <= 10)
  assert.ok(best.rmsPx < 3)
})

test('matrix-sampler decompose agrees with the module and parses matrix3d strings', () => {
  const require = createRequire(import.meta.url)
  const { decompose, toArray } = require('./matrix-sampler.js')
  const m = rotationMatrix3d(4, 17.6, 1)
  const d = decompose(toArray(`matrix3d(${m.join(', ')})`))
  assert.ok(Math.abs(d.rotateX - 4) < 1e-9 && Math.abs(d.rotateY - 17.6) < 1e-9 && Math.abs(d.rotateZ - 1) < 1e-9)
  assert.equal(toArray('none'), null)
  assert.equal(toArray('matrix(1, 0, 0, 1, 5, 6)')[12], 5)
})
