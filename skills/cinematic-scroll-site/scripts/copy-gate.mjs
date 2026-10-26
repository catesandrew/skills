#!/usr/bin/env node
// Copy gate: fails on em dashes and stock words in a built page.
// Usage: node scripts/copy-gate.mjs path/to/index.html   (exit 1 on any hit)
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export const STOCK = ['leverage', 'seamless', 'empower', 'unlock', 'robust', 'actionable', 'data-driven', 'solutions']

export function scan(text) {
  const hits = []
  text.split('\n').forEach((line, i) => {
    if (line.includes('—')) hits.push({ line: i + 1, what: 'em dash', text: line.trim() })
    for (const w of STOCK) {
      // stem match: "unlock" also catches unlocks/unlocked; "solutions" matches as-is
      if (new RegExp(`\\b${w}`, 'i').test(line)) hits.push({ line: i + 1, what: w, text: line.trim() })
    }
  })
  return hits
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const file = process.argv[2]
  if (!file) { console.error('usage: copy-gate.mjs <index.html>'); process.exit(2) }
  const hits = scan(readFileSync(file, 'utf8'))
  for (const h of hits) console.log(`${file}:${h.line}: ${h.what}: ${h.text.slice(0, 120)}`)
  console.log(hits.length ? `${hits.length} hit(s). Rewrite in plain friend-voice and re-run.` : 'Copy gate clean.')
  process.exit(hits.length ? 1 : 0)
}
