// Fit a glide's easing + duration to captured samples.
// Usage: node scripts/fit-easing.mjs '[[92,30],[206,358],[414,1215]]' 1238
//   argv[2] = JSON [[msSinceWheel, scrollDelta], ...], argv[3] = total distance in px.
// Grid-searches duration D (and optional start offset t0) for each candidate curve; prints RMS error in px.
import { pathToFileURL } from 'node:url'
import { easeInOutCubic, cubicBezier } from '../template/snap-logic.js'

export const CURVES = {
  easeInOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2),
  easeInOutCubic,
  easeInOutQuart: (t) => (t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2),
  easeInOutQuint: (t) => (t < 0.5 ? 16 * t ** 5 : 1 - (-2 * t + 2) ** 5 / 2),
  'bezier(.65,0,.35,1)': cubicBezier(0.65, 0, 0.35, 1),
  'bezier(.76,0,.24,1)': cubicBezier(0.76, 0, 0.24, 1),
  'lenis default (ease-out expo)': (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
}

export function fit(samples, distance, { dMin = 250, dMax = 900, step = 5, withOffset = false } = {}) {
  return Object.entries(CURVES).map(([name, f]) => {
    let best = { sse: Infinity }
    for (let D = dMin; D <= dMax; D += step) {
      for (let t0 = 0; t0 <= (withOffset ? 80 : 0); t0 += 2) {
        let sse = 0
        for (const [t, y] of samples) sse += (f(Math.min(1, Math.max(0, (t - t0) / D))) * distance - y) ** 2
        if (sse < best.sse) best = { sse, D, t0 }
      }
    }
    return { curve: name, durationMs: best.D, startOffsetMs: best.t0, rmsPx: +Math.sqrt(best.sse / samples.length).toFixed(1) }
  }).sort((a, b) => a.rmsPx - b.rmsPx)
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const samples = JSON.parse(process.argv[2] ?? '[[92,30],[206,358],[414,1215]]')
  const distance = Number(process.argv[3] ?? 1238)
  console.table(fit(samples, distance))
}
