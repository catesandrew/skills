// Self-check: node --test scripts/act-at.test.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import { actAt } from '../template/act-at.js'

test('equal 5s clips split the scroll into fifths', () => {
  const s = [5, 5, 5, 5, 5]
  assert.deepEqual([0, 0.19, 0.2, 0.5, 0.99, 1].map((p) => actAt(p, s)), [0, 0, 1, 2, 4, 4])
})

test('uneven durations move the boundaries', () => {
  assert.equal(actAt(0.3, [3, 5, 5, 5, 5]), 1) // 0.3 of 23s = 6.9s, act 2 starts at 3s
  assert.equal(actAt(0.1, [3, 5, 5, 5, 5]), 0)
})

test('out-of-range progress clamps', () => {
  assert.equal(actAt(-1, [5, 5]), 0)
  assert.equal(actAt(9, [5, 5]), 1)
})
