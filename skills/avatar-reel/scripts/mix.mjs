#!/usr/bin/env node
// Final audio mix + export: avatar voice + optional ducked music + SFX at cue times, loudness-normalised, muxed onto the silent Remotion video.
// Usage: mix.mjs --work work --video silent.mp4 --out final.mp4 [--music f.mp3] [--sfx-dir dir]
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const o = {}
for (let i = 2; i < process.argv.length; i += 2) o[process.argv[i].slice(2)] = process.argv[i + 1]
const plan = JSON.parse(readFileSync(join(o.work, 'cues.json'), 'utf8'))
const ff = (args) => { const r = spawnSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...args], { stdio: 'inherit' }); if (r.status) process.exit(r.status) }

// Built-in synthesized fallbacks so SFX work with zero assets; drop whoosh.wav etc. in --sfx-dir to override.
const synth = {
  pop: 'sine=f=620:d=0.12,afade=t=out:st=0.03:d=0.09',
  ding: 'sine=f=1320:d=0.6,afade=t=out:st=0.05:d=0.55',
  whoosh: 'anoisesrc=d=0.5:c=pink,highpass=f=300,lowpass=f=4000,afade=t=in:d=0.2,afade=t=out:st=0.2:d=0.3',
}
const sfxDir = join(o.work, 'sfx')
mkdirSync(sfxDir, { recursive: true })
function sfxFile(name) {
  const n = (name || 'pop').toLowerCase().replace(/[^a-z0-9-]/g, '')
  for (const ext of ['wav', 'mp3']) if (o['sfx-dir'] && existsSync(join(o['sfx-dir'], `${n}.${ext}`))) return join(o['sfx-dir'], `${n}.${ext}`)
  const key = synth[n] ? n : 'pop'
  if (!synth[n]) console.error(`sfx "${name}" not found; using built-in pop`)
  const f = join(sfxDir, `${key}.wav`)
  if (!existsSync(f)) ff(['-f', 'lavfi', '-i', synth[key], f])
  return f
}

const sfx = plan.cues.filter((c) => c.type === 'sfx')
const inputs = ['-i', o.video, '-i', join(o.work, 'avatar.mp4')]
const fmt = 'aformat=sample_rates=44100:channel_layouts=stereo'
const chains = [o.music ? `[1:a]${fmt},asplit=2[voice][vside]` : `[1:a]${fmt}[voice]`]
const mixIn = ['[voice]']
let idx = 2
if (o.music) {
  inputs.push('-stream_loop', '-1', '-i', o.music)
  chains.push(`[${idx}:a]aformat=sample_rates=44100:channel_layouts=stereo,volume=0.35[m];[m][vside]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=400[duck]`)
  mixIn.push('[duck]'); idx++
}
for (const c of sfx) {
  inputs.push('-i', sfxFile(c.args[0]))
  const ms = Math.round(c.t * 1000)
  chains.push(`[${idx}:a]aformat=sample_rates=44100:channel_layouts=stereo,volume=0.5,adelay=${ms}|${ms}[s${idx}]`)
  mixIn.push(`[s${idx}]`); idx++
}
chains.push(`${mixIn.join('')}amix=inputs=${mixIn.length}:normalize=0:duration=first,loudnorm=I=-14:TP=-1.5:LRA=11[aout]`)
ff([...inputs, '-filter_complex', chains.join(';'), '-map', '0:v', '-map', '[aout]', '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p',
  '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', o.out])
console.log(`wrote ${o.out}`)
