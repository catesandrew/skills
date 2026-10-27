// Self-check: node --test scripts/assemble-prompts.test.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import { assemble, MOTION } from './assemble-prompts.mjs'

const ok = () => ({
  brand: 'Test', world: 'Shot on a 35mm lens, soft daylight.', referenceImage: 'A cup on concrete.',
  acts: [
    { file: 'one', mode: 'text-to-video', prompt: 'Scene one.' },
    { file: 'two', mode: 'image-to-video', prompt: 'Scene two.' },
    { file: 'three', mode: 'image-to-video', prompt: 'Scene three.' },
  ],
})

test('a valid pack gets the identical suffix on every clip', () => {
  const r = assemble(ok())
  assert.deepEqual(r.problems, [])
  r.clips.forEach((c) => assert.ok(c.full.endsWith(r.suffix)))
  assert.ok(r.suffix.includes(MOTION) && r.suffix.includes('5 seconds. 1080p.'))
})

test('image-to-video without a reference image is rejected', () => {
  const s = ok(); delete s.referenceImage
  assert.match(assemble(s).problems.join(), /needs a referenceImage/)
})

test('duplicate file names are rejected', () => {
  const s = ok(); s.acts[1].file = 'one'
  assert.match(assemble(s).problems.join(), /duplicate file name/)
})

test('a prompt that already has the suffix is rejected', () => {
  const s = ok(); s.acts[0].prompt = `Scene. ${MOTION}`
  assert.match(assemble(s).problems.join(), /already carries the suffix/)
})

test('a pack with no text-to-video opener is rejected', () => {
  const s = ok(); s.acts[0].mode = 'image-to-video'
  assert.match(assemble(s).problems.join(), /no text-to-video act/)
})

test('missing world line is rejected', () => {
  const s = ok(); delete s.world
  assert.match(assemble(s).problems.join(), /world: missing/)
})
