export type Word = { word: string; start: number; end: number }
export type Cue = { type: string; args: string[]; t: number; dur: number; anchorWords?: string; note?: string }
export type Template = {
  bg: string; fg: string; accent: string; muted: string; cardBg: string
  font: string; captionSize: number; captionY: number // captionY: % from top
  captionWeight: number; uppercase: boolean
}
export type Framing = { scale: number; x: number; y: number; originY: number } // x/y in % of frame
export type ReelProps = {
  video: string // file name inside remotion/public
  duration: number // seconds
  fps: number
  words: Word[]
  cues: Cue[]
  template: Template
  framing: Framing
}
