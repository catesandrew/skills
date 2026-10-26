#!/usr/bin/env node
// Parse a reel script into spoken text + [bracket] cues, and map cues to timestamps.
// CLI: cues.mjs parse <script.txt> <spoken.txt> | map <script.txt> <transcript.json> <cues.json>
import { readFileSync, writeFileSync } from 'node:fs'

export const CUE_TYPES = ['title', 'stat', 'lower', 'emphasis', 'sfx', 'zoom', 'music']
const DEFAULT_DUR = { title: 2.2, stat: 2.2, lower: 2.5, emphasis: 0, sfx: 0, zoom: 1.2, music: 0 }
const MAX_CHARS = 5000
const norm = (w) => w.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '')

// "[title: Free & open | dur=3]" -> {type:'title', args:['Free & open'], opts:{dur:3}}
function parseCue(inner) {
  const m = inner.match(/^\s*([A-Za-z-]+)\s*(?::\s*([\s\S]*))?$/)
  const type = m && CUE_TYPES.includes(m[1].toLowerCase()) ? m[1].toLowerCase() : 'note'
  const body = type === 'note' ? inner.trim() : (m[2] ?? '').trim()
  const args = []
  const opts = {}
  for (const part of body.split('|').map((s) => s.trim()).filter(Boolean)) {
    const kv = part.match(/^(dur|words|at)\s*=\s*([\d.]+)$/i)
    if (kv) opts[kv[1].toLowerCase()] = Number(kv[2])
    else args.push(part)
  }
  return { type: type === 'note' ? 'note' : m[1].toLowerCase(), args, opts }
}

export function parseScript(text) {
  const words = []
  const cues = []
  let spoken = ''
  const re = /\[([^\]]*)\]/g
  let last = 0
  const take = (chunk) => {
    spoken += chunk
    for (const w of chunk.split(/\s+/).filter(Boolean)) if (norm(w)) words.push(w)
  }
  for (let m; (m = re.exec(text)); ) {
    take(text.slice(last, m.index))
    cues.push({ raw: m[0], ...parseCue(m[1]), anchor: words.length })
    last = re.lastIndex
  }
  take(text.slice(last))
  spoken = spoken.replace(/\s+/g, ' ').trim()
  if (spoken.length > MAX_CHARS) throw new Error(`spoken text is ${spoken.length} chars; max ${MAX_CHARS}`)
  return { spoken, words, cues }
}

// LCS-align script words to transcript words, interpolate the unmatched ones.
export function alignWords(scriptWords, tw) {
  const a = scriptWords.map(norm)
  const b = tw.map((x) => norm(x.word))
  const n = a.length, m = b.length
  const W = m + 1
  const dp = new Uint16Array((n + 1) * W)
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i * W + j] = a[i] === b[j] ? dp[(i + 1) * W + j + 1] + 1 : Math.max(dp[(i + 1) * W + j], dp[i * W + j + 1])
  const times = new Array(n).fill(null)
  for (let i = 0, j = 0; i < n && j < m; ) {
    if (a[i] === b[j]) { times[i] = { start: tw[j].start, end: tw[j].end }; i++; j++ }
    else if (dp[(i + 1) * W + j] >= dp[i * W + j + 1]) i++
    else j++
  }
  const matched = times.filter(Boolean).length
  // shortcut: linear interpolation across gaps; fine for short runs like "33" vs "thirty three"
  for (let i = 0; i < n; i++) {
    if (times[i]) continue
    let p = i - 1, q = i + 1
    while (p >= 0 && !times[p]) p--
    while (q < n && !times[q]) q++
    const t0 = p >= 0 ? times[p].end : (tw[0]?.start ?? 0)
    const t1 = q < n ? times[q].start : (tw.at(-1)?.end ?? t0)
    const s = t0 + (t1 - t0) * ((i - p - 1) / (q - p - 1))
    const e = t0 + (t1 - t0) * ((i - p) / (q - p - 1))
    times[i] = { start: s, end: Math.max(s, e) }
  }
  return { times, matched, total: n }
}

export function mapCues(parsed, tw) {
  if (!tw.length) throw new Error('empty transcript')
  const { times, matched, total } = alignWords(parsed.words, tw)
  const end = tw.at(-1).end
  const cues = parsed.cues.map((c) => {
    const first = times[Math.min(c.anchor, times.length - 1)]
    const t = c.opts.at ?? (c.anchor >= times.length ? end : first.start)
    let dur = c.opts.dur ?? DEFAULT_DUR[c.type] ?? 0
    if (c.type === 'emphasis') {
      const n = c.opts.words ?? 3
      const lastW = times[Math.min(c.anchor + n - 1, times.length - 1)]
      dur = Math.max(0.3, lastW.end - t)
    }
    return {
      type: c.type, args: c.args, t: +t.toFixed(3), dur: +dur.toFixed(3),
      anchorWords: parsed.words.slice(c.anchor, c.anchor + 3).join(' ') || '(end)',
      ...(c.type === 'note' ? { note: c.raw } : {}),
    }
  })
  return { cues, alignment: { matched, total, ratio: total ? matched / total : 1 } }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [cmd, ...a] = process.argv.slice(2)
  const parsed = a[0] ? parseScript(readFileSync(a[0], 'utf8')) : null
  if (cmd === 'parse' && parsed) {
    writeFileSync(a[1], parsed.spoken)
    console.log(`spoken: ${parsed.spoken.length} chars, ${parsed.words.length} words, ${parsed.cues.length} cues`)
  } else if (cmd === 'map' && parsed) {
    const tr = JSON.parse(readFileSync(a[1], 'utf8'))
    const res = mapCues(parsed, tr.words)
    writeFileSync(a[2], JSON.stringify({ ...res, words: tr.words, duration: tr.words.at(-1).end }, null, 2))
    console.log(`mapped ${res.cues.length} cues, alignment ${(res.alignment.ratio * 100).toFixed(0)}%`)
  } else {
    console.error('usage: cues.mjs parse <script> <spoken.txt> | map <script> <transcript.json> <cues.json>')
    process.exit(2)
  }
}
