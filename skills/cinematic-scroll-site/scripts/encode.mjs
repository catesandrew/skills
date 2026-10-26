#!/usr/bin/env node
// Scrub-pipeline encodes (see references/ffmpeg-recipes.md). Add --dry-run to print the command only.
// Usage:
//   node scripts/encode.mjs hero   <in.mp4> <out.mp4> [--gop 6]
//   node scripts/encode.mjs poster <in.mp4> <out.jpg>
//   node scripts/encode.mjs last   <in.mp4> <out.png>        # lossless last frame for chaining
//   node scripts/encode.mjs concat <out.mp4> <seg1.mp4> <seg2.mp4> ... [--gop 6]
import { spawnSync } from 'node:child_process'
import { writeFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERO = (gop) => ['-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-g', gop, '-keyint_min', gop,
  '-sc_threshold', '0', '-pix_fmt', 'yuv420p', '-movflags', '+faststart']

export function plan(cmd, args, gop = '6') {
  switch (cmd) {
    case 'hero': return [['-i', args[0], ...HERO(gop), args[1]]]
    case 'poster': return [['-i', args[0], '-frames:v', '1', '-q:v', '2', args[1]]]
    case 'last': return [['-sseof', '-0.1', '-i', args[0], '-frames:v', '1', args[1]]]
    case 'concat': {
      const [out, ...segs] = args
      const list = join(tmpdir(), `concat-${process.pid}.txt`)
      const body = segs.map((s) => `file '${s.replace(/'/g, "'\\''")}'`).join('\n') + '\n'
      return [['-f', 'concat', '-safe', '0', '-i', list, ...HERO(gop), out], { list, body }]
    }
    default: throw new Error(`unknown command: ${cmd}`)
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const rest = []
  let dry = false
  let gop = '6'
  const argv = process.argv.slice(2)
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--dry-run') dry = true
    else if (argv[i] === '--gop') gop = argv[++i]
    else rest.push(argv[i])
  }
  const [cmd, ...args] = rest
  let steps
  try { steps = plan(cmd, args, gop) } catch (e) { console.error(e.message); process.exit(2) }
  const [ffArgs, extra] = steps
  const out = ffArgs[ffArgs.length - 1]
  if (!dry && existsSync(out)) { console.error(`refusing to overwrite ${out}`); process.exit(1) }
  console.log(['ffmpeg', ...ffArgs].join(' '))
  if (dry) process.exit(0)
  if (extra) writeFileSync(extra.list, extra.body)
  const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', ...ffArgs], { stdio: 'inherit' })
  process.exit(r.status ?? 1)
}
