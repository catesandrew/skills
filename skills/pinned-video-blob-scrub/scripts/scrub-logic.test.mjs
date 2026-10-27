// Self-check: node --test scripts/scrub-logic.test.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import { progressToTime, lerpStep, planSeek, bufferedFraction, readyDecision, chooseSource, parseConfig, clamp }
  from '../template/scrub-logic.js'

test('progressToTime clamps and guards bad duration', () => {
  assert.equal(progressToTime(-1, 8), 0)
  assert.equal(progressToTime(0.5, 8), 4)
  assert.equal(progressToTime(2, 8), 8)
  assert.equal(progressToTime(0.5, NaN), 0)
  assert.equal(progressToTime(0.5, 0), 0)
})

test('lerpStep moves a fraction then snaps', () => {
  assert.ok(Math.abs(lerpStep(0, 10, 0.2) - 2) < 1e-9)
  assert.equal(lerpStep(9.998, 10, 0.2), 10)
  let c = 0
  for (let i = 0; i < 200; i++) c = lerpStep(c, 5)
  assert.equal(c, 5) // converges exactly via snap
})

test('planSeek: skip / seek / queue', () => {
  assert.equal(planSeek({ playhead: 1, currentTime: 1.01, seeking: false }), 'skip')
  assert.equal(planSeek({ playhead: 2, currentTime: 1, seeking: false }), 'seek')
  assert.equal(planSeek({ playhead: 2, currentTime: 1, seeking: true }), 'queue')
})

test('bufferedFraction uses the range that starts at 0', () => {
  assert.equal(bufferedFraction([[0, 4]], 8), 0.5)
  assert.equal(bufferedFraction([[5, 8]], 8), 0)
  assert.equal(bufferedFraction([], 8), 0)
  assert.equal(bufferedFraction([[0, 9]], 8), 1)
})

test('readyDecision: ready, wait, timeout, error', () => {
  const ok = { readyState: 4, duration: 8, buffered: 1 }
  assert.equal(readyDecision({ ...ok }), 'ready')
  assert.equal(readyDecision({ ...ok, buffered: 0.5, threshold: 0.6 }), 'wait')
  assert.equal(readyDecision({ ...ok, buffered: 0.5, threshold: 0.6, elapsed: 2000 }), 'fallback')
  assert.equal(readyDecision({ ...ok, readyState: 2 }), 'wait')
  assert.equal(readyDecision({ ...ok, errored: true }), 'fallback')
  assert.equal(readyDecision({ ...ok, elapsed: 99999 }), 'ready') // ready beats timeout
  assert.equal(readyDecision({ readyState: 4, duration: NaN, buffered: 1 }), 'wait')
})

test('chooseSource: mobile, candidates, reduced motion', () => {
  const webmOnly = (t) => t === 'video/webm'
  assert.equal(chooseSource({ desktop: 'a.mp4 a.webm', canPlay: webmOnly }).src, 'a.webm')
  assert.equal(chooseSource({ desktop: 'a.mp4', mobile: 'm.mp4', isMobile: true, canPlay: () => true }).src, 'm.mp4')
  assert.equal(chooseSource({ desktop: 'a.mp4', mobile: ' ', isMobile: true, canPlay: () => true }).src, 'a.mp4')
  assert.equal(chooseSource({ desktop: 'a.mp4', reducedMotion: true, canPlay: () => true }).mode, 'stills')
  assert.equal(chooseSource({ desktop: 'a.mp4', canPlay: () => false }).reason, 'no-playable-source')
  assert.equal(chooseSource({ desktop: 'a.mp4?x=1', canPlay: (t) => t === 'video/mp4' }).src, 'a.mp4?x=1')
})

test('parseConfig defaults and clamping', () => {
  const d = parseConfig({})
  assert.equal(d.smoothing, 0.18)
  assert.equal(d.readyTimeout, 2000)
  assert.equal(d.readyThreshold, 0.6)
  assert.equal(d.start, 'top top')
  assert.equal(d.preload, 'blob')
  assert.equal(d.normalize, false)
  const c = parseConfig({ smoothing: '5', readyThreshold: '-1', readyTimeout: 'x', preload: 'direct', normalizeScroll: 'true' })
  assert.equal(c.smoothing, 1)
  assert.equal(c.readyThreshold, 0)
  assert.equal(c.readyTimeout, 2000)
  assert.equal(c.preload, 'direct')
  assert.equal(c.normalize, true)
  assert.equal(clamp(5, 0, 1), 1)
})
