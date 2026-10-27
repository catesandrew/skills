// Pure maths for a scroll-driven palette: background ramp, text colour flip,
// and a scrim solved against the WORST possible footage pixel. No DOM, so it
// runs in the browser and in `node --test`.

export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x))
export const ease = (x) => 1 - (1 - clamp(x)) ** 3
export const parse = (h) => h.replace('#', '').match(/\w\w/g).map((v) => parseInt(v, 16))
export const mix = (a, b, p) => a.map((v, i) => v + (b[i] - v) * p)
export const css = (c) => `rgb(${c.map(Math.round).join(',')})`
export const lum = (c) =>
  c
    .map((v) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0)
export const contrast = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05)

// cfg = story.json: { palette, knots?, text:{light,dark,crossAct,crossSpan?}, acts:[...], minContrast? }
export function createTheme(cfg) {
  const stops = cfg.palette.map(parse)
  const n = stops.length
  const knots = cfg.knots ?? stops.map((_, i) => i / (n - 1))
  const L = parse(cfg.text.light)
  const D = parse(cfg.text.dark)
  const acts = cfg.acts.length
  const { crossAct, crossSpan = 0.75 } = cfg.text
  const min = cfg.minContrast ?? 4.6

  // Continuous, never stepped: piecewise-linear between stops at `knots`.
  const bg = (p) => {
    p = clamp(p)
    let i = 0
    while (i < n - 2 && p > knots[i + 1]) i++
    return mix(stops[i], stops[i + 1], clamp((p - knots[i]) / (knots[i + 1] - knots[i])))
  }
  // Text flips light -> dark over `crossSpan` acts starting at act index `crossAct`.
  const fg = (p) => mix(L, D, ease((clamp(p) * acts - crossAct) / crossSpan))

  // Overlay (black or white) laid over the footage, strong enough that `fg`
  // clears `min` even against the worst footage pixel (white under a black
  // scrim, black under a white one). ok=false means no scrim can fix it:
  // move the crossover so the text is not mid-grey while it is on screen.
  const scrim = (f) => {
    const black = [0, 0, 0]
    const white = [255, 255, 255]
    const dark = contrast(f, black) >= contrast(f, white)
    const base = dark ? black : white
    const worst = dark ? white : black
    let alpha = 0
    while (alpha < 1 && contrast(f, mix(worst, base, alpha)) < min) alpha += 0.005
    alpha = Math.min(1, alpha + 0.015)
    return { base, alpha, ok: contrast(f, mix(worst, base, alpha)) >= min - 0.05 }
  }
  return { bg, fg, scrim, min }
}
