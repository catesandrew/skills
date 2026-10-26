import { AbsoluteFill, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import type { Cue, ReelProps, Template, Word } from './types'

const CAPTION_GROUP = 3

const Captions = ({ words, cues, t }: { words: Word[]; cues: Cue[]; t: ReelProps['template'] }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const now = frame / fps
  const gi = words.findIndex((w, i) => i % CAPTION_GROUP === 0 && now < (words[Math.min(i + CAPTION_GROUP, words.length) - 1]?.end ?? 0) + 0.15)
  if (gi < 0) return null
  const group = words.slice(gi, gi + CAPTION_GROUP)
  const emph = cues.filter((c) => c.type === 'emphasis')
  return (
    <AbsoluteFill style={{ top: `${t.captionY}%`, height: 'auto', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 20, padding: '0 60px' }}>
      {group.map((w, i) => {
        const active = now >= w.start && now < w.end + 0.05
        const shown = now >= w.start - 0.02
        const pop = spring({ frame: frame - Math.round(w.start * fps), fps, config: { damping: 12, stiffness: 220 } })
        const em = emph.some((c) => w.start >= c.t - 0.01 && w.start < c.t + c.dur)
        return (
          <span key={gi + i} style={{
            fontFamily: t.font, fontSize: t.captionSize * (em ? 1.15 : 1), fontWeight: t.captionWeight,
            textTransform: t.uppercase ? 'uppercase' : 'none', opacity: shown ? 1 : 0.25,
            color: active || em ? t.accent : t.fg, transform: `scale(${active ? 0.9 + 0.15 * pop : 1})`,
            textShadow: '0 4px 24px rgba(0,0,0,.55)', lineHeight: 1.1,
          }}>{w.word}</span>
        )
      })}
    </AbsoluteFill>
  )
}

const Card = ({ cue, t }: { cue: Cue; t: Template }) => {
  const frame = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()
  const inS = spring({ frame, fps, config: { damping: 14 } })
  const out = interpolate(frame, [durationInFrames - 6, durationInFrames], [1, 0], { extrapolateLeft: 'clamp' })
  const [a = '', b = ''] = cue.args
  const common = { fontFamily: t.font, color: t.fg, opacity: out, transform: `scale(${0.8 + 0.2 * inS})` }
  if (cue.type === 'lower')
    return (
      <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'flex-start', padding: '0 70px 520px' }}>
        <div style={{ ...common, background: t.cardBg, borderLeft: `10px solid ${t.accent}`, padding: '24px 36px', borderRadius: 16 }}>
          <div style={{ fontSize: 56, fontWeight: 800 }}>{a}</div>
          {b && <div style={{ fontSize: 38, color: t.muted }}>{b}</div>}
        </div>
      </AbsoluteFill>
    )
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', paddingTop: 260 }}>
      <div style={{ ...common, background: t.cardBg, border: `3px solid ${t.accent}`, borderRadius: 32, padding: '36px 56px', textAlign: 'center', maxWidth: 900 }}>
        <div style={{ fontSize: cue.type === 'stat' ? 150 : 84, fontWeight: 900, color: cue.type === 'stat' ? t.accent : t.fg, lineHeight: 1.05 }}>{a}</div>
        {b && <div style={{ fontSize: 42, color: t.muted, marginTop: 12 }}>{b}</div>}
      </div>
    </AbsoluteFill>
  )
}

export const Reel = ({ video, fps, words, cues, template: t, framing: f }: ReelProps) => {
  const frame = useCurrentFrame()
  const now = frame / fps
  // zoom cues punch in with a ramp; framing is the base transform
  const z = cues.filter((c) => c.type === 'zoom').reduce((acc, c) => {
    const p = interpolate(now, [c.t, c.t + 0.15, c.t + c.dur - 0.15, c.t + c.dur], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    return Math.max(acc, p)
  }, 0)
  const scale = f.scale * (1 + 0.12 * z)
  return (
    <AbsoluteFill style={{ background: t.bg }}>
      <AbsoluteFill style={{ transform: `translate(${f.x}%, ${f.y}%) scale(${scale})`, transformOrigin: `50% ${f.originY}%` }}>
        <OffthreadVideo src={staticFile(video)} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </AbsoluteFill>
      {cues.filter((c) => ['title', 'stat', 'lower'].includes(c.type)).map((c, i) => (
        <Sequence key={i} from={Math.round(c.t * fps)} durationInFrames={Math.max(1, Math.round(c.dur * fps))}>
          <Card cue={c} t={t} />
        </Sequence>
      ))}
      <Captions words={words} cues={cues} t={t} />
    </AbsoluteFill>
  )
}
