// Self-check: node --test scripts/cues.test.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import { parseScript, mapCues } from './cues.mjs'

const tr = 'Meet prompts chat the free open source prompt library. It has thirty three thousand stars!'
  .split(' ').map((word, i) => ({ word, start: i * 0.5, end: i * 0.5 + 0.4 }))

test('parse strips cues from spoken text and anchors them to the next word', () => {
  const p = parseScript('[title: prompts.chat | dur=3] Meet prompts chat the free [sfx: whoosh] open source prompt library.')
  assert.equal(p.spoken, 'Meet prompts chat the free open source prompt library.')
  assert.deepEqual(p.cues.map((c) => [c.type, c.anchor]), [['title', 0], ['sfx', 5]])
  assert.equal(p.cues[0].opts.dur, 3)
})

test('cues map to the start of their anchor word; trailing cue maps to the end', () => {
  const p = parseScript('[title: Hi] Meet prompts chat the free [sfx: pop] open source prompt library. It has 33 thousand stars! [sfx: ding]')
  const { cues, alignment } = mapCues(p, tr)
  assert.equal(cues[0].t, 0)
  assert.equal(cues[1].t, 2.5) // "open" is transcript word 5
  assert.equal(cues[2].t, tr.at(-1).end)
  assert.ok(alignment.ratio > 0.8) // "33" has no match and is interpolated
})

test('emphasis spans the next N words; unknown cues become notes; length cap enforced', () => {
  const p = parseScript('Meet [emphasis: | words=2] prompts chat [shake the screen]')
  const { cues } = mapCues(p, tr)
  assert.equal(cues[0].type, 'emphasis')
  assert.ok(Math.abs(cues[0].dur - 0.9) < 1e-6)
  assert.equal(cues[1].type, 'note')
  assert.throws(() => parseScript('a '.repeat(2600)), /max 5000/)
})
