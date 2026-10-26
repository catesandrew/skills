// Self-check: node --test scripts/copy-gate.test.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import { scan } from './copy-gate.mjs'

test('flags em dashes with line numbers', () => {
  const hits = scan('ok\nA fresh roast — every day')
  assert.deepEqual(hits.map((h) => [h.line, h.what]), [[2, 'em dash']])
})

test('flags stock words and their stems, case-insensitively', () => {
  const hits = scan('We Leverage beans.\nIt unlocks flavor.\nSeamless pours.')
  assert.deepEqual(hits.map((h) => h.what), ['leverage', 'unlock', 'seamless'])
})

test('passes plain copy', () => {
  assert.deepEqual(scan('Small batches, roasted on Tuesdays.'), [])
})
