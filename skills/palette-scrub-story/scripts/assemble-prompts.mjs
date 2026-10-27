#!/usr/bin/env node
// Assemble and lint the per-subject prompt pack from a subject.json.
// The agent writes the creative parts (see references/prompt-templates.md); this
// applies the shared suffix identically to every clip and rejects packs that
// would scrub badly or drift between acts.
// Usage: node scripts/assemble-prompts.mjs subject.json [out.md]
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Scrubbing exposes easing and cuts, so every clip is told to have neither.
export const MOTION = 'Locked camera, constant speed throughout with no easing at the start or end, no cuts.'

export function assemble(subject) {
  const { world, seconds = 5, resolution = '1080p', referenceImage, acts } = subject
  const problems = []
  if (!world) problems.push('world: missing (lens, light, grain and grade, one sentence reused on every clip)')
  if (!Array.isArray(acts) || acts.length < 3) problems.push('acts: need at least 3 (the reference uses 6)')
  const files = new Set()
  const suffix = `${world ?? ''} ${MOTION} ${seconds} seconds. ${resolution}.`.trim()
  const clips = (acts ?? []).map((a, i) => {
    const tag = `act ${i + 1}${a.file ? ` (${a.file})` : ''}`
    if (!a.file || !/^[a-z0-9-]+$/.test(a.file)) problems.push(`${tag}: file must be a lowercase slug`)
    if (files.has(a.file)) problems.push(`${tag}: duplicate file name; the build prompt matches clips by name`)
    files.add(a.file)
    if (!['text-to-video', 'image-to-video'].includes(a.mode)) problems.push(`${tag}: mode must be text-to-video or image-to-video`)
    if (a.mode === 'image-to-video' && !referenceImage) problems.push(`${tag}: image-to-video needs a referenceImage`)
    if (!a.prompt) problems.push(`${tag}: prompt missing`)
    else if (a.prompt.includes('Locked camera') || a.prompt.includes('seconds.')) problems.push(`${tag}: prompt already carries the suffix; write only the scene`)
    return { ...a, full: `${a.prompt ?? ''} ${suffix}` }
  })
  if (clips.length && !clips.some((c) => c.mode === 'text-to-video')) problems.push('no text-to-video act: at least the opening clip should not depend on the product image')
  return { problems, suffix, clips }
}

export function render(subject, { clips, suffix }) {
  const out = [`# Prompt pack: ${subject.brand}`, '', 'Shared suffix on every clip:', '', '```', suffix, '```', '']
  if (subject.referenceImage) out.push('## Reference image (generate first)', '', '```', subject.referenceImage, '```', '')
  out.push('## Clips', '')
  clips.forEach((c, i) => out.push(`### ${i + 1} — ${c.file}.mp4 · ${c.mode}${c.risky ? ' · generate this one first' : ''}`, '', '```', c.full, '```', ''))
  if (subject.fallback) out.push(`## Fallback for ${subject.fallback.file}.mp4`, '', '```', `${subject.fallback.prompt} ${suffix}`, '```', '')
  return out.join('\n')
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [file, outFile] = process.argv.slice(2)
  if (!file) { console.error('usage: assemble-prompts.mjs subject.json [out.md]'); process.exit(2) }
  const subject = JSON.parse(readFileSync(file, 'utf8'))
  const r = assemble(subject)
  if (r.problems.length) { console.error(r.problems.map((p) => `FAIL: ${p}`).join('\n')); process.exit(1) }
  const md = render(subject, r)
  if (outFile) writeFileSync(outFile, md)
  else console.log(md)
}
