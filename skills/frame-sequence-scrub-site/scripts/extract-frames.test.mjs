// Self-check: node --test scripts/extract-frames.test.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import { plan } from './extract-frames.mjs'

test('defaults: 150 frames, 1600px, quality 3, 1-based padded names', () => {
  const a = plan('in.mp4', 'frames/orbit', {}, 10)
  assert.equal(a[a.indexOf('-frames:v') + 1], '150')
  assert.ok(a[a.indexOf('-vf') + 1].startsWith('fps=150/10,'))
  assert.ok(a[a.indexOf('-vf') + 1].includes('min(1600,iw)'))
  assert.equal(a[a.indexOf('-q:v') + 1], '3')
  assert.equal(a.at(-1), 'frames/orbit/frame_%04d.jpg')
})

test('webp switches the codec and the extension', () => {
  const a = plan('in.mp4', 'out', { format: 'webp', quality: 80 }, 5)
  assert.ok(a.includes('libwebp') && !a.includes('-q:v'))
  assert.equal(a.at(-1), 'out/frame_%04d.webp')
})

test('strips audio and never upscales', () => {
  const a = plan('in.mp4', 'out', { width: 1280 }, 8)
  assert.ok(a.includes('-an'))
  assert.ok(a[a.indexOf('-vf') + 1].includes("min(1280,iw)"))
})

test('bad format and bad duration throw', () => {
  assert.throws(() => plan('in.mp4', 'out', { format: 'png' }, 10))
  assert.throws(() => plan('in.mp4', 'out', {}, NaN))
  assert.throws(() => plan('in.mp4', 'out', {}, 0))
})
