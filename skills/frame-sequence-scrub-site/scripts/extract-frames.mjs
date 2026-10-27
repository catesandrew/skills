#!/usr/bin/env node
// Extract a fixed number of frames from a clip for the canvas scrub (see references/frame-budget.md).
// Add --dry-run to print the command only.
// Usage:
//   node scripts/extract-frames.mjs <in.mp4> <out-dir> [--frames 150] [--width 1600] [--quality 3] [--format jpg|webp] [--dry-run]
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

export function plan(input, outDir, { frames = 150, width = 1600, quality = 3, format = 'jpg' } = {}, duration) {
  if (!['jpg', 'webp'].includes(format)) throw new Error(`unknown format: ${format}`)
  if (!(duration > 0)) throw new Error('clip duration must be > 0')
  const codec = format === 'webp' ? ['-c:v', 'libwebp', '-quality', String(quality)] : ['-q:v', String(quality)]
  // fps = frames / duration spreads exactly `frames` stills across the clip; -frames:v trims any rounding extra.
  const vf = `fps=${frames}/${duration},scale='min(${width},iw)':-2`
  // 1-based, zero-padded: matches frameUrl() in template/scrub.js.
  return ['-i', input, '-an', '-vf', vf, '-frames:v', String(frames), ...codec, join(outDir, `frame_%04d.${format}`)]
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const rest = []
  const opts = {}
  let dry = false
  const argv = process.argv.slice(2)
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--dry-run') dry = true
    else if (a === '--frames') opts.frames = +argv[++i]
    else if (a === '--width') opts.width = +argv[++i]
    else if (a === '--quality') opts.quality = +argv[++i]
    else if (a === '--format') opts.format = argv[++i]
    else rest.push(a)
  }
  const [input, outDir] = rest
  if (!input || !outDir) { console.error('usage: extract-frames.mjs <in.mp4> <out-dir> [options]'); process.exit(2) }

  const probe = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', input], { encoding: 'utf8' })
  const duration = parseFloat(probe.stdout)
  let args
  try { args = plan(input, outDir, opts, duration) } catch (e) { console.error(e.message); process.exit(2) }

  console.log(['ffmpeg', ...args].join(' '))
  if (dry) process.exit(0)
  if (existsSync(outDir) && readdirSync(outDir).length) { console.error(`refusing to write into non-empty ${outDir}`); process.exit(1) }
  mkdirSync(outDir, { recursive: true })
  const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', ...args], { stdio: 'inherit' })
  if (r.status !== 0) process.exit(r.status ?? 1)

  const files = readdirSync(outDir)
  const bytes = files.reduce((n, f) => n + statSync(join(outDir, f)).size, 0)
  console.log(`${files.length} frames, ${(bytes / 1e6).toFixed(1)} MB in ${outDir}`)
}
