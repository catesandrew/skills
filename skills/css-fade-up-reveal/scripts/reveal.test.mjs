// Self-check: node --test scripts/reveal.test.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const { parseVariant, parseDelay, staggerDelay, VARIANTS } = createRequire(import.meta.url)('../template/reveal.js')

test('parseVariant accepts known variants case-insensitively, else up', () => {
  for (const v of VARIANTS) assert.equal(parseVariant(v.toUpperCase()), v)
  assert.equal(parseVariant(''), 'up')
  assert.equal(parseVariant(null), 'up')
  assert.equal(parseVariant('spin'), 'up')
})

test('parseDelay handles ms, s, bare numbers and garbage', () => {
  assert.equal(parseDelay('200'), 200)
  assert.equal(parseDelay('200ms'), 200)
  assert.equal(parseDelay('0.25s'), 250)
  assert.equal(parseDelay('-5'), 0)
  assert.equal(parseDelay('abc'), 0)
  assert.equal(parseDelay(undefined), 0)
})

test('staggerDelay is linear then capped', () => {
  assert.equal(staggerDelay(0, 80), 0)
  assert.equal(staggerDelay(3, 80), 240)
  assert.equal(staggerDelay(50, 80), 600)
  assert.equal(staggerDelay(50, 80, 1000), 1000)
  assert.equal(staggerDelay(-2, 80), 0)
  assert.equal(staggerDelay(2), 160)
})
