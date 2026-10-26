// Self-check: node --test scripts/encode.test.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import { plan } from './encode.mjs'

test('hero uses a short GOP, no audio, faststart', () => {
  const [a] = plan('hero', ['in.mp4', 'out.mp4'])
  assert.ok(a.includes('-an') && a.includes('+faststart'))
  assert.equal(a[a.indexOf('-g') + 1], '6')
  assert.equal(a.at(-1), 'out.mp4')
})

test('--gop override applies to g and keyint_min', () => {
  const [a] = plan('hero', ['in.mp4', 'out.mp4'], '1')
  assert.equal(a[a.indexOf('-g') + 1], '1')
  assert.equal(a[a.indexOf('-keyint_min') + 1], '1')
})

test('concat writes one escaped file line per segment', () => {
  const [a, extra] = plan('concat', ['out.mp4', "a'b.mp4", 'c.mp4'])
  assert.equal(extra.body, "file 'a'\\''b.mp4'\nfile 'c.mp4'\n")
  assert.equal(a.at(-1), 'out.mp4')
})

test('unknown command throws', () => {
  assert.throws(() => plan('nope', []))
})
