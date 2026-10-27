// Pure logic for the section-snap + tilt demo. No DOM, no Lenis: unit-testable in Node.
// Self-check: node --test scripts/snap-logic.test.mjs

export const GLIDE_SECONDS = 0.5 // fitted to measured samples, see references/easing-and-timing.md

// ---- easing -------------------------------------------------------------

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

export const easeInOutCubic = (t) => {
  const x = clamp(t, 0, 1)
  return x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2
}

// CSS cubic-bezier(x1, y1, x2, y2) as a function of x in [0,1] (bisection on x(t)).
export function cubicBezier(x1, y1, x2, y2) {
  const bez = (a, b, t) => 3 * a * (1 - t) ** 2 * t + 3 * b * (1 - t) * t ** 2 + t ** 3
  return (x) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    let lo = 0
    let hi = 1
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2
      if (bez(x1, x2, mid) < x) lo = mid
      else hi = mid
    }
    return bez(y1, y2, (lo + hi) / 2)
  }
}

// ---- section targeting --------------------------------------------------

// sections: [{ top, height }] in document px, sorted by top. max: largest scrollY.
// Returns the scrollY to glide to for one step in `dir` (+1 / -1). Sections taller
// than the viewport are walked one viewport at a time, then the next section snaps.
export function computeTarget({ scrollY, dir, sections, vh, max }) {
  const EPS = 2
  let i = 0
  for (let k = 0; k < sections.length; k++) if (sections[k].top <= scrollY + EPS) i = k
  const cur = sections[i]
  const bottom = cur.top + cur.height
  let y
  if (dir > 0) {
    if (bottom - (scrollY + vh) > EPS) y = Math.min(scrollY + vh, bottom - vh)
    else y = i + 1 < sections.length ? sections[i + 1].top : scrollY
  } else if (scrollY - cur.top > EPS) {
    y = Math.max(cur.top, scrollY - vh)
  } else if (i > 0) {
    const p = sections[i - 1]
    y = Math.max(p.top, p.top + p.height - vh) // land on the bottom of a tall section
  } else {
    y = scrollY
  }
  return clamp(y, 0, max)
}

// Index of the section whose top is nearest to scrollY (for hash, resize, focus).
export function nearestIndex(scrollY, sections) {
  let best = 0
  for (let k = 1; k < sections.length; k++) {
    if (Math.abs(sections[k].top - scrollY) < Math.abs(sections[best].top - scrollY)) best = k
  }
  return best
}

export const clampIndex = (i, n) => clamp(i, 0, Math.max(0, n - 1))

// ---- input normalisation ------------------------------------------------

// WheelEvent.deltaMode: 0 pixels, 1 lines, 2 pages.
export function normalizeDelta(delta, deltaMode, vh) {
  return deltaMode === 1 ? delta * 16 : deltaMode === 2 ? delta * vh : delta
}

// Returns { dir } for a step, { to: 'first' | 'last' } for Home/End, or null to leave the key alone.
export function keyToStep(key, shiftKey = false) {
  switch (key) {
    case 'PageDown':
    case 'ArrowDown':
      return { dir: 1 }
    case 'PageUp':
    case 'ArrowUp':
      return { dir: -1 }
    case ' ':
    case 'Spacebar':
      return { dir: shiftKey ? -1 : 1 }
    case 'Home':
      return { to: 'first' }
    case 'End':
      return { to: 'last' }
    default:
      return null
  }
}

// dy = startY - endY (positive = finger moved up = scroll down). dt in ms.
export function swipeToStep(dy, dt, { minDist = 40, minVelocity = 0.3 } = {}) {
  const abs = Math.abs(dy)
  if (abs < 12) return 0 // a tap or jitter
  return abs >= minDist || abs / Math.max(dt, 1) >= minVelocity ? Math.sign(dy) : 0
}

// ---- wheel gesture debounce --------------------------------------------

// One physical flick = one step. Feed every wheel event; get back +1 / -1 when an event
// starts a new gesture, else 0. Trackpad momentum is a decaying tail of events ~16 ms apart,
// so a new gesture is: (a) the first event after a quiet gap, (b) a direction reversal,
// or (c) a delta that rises sharply after the previous burst has already started decaying.
export function createGestureFilter({
  quietMs = 120,
  minDelta = 4,
  riseRatio = 1.6,
  riseMin = 30,
  reverseMin = 20,
} = {}) {
  let lastT = -Infinity
  let lastAbs = 0
  let lastSign = 0
  let armed = false // a step already fired in this burst
  let decaying = false // peak of the burst has passed

  return {
    accept({ deltaY, t }) {
      const abs = Math.abs(deltaY)
      const sign = Math.sign(deltaY)
      const gap = t - lastT
      lastT = t
      if (gap > quietMs) {
        armed = false
        decaying = false
        lastAbs = 0
        lastSign = 0
      }
      if (abs < minDelta) return 0 // momentum tail / noise still counts as activity
      let fire = false
      if (!armed) fire = true
      else if (sign !== lastSign && abs >= reverseMin) fire = true
      else if (decaying && abs >= riseMin && abs > lastAbs * riseRatio) fire = true
      if (abs < lastAbs) decaying = true
      lastAbs = abs
      if (fire) {
        armed = true
        decaying = false
        lastSign = sign
        return sign
      }
      return 0
    },
    reset() {
      lastT = -Infinity
      lastAbs = 0
      lastSign = 0
      armed = false
      decaying = false
    },
  }
}

// ---- tilt mapping -------------------------------------------------------

// Section-local progress: -1 (one viewport below... card is still ahead), 0 (card is on
// screen), +1 (card has scrolled past). index is the card's section index.
export const localProgress = (scrollY, index, vh) => clamp(scrollY / vh - index, -1, 1)

// Map local progress to rotation. rest = angles at local 0; range = degrees added at |local| = 1;
// ease shapes the response (default linear); stagger shifts a card's phase (per-card offset).
export function tiltAngles(local, { rest = { x: 4, y: 17.6, z: 1 }, range = { x: 0, y: -35, z: 0 }, ease = (t) => t, stagger = 0 } = {}) {
  const l = clamp(local + stagger, -1, 1)
  const e = Math.sign(l) * ease(Math.abs(l))
  return { x: rest.x + e * range.x, y: rest.y + e * range.y, z: rest.z + e * range.z }
}

export const tiltCss = ({ x, y, z }) => `rotateX(${x.toFixed(3)}deg) rotateY(${y.toFixed(3)}deg) rotateZ(${z.toFixed(3)}deg)`

// ---- matrix3d decomposition (for measuring a reference page) -----------

// CSS matrix3d(...) is column-major. Assumes transform = [translate] rotateX(a) rotateY(b) rotateZ(c) [scale].
// Returns degrees, translation, and per-axis scale. Gimbal case (cos b ~ 0) returns c = 0.
export function decomposeMatrix3d(m) {
  const sx = Math.hypot(m[0], m[1], m[2])
  const sy = Math.hypot(m[4], m[5], m[6])
  const sz = Math.hypot(m[8], m[9], m[10])
  const R = (r, c) => m[c * 4 + r] / [sx, sy, sz][c]
  const b = Math.asin(clamp(R(0, 2), -1, 1))
  const gimbal = Math.abs(R(0, 2)) > 0.99999
  const a = gimbal ? Math.atan2(R(2, 1), R(1, 1)) : Math.atan2(-R(1, 2), R(2, 2))
  const c = gimbal ? 0 : Math.atan2(-R(0, 1), R(0, 0))
  const deg = (r) => (r * 180) / Math.PI
  return { rotateX: deg(a), rotateY: deg(b), rotateZ: deg(c), translate: [m[12], m[13], m[14]], scale: [sx, sy, sz] }
}

// Inverse of the above, for tests: returns the 16-number column-major matrix of rotateX(a) rotateY(b) rotateZ(c).
export function rotationMatrix3d(aDeg, bDeg, cDeg) {
  const [a, b, c] = [aDeg, bDeg, cDeg].map((d) => (d * Math.PI) / 180)
  const [ca, sa, cb, sb, cc, sc] = [Math.cos(a), Math.sin(a), Math.cos(b), Math.sin(b), Math.cos(c), Math.sin(c)]
  const R = [
    [cb * cc, -cb * sc, sb],
    [sa * sb * cc + ca * sc, -sa * sb * sc + ca * cc, -sa * cb],
    [-ca * sb * cc + sa * sc, ca * sb * sc + sa * cc, ca * cb],
  ]
  const m = []
  for (let col = 0; col < 3; col++) m.push(R[0][col], R[1][col], R[2][col], 0)
  m.push(0, 0, 0, 1)
  return m
}
