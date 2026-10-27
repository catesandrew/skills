// Act index for a 0..1 scroll progress, using each clip's real duration.
export function actAt(progress, seconds) {
  const total = seconds.reduce((s, x) => s + x, 0)
  let t = Math.min(1, Math.max(0, progress)) * total
  for (let i = 0; i < seconds.length; i++) {
    if (t < seconds[i]) return i
    t -= seconds[i]
  }
  return seconds.length - 1
}
