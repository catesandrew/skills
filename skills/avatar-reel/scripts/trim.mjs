#!/usr/bin/env node
// Cut dead air: silences longer than --min (default 0.6s) are shortened, leaving --pad (0.2s) each side.
// Usage: trim.mjs <in.mp4> <out.mp4> [--min 0.6] [--db -35] [--pad 0.2]
import { spawnSync } from 'node:child_process'
import { writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export function silences(input, db, min) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', input, '-af', `silencedetect=noise=${db}dB:d=${min}`, '-f', 'null', '-'], { encoding: 'utf8' })
  const out = []
  for (const l of r.stderr.split('\n')) {
    const s = l.match(/silence_start: ([\d.]+)/), e = l.match(/silence_end: ([\d.]+)/)
    if (s) out.push({ start: +s[1] })
    if (e && out.length) out.at(-1).end = +e[1]
  }
  return out
}

export function duration(input) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', input], { encoding: 'utf8' })
  return parseFloat(r.stdout)
}

// keep-segments = complement of silences, each grown by pad
export function keepSegments(sil, total, pad) {
  const keep = []
  let cur = 0
  for (const s of sil) {
    if (s.start - cur > 0.05) keep.push([Math.max(0, cur - pad), Math.min(total, s.start + pad)])
    cur = s.end ?? total
  }
  if (total - cur > 0.05) keep.push([Math.max(0, cur - pad), total])
  const merged = []
  for (const k of keep) {
    if (merged.length && k[0] <= merged.at(-1)[1]) merged.at(-1)[1] = Math.max(merged.at(-1)[1], k[1])
    else merged.push([...k])
  }
  return merged
}

export function trim(input, output, { min = 0.6, db = -35, pad = 0.2 } = {}) {
  const total = duration(input)
  const segs = keepSegments(silences(input, db, min), total, pad)
  if (!segs.length) throw new Error('no speech detected; check the avatar video has audio')
  const f = segs.map(([a, b], i) =>
    `[0:v]trim=${a}:${b},setpts=PTS-STARTPTS[v${i}];[0:a]atrim=${a}:${b},asetpts=PTS-STARTPTS[a${i}]`).join(';')
    + ';' + segs.map((_, i) => `[v${i}][a${i}]`).join('') + `concat=n=${segs.length}:v=1:a=1[v][a]`
  const script = join(mkdtempSync(join(tmpdir(), 'trim-')), 'graph.txt')
  writeFileSync(script, f)
  const r = spawnSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', input, '-filter_complex_script', script,
    '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', '30', '-c:a', 'aac', '-b:a', '192k', output], { encoding: 'utf8' })
  if (r.status) throw new Error(r.stderr)
  return { before: total, after: duration(output), segments: segs.length }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [i, o, ...rest] = process.argv.slice(2)
  const opt = {}
  for (let k = 0; k < rest.length; k += 2) opt[rest[k].slice(2)] = +rest[k + 1]
  const r = trim(i, o, opt)
  console.log(`trimmed ${r.before.toFixed(1)}s -> ${r.after.toFixed(1)}s (${r.segments} segments)`)
}
