#!/usr/bin/env node
// HeyGen client (v2 API). Usage:
//   heygen.mjs avatars
//   heygen.mjs generate --avatar "Name" --text-file spoken.txt --out avatar.mp4 [--voice ID] [--bg "#0b0b10"] [--look ID]
import { readFileSync, writeFileSync } from 'node:fs'
import { loadEnv, secret, redact } from './env.mjs'

loadEnv()
const BASE = 'https://api.heygen.com'
let cached
const key = () => (cached ??= secret('HEYGEN_API_KEY'))

async function api(path, init = {}) {
  const res = await fetch(BASE + path, { ...init, headers: { 'X-Api-Key': key(), 'Content-Type': 'application/json', ...init.headers } })
  const body = await res.json().catch(() => ({}))
  if (!res.ok || body.error) throw new Error(`HeyGen ${path} -> ${res.status} ${JSON.stringify(body.error ?? body).slice(0, 300)}`)
  return body.data ?? body
}

export async function findAvatar(name) {
  const { avatars = [] } = await api('/v2/avatars')
  const hits = avatars.filter((a) => a.avatar_name?.toLowerCase() === name.toLowerCase())
  const partial = hits.length ? hits : avatars.filter((a) => a.avatar_name?.toLowerCase().includes(name.toLowerCase()))
  if (partial.length === 0) throw new Error(`no avatar named "${name}". Run: heygen.mjs avatars`)
  if (partial.length > 1) throw new Error(`"${name}" matches ${partial.length} avatars (${partial.map((a) => a.avatar_name).join(', ')}); pass a more exact name or --look <avatar_id>`)
  return partial[0]
}

export async function generate({ avatar, text, voice, bg, look, out, pollMs = 8000, timeoutMs = 20 * 60_000 }) {
  if (text.length > 5000) throw new Error(`text is ${text.length} chars; HeyGen limit is 5000`)
  const a = look ? { avatar_id: look } : await findAvatar(avatar)
  const voiceId = voice || process.env.HEYGEN_VOICE_ID || a.default_voice_id
  if (!voiceId) throw new Error('no voice: avatar has no default_voice_id. Set HEYGEN_VOICE_ID in .env (list voices in the HeyGen dashboard).')
  const data = await api('/v2/video/generate', {
    method: 'POST',
    body: JSON.stringify({
      video_inputs: [{
        character: { type: 'avatar', avatar_id: a.avatar_id, avatar_style: 'normal' },
        voice: { type: 'text', input_text: text, voice_id: voiceId },
        ...(bg ? { background: { type: 'color', value: bg } } : {}),
      }],
      dimension: { width: 1080, height: 1920 },
    }),
  })
  const id = data.video_id
  console.error(`HeyGen video ${id} queued; polling...`)
  const t0 = Date.now()
  for (;;) {
    const s = await api(`/v1/video_status.get?video_id=${encodeURIComponent(id)}`)
    if (s.status === 'completed') {
      const r = await fetch(s.video_url)
      if (!r.ok) throw new Error(`download failed: ${r.status}`)
      writeFileSync(out, Buffer.from(await r.arrayBuffer()))
      return { id, out }
    }
    if (s.status === 'failed') throw new Error(`HeyGen failed: ${JSON.stringify(s.error ?? {}).slice(0, 300)}`)
    if (Date.now() - t0 > timeoutMs) throw new Error(`timed out; video id ${id} may still finish in the dashboard`)
    await new Promise((r) => setTimeout(r, pollMs))
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [cmd, ...rest] = process.argv.slice(2)
  const o = {}
  for (let i = 0; i < rest.length; i += 2) o[rest[i].replace(/^--/, '')] = rest[i + 1]
  try {
    if (cmd === 'avatars') {
      const { avatars = [] } = await api('/v2/avatars')
      for (const a of avatars) console.log(`${a.avatar_name}\t${a.avatar_id}\t${a.default_voice_id ? 'voice' : 'no-voice'}`)
    } else if (cmd === 'generate') {
      const avatar = o.avatar || process.env.HEYGEN_AVATAR_NAME
      if (!(avatar || o.look) || !o['text-file'] || !o.out) throw new Error('need --avatar (or HEYGEN_AVATAR_NAME), --text-file, --out')
      const r = await generate({ avatar, text: readFileSync(o['text-file'], 'utf8').trim(), voice: o.voice, bg: o.bg, look: o.look, out: o.out })
      console.log(`saved ${r.out} (video ${r.id})`)
    } else throw new Error('usage: heygen.mjs avatars | generate --avatar NAME --text-file F --out F')
  } catch (e) {
    console.error(redact(e.message))
    process.exit(1)
  }
}
