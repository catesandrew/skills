import { Composition } from 'remotion'
import { Reel } from './Reel'
import type { ReelProps } from './types'

const defaults: ReelProps = {
  video: 'avatar.mp4', duration: 5, fps: 30, words: [], cues: [],
  template: { bg: '#0b0b10', fg: '#fff', accent: '#7c5cff', muted: '#9a9aae', cardBg: '#16161f', font: 'Helvetica Neue, Arial, sans-serif', captionSize: 84, captionY: 72, captionWeight: 800, uppercase: true },
  framing: { scale: 1, x: 0, y: 0, originY: 30 },
}

export const Root = () => (
  <Composition
    id="Reel" component={Reel} width={1080} height={1920} fps={30}
    durationInFrames={150} defaultProps={defaults}
    calculateMetadata={({ props }) => ({ durationInFrames: Math.max(1, Math.ceil(props.duration * props.fps)), fps: props.fps })}
  />
)
