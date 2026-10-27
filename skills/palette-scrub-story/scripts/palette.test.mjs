// Self-check: node --test scripts/palette.test.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createTheme, contrast, parse } from '../template/palette.js'
import { sweep } from './sweep-contrast.mjs'

const cfg = JSON.parse(readFileSync(new URL('../template/story.json', import.meta.url), 'utf8'))
const t = createTheme(cfg)

test('background hits first and last stops and passes every knot', () => {
  assert.deepEqual(t.bg(0).map(Math.round), parse('0D1A12'))
  assert.deepEqual(t.bg(1).map(Math.round), parse('F4F7F0'))
  cfg.palette.forEach((h, i) => assert.deepEqual(t.bg(cfg.knots[i]).map(Math.round), parse(h)))
})

test('background is continuous: no jump between adjacent samples', () => {
  let prev = t.bg(0)
  for (let i = 1; i <= 1000; i++) {
    const c = t.bg(i / 1000)
    assert.ok(Math.max(...c.map((v, k) => Math.abs(v - prev[k]))) < 3)
    prev = c
  }
})

test('text is light before the crossover and dark after it', () => {
  assert.deepEqual(t.fg(0).map(Math.round), parse('F4F7F0'))
  assert.deepEqual(t.fg(1).map(Math.round), parse('12200F'))
})

test('knots default to even spacing when omitted', () => {
  const even = createTheme({ ...cfg, knots: undefined })
  assert.deepEqual(even.bg(0.5).map(Math.round), parse('4A9B3F')) // 7 stops: the 4th sits at 3/6
})

test('scrim reaches the target against the worst pixel at every position', () => {
  assert.deepEqual(sweep(cfg).bad, [])
})

test('the reference timing keeps the scrim translucent (peaks at 0.745 as act 5 text appears)', () => {
  assert.ok(sweep(cfg).maxAlpha.a < 0.8)
})

test('a beat window over the mid-grey crossover is rejected', () => {
  const clash = structuredClone(cfg)
  clash.acts[4].beat = [0, 1] // act 5 spans progress .667-.833, where text passes through grey
  assert.ok(sweep(clash).bad.length > 0)
})

test('an impossible crossover is reported, not hidden', () => {
  // mid-grey text can never reach 7:1 against any pixel, with or without a scrim
  const bad = { ...cfg, text: { light: '808080', dark: '808080', crossAct: 4 }, minContrast: 7 }
  assert.ok(sweep(bad).bad.length > 0)
})

test('contrast helper: black on white is 21:1', () => {
  assert.equal(Math.round(contrast([0, 0, 0], [255, 255, 255])), 21)
})
