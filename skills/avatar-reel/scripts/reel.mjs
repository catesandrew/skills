#!/usr/bin/env node
// Orchestrator. Work dir holds every artifact so any step can be re-run.
//   reel.mjs generate <script.txt> --avatar "Name" [--work work] [--bg "#0b0b10"]     (paid: HeyGen)
//   reel.mjs prepare  <script.txt> [--video file.mp4] [--work work] [--engine faster-whisper|fish] [--no-trim]
//   reel.mjs render   [--work work] [--template dark|light|punch|path.json] [--draft]
//                     [--face-zoom 1.3] [--face-x 0] [--face-y 0] [--music f.mp3] [--sfx-dir d] [--out final.mp4]
import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseScript, mapCues } from './cues.mjs'
import { trim, duration } from './trim.mjs'
import { loadEnv } from './env.mjs'

loadEnv()
const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const [cmd, ...rest] = process.argv.slice(2)
const pos = [], o = {}
for (let i = 0; i < rest.length; i++) {
  if (rest[i].startsWith('--')) {
    const k = rest[i].slice(2)
    o[k] = rest[i + 1] && !rest[i + 1].startsWith('--') ? rest[++i] : true
  } else pos.push(rest[i])
}
const work = resolve(o.work || 'work')
mkdirSync(work, { recursive: true })
const run = (c, args, opts = {}) => {
  const r = spawnSync(c, args, { stdio: 'inherit', ...opts })
  if (r.status) { console.error(`${c} failed (exit ${r.status})`); process.exit(r.status) }
}
const loadTemplate = (n = 'dark') => JSON.parse(readFileSync(existsSync(n) ? n : join(root, 'templates', `${n}.json`), 'utf8'))

if (cmd === 'generate') {
  const parsed = parseScript(readFileSync(pos[0], 'utf8'))
  writeFileSync(join(work, 'spoken.txt'), parsed.spoken)
  const bg = o.bg || loadTemplate(o.template).bg
  run('node', [join(here, 'heygen.mjs'), 'generate', '--avatar', o.avatar || process.env.HEYGEN_AVATAR_NAME || '', '--text-file', join(work, 'spoken.txt'), '--out', join(work, 'avatar.raw.mp4'), '--bg', bg])
} else if (cmd === 'prepare') {
  const parsed = parseScript(readFileSync(pos[0], 'utf8'))
  const raw = o.video ? resolve(o.video) : join(work, 'avatar.raw.mp4')
  if (!existsSync(raw)) { console.error(`no video at ${raw}; run generate first or pass --video`); process.exit(1) }
  const avatar = join(work, 'avatar.mp4')
  if (o['no-trim']) copyFileSync(raw, avatar)
  else { const r = trim(raw, avatar); console.log(`trim: ${r.before.toFixed(1)}s -> ${r.after.toFixed(1)}s`) }
  const py = existsSync(join(root, '.venv/bin/python')) ? join(root, '.venv/bin/python') : 'python3'
  const tr = o.transcript ? resolve(o.transcript) : join(work, 'transcript.json')
  if (!o.transcript) run(py, [join(here, 'transcribe.py'), avatar, tr, '--engine', o.engine || process.env.TRANSCRIBER || 'faster-whisper'])
  const words = JSON.parse(readFileSync(tr, 'utf8')).words
  const res = mapCues(parsed, words)
  const plan = { ...res, words, duration: duration(avatar) }
  writeFileSync(join(work, 'cues.json'), JSON.stringify(plan, null, 2))
  const fmt = (t) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`
  const rows = res.cues.map((c) => `| ${fmt(c.t)} | ${c.type} | ${c.args.join(' / ') || c.note || ''} | ${c.dur ? c.dur + 's' : ''} | ${c.anchorWords} |`)
  writeFileSync(join(work, 'preview.md'), [
    `# Layout proposal (${fmt(plan.duration)} reel, ${(res.alignment.ratio * 100).toFixed(0)}% script/transcript alignment)`, '',
    '| Time | Cue | Content | Length | At words |', '|---|---|---|---|---|', ...rows, '',
    res.cues.some((c) => c.type === 'note') ? 'Rows typed `note` are unrecognized cues and are NOT rendered; say how to treat them.' : '',
    'Reply "approve" to render, or describe changes.',
  ].join('\n'))
  console.log(readFileSync(join(work, 'preview.md'), 'utf8'))
} else if (cmd === 'render') {
  const plan = JSON.parse(readFileSync(join(work, 'cues.json'), 'utf8'))
  const rem = join(root, 'remotion')
  if (!existsSync(join(rem, 'node_modules'))) { console.error('run scripts/setup.sh first'); process.exit(1) }
  mkdirSync(join(rem, 'public'), { recursive: true })
  copyFileSync(join(work, 'avatar.mp4'), join(rem, 'public/avatar.mp4'))
  const draft = !!o.draft
  const props = {
    video: 'avatar.mp4', duration: plan.duration, fps: 30, words: plan.words,
    cues: plan.cues.filter((c) => c.type !== 'note'), template: loadTemplate(o.template),
    framing: { scale: +(o['face-zoom'] || 1), x: +(o['face-x'] || 0), y: +(o['face-y'] || 0), originY: 30 },
  }
  const propsFile = join(work, 'props.json')
  writeFileSync(propsFile, JSON.stringify(props))
  // Offline/proxied machines can't fetch Remotion's headless shell: fall back to an installed Chrome.
  const chrome = o.browser || process.env.CHROME_PATH || ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].find(existsSync)
  const silent = join(work, draft ? 'draft.silent.mp4' : 'reel.silent.mp4')
  run('npx', ['remotion', 'render', 'src/index.ts', 'Reel', silent, `--props=${propsFile}`, '--muted', '--codec=h264', ...(process.env.REMOTION_USE_SYSTEM_CHROME && chrome ? [`--browser-executable=${chrome}`] : []), ...(draft ? ['--scale=0.5', '--crf=30'] : ['--crf=18'])], { cwd: rem })
  run('node', [join(here, 'mix.mjs'), '--work', work, '--video', silent, '--out', resolve(o.out || (draft ? join(work, 'draft.mp4') : 'reel-final.mp4')),
    ...(o.music ? ['--music', resolve(o.music)] : []), ...(o['sfx-dir'] ? ['--sfx-dir', resolve(o['sfx-dir'])] : [])])
} else {
  console.error(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 7).join('\n').replaceAll('// ', ''))
  process.exit(2)
}
