#!/usr/bin/env node
// Sweep scroll progress 0..1 and report text contrast, with and without the scrim.
// Only positions where a beat is on screen (inside an act's `beat` window) are
// graded: the scrim is nearly transparent elsewhere. Fails (exit 1) if any graded
// position cannot reach minContrast, or needs a scrim so strong it hides the footage.
// Usage: node scripts/sweep-contrast.mjs [path/to/story.json]
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createTheme, contrast } from '../template/palette.js'

const MAX_SCRIM = 0.85 // above this the footage is effectively hidden behind the text

function beatVisible(cfg, p) {
  const n = cfg.acts.length
  const act = Math.min(n - 1, Math.floor(p * n))
  const local = p * n - act
  const [start, end] = cfg.acts[act].beat
  return local >= start && (local <= end || act === n - 1)
}

export function sweep(cfg, steps = 400) {
  const t = createTheme(cfg)
  let minBare = { c: Infinity, p: 0 }
  let maxAlpha = { a: 0, p: 0 }
  const bad = []
  for (let i = 0; i <= steps; i++) {
    const p = i / steps
    const f = t.fg(p)
    const c = contrast(f, t.bg(p))
    if (c < minBare.c) minBare = { c, p }
    if (!beatVisible(cfg, p)) continue
    const s = t.scrim(f)
    if (s.alpha > maxAlpha.a) maxAlpha = { a: s.alpha, p }
    if (!s.ok || s.alpha > MAX_SCRIM) bad.push(p)
  }
  return { minBare, maxAlpha, bad, min: t.min }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const file = process.argv[2] ?? new URL('../template/story.json', import.meta.url)
  const r = sweep(JSON.parse(readFileSync(file, 'utf8')))
  console.log(`text vs page background, no scrim: min ${r.minBare.c.toFixed(2)}:1 at progress ${r.minBare.p.toFixed(3)}`)
  console.log(`strongest scrim needed while text is on screen: alpha ${r.maxAlpha.a.toFixed(3)} at progress ${r.maxAlpha.p.toFixed(3)} (target ${r.min}:1)`)
  if (r.bad.length) {
    console.error(`FAIL: text on screen at progress ${r.bad[0].toFixed(3)}..${r.bad.at(-1).toFixed(3)} needs ${r.min}:1 but no scrim under ${MAX_SCRIM} gets there; move text.crossAct/crossSpan or the beat windows`)
    process.exit(1)
  }
  console.log('OK: every on-screen text position reaches the target against the worst footage pixel')
}
