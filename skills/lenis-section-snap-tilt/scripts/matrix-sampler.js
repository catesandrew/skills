// Paste into the DevTools console. Reports the 3D transform of every element that has one, decomposed to
// rotateX/rotateY/rotateZ degrees, plus the perspective of its nearest perspective ancestor.
// Usage: matrixSample('label') at several scroll positions, then matrixTable() to compare.
// Assumes transform = [translate] rotateX rotateY rotateZ [scale]; skew/arbitrary matrices decompose approximately.
const decompose = (m) => {
  const sx = Math.hypot(m[0], m[1], m[2]), sy = Math.hypot(m[4], m[5], m[6]), sz = Math.hypot(m[8], m[9], m[10])
  const R = (r, c) => m[c * 4 + r] / [sx, sy, sz][c]
  const g = Math.abs(R(0, 2)) > 0.99999
  const deg = (r) => (r * 180) / Math.PI
  return {
    rotateX: deg(g ? Math.atan2(R(2, 1), R(1, 1)) : Math.atan2(-R(1, 2), R(2, 2))),
    rotateY: deg(Math.asin(Math.max(-1, Math.min(1, R(0, 2))))),
    rotateZ: g ? 0 : deg(Math.atan2(-R(0, 1), R(0, 0))),
    tx: m[12], ty: m[13], tz: m[14], scale: sx,
  }
}
const toArray = (t) => {
  if (!t || t === 'none') return null
  const nums = t.slice(t.indexOf('(') + 1, -1).split(',').map(Number)
  if (t.startsWith('matrix3d')) return nums
  const [a, b, c, d, e, f] = nums // 2D matrix(a,b,c,d,e,f) -> 3D column-major
  return [a, b, 0, 0, c, d, 0, 0, 0, 0, 1, 0, e, f, 0, 1]
}
const cssPath = (el) => {
  const bits = []
  for (let n = el; n && n.nodeType === 1 && bits.length < 3; n = n.parentElement) {
    bits.unshift(n.tagName.toLowerCase() + (n.id ? '#' + n.id : '') + (n.classList[0] ? '.' + n.classList[0] : ''))
  }
  return bits.join(' > ')
}
const rows = []
const matrixSample = (label = String(Math.round(scrollY)), selector = '*') => {
  document.querySelectorAll(selector).forEach((el, i) => {
    const cs = getComputedStyle(el)
    const m = toArray(cs.transform)
    if (!m) return
    const d = decompose(m)
    if (Math.abs(d.rotateX) + Math.abs(d.rotateY) + Math.abs(d.rotateZ) < 0.01 && !cs.transform.startsWith('matrix3d')) return
    let persp = ''
    for (let p = el.parentElement; p; p = p.parentElement) { const v = getComputedStyle(p).perspective; if (v !== 'none') { persp = v; break } }
    rows.push({ label, scrollY: Math.round(scrollY), el: cssPath(el), idx: i, perspective: persp, style3d: cs.transformStyle, will: cs.willChange,
      rx: +d.rotateX.toFixed(2), ry: +d.rotateY.toFixed(2), rz: +d.rotateZ.toFixed(2), tx: +d.tx.toFixed(1), ty: +d.ty.toFixed(1), tz: +d.tz.toFixed(1) })
  })
  return rows.length
}
const matrixTable = () => console.table(rows)
if (typeof document !== 'undefined') {
  // To sweep, scroll with the page's own input between calls: matrixSample('s1'); ...scroll...; matrixSample('s2'); matrixTable()
  window.matrixSample = matrixSample
  window.matrixTable = matrixTable
  matrixSample('now')
  matrixTable()
}
if (typeof module !== 'undefined') module.exports = { decompose, toArray }
