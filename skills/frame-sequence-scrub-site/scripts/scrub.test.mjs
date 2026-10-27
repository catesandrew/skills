// Self-check for the template engine's pure helpers: node --test scripts/scrub.test.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const { frameUrl, frameIndex, coverRect } = createRequire(import.meta.url)('../template/scrub.js')

test('frameUrl is 1-based and zero-padded like ffmpeg frame_%04d', () => {
  assert.equal(frameUrl('assets/frames/orbit/frame_{n}.jpg', 1, 4), 'assets/frames/orbit/frame_0001.jpg')
  assert.equal(frameUrl('f_{n}.webp', 150, 4), 'f_0150.webp')
})

test('frameIndex maps 0..1 onto the first and last frame and clamps', () => {
  assert.equal(frameIndex(0, 150, false), 0)
  assert.equal(frameIndex(1, 150, false), 149)
  assert.equal(frameIndex(-0.5, 150, false), 0)
  assert.equal(frameIndex(2, 150, false), 149)
})

test('reverse plays the same frames backwards (the free reassembly chapter)', () => {
  assert.equal(frameIndex(0, 150, true), 149)
  assert.equal(frameIndex(1, 150, true), 0)
  assert.equal(frameIndex(0.5, 101, true), 50)
})

test('coverRect fills the canvas and centres the overflow', () => {
  const wide = coverRect(1600, 900, 1000, 1000) // taller canvas: scale to height, crop sides
  assert.equal(wide.h, 1000)
  assert.ok(wide.w > 1000 && wide.x < 0 && wide.y === 0)
  const tall = coverRect(1000, 1000, 1600, 900) // wider canvas: scale to width, crop top and bottom
  assert.equal(tall.w, 1600)
  assert.ok(tall.h > 900 && tall.y < 0 && tall.x === 0)
})
