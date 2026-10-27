// Canvas image-sequence scrub: scroll progress picks which pre-extracted frame is painted.
// Each .chapter declares its frames in HTML (data-frames, data-count, optional data-reverse).
// All frames preload behind #loading before scroll unlocks.

// ---- pure helpers (unit-tested: node --test scripts/scrub.test.mjs) ----
function frameUrl(template, n, pad) { return template.replace('{n}', String(n).padStart(pad, '0')) }

function frameIndex(p, count, reverse) {
  const i = Math.min(count - 1, Math.max(0, Math.round(p * (count - 1))))
  return reverse ? count - 1 - i : i
}

function coverRect(iw, ih, cw, ch) {
  const s = Math.max(cw / iw, ch / ih)
  const w = iw * s, h = ih * s
  return { x: (cw - w) / 2, y: (ch - h) / 2, w, h }
}

if (typeof module !== 'undefined') module.exports = { frameUrl, frameIndex, coverRect }

// ---- browser engine ----
if (typeof document !== 'undefined') (() => {
  const DAMPING_RATE = 10 // higher = snappier
  const MAX_DPR = 2

  const html = document.documentElement
  const loading = document.getElementById('loading')
  const bar = document.getElementById('loading-bar')
  const chapters = [...document.querySelectorAll('.chapter')].map((el) => ({
    el,
    canvas: el.querySelector('canvas'),
    bands: [...el.querySelectorAll('.band')],
    template: el.dataset.frames,
    count: +el.dataset.count,
    pad: +(el.dataset.pad || 4),
    reverse: el.dataset.reverse === 'true',
    frames: [],
    cur: 0,
    drawn: -1,
  }))

  // Reduced motion gets the designed poster; narrow screens get the looped MP4. Neither preloads frames.
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  const narrow = matchMedia('(max-width: 767px)').matches
  if (reduced || narrow) {
    html.classList.add(reduced ? 'still' : 'video')
    loading.classList.add('done')
    return
  }

  function preload() {
    const total = chapters.reduce((n, c) => n + c.count, 0)
    let done = 0
    const jobs = chapters.flatMap((c) => Array.from({ length: c.count }, (_, i) => new Promise((res) => {
      const img = new Image()
      // A missing frame must not hang the loader; draw() skips frames that failed to load.
      img.onload = img.onerror = () => { bar.style.transform = `scaleX(${++done / total})`; res() }
      img.src = frameUrl(c.template, i + 1, c.pad)
      c.frames[i] = img
    })))
    return Promise.all(jobs)
  }

  function size(c) {
    const dpr = Math.min(devicePixelRatio || 1, MAX_DPR)
    c.canvas.width = Math.round(innerWidth * dpr)
    c.canvas.height = Math.round(innerHeight * dpr)
    c.drawn = -1 // force a repaint after a resize
  }

  function progress(el) {
    const r = el.getBoundingClientRect()
    const span = r.height - innerHeight
    return span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0
  }

  function draw(c, idx) {
    const img = c.frames[idx]
    if (!img || !img.naturalWidth) return
    const r = coverRect(img.naturalWidth, img.naturalHeight, c.canvas.width, c.canvas.height)
    c.canvas.getContext('2d').drawImage(img, r.x, r.y, r.w, r.h)
    c.drawn = idx
    c.canvas.dataset.frame = idx // read by verification scripts to assert which frame is on screen
  }

  let last = performance.now()
  function loop(now) {
    const dt = (now - last) / 1000
    last = now
    for (const c of chapters) {
      const rect = c.el.getBoundingClientRect()
      if (rect.bottom < 0 || rect.top > innerHeight) continue // only work on chapters on screen
      const p = progress(c.el)
      c.cur += (p - c.cur) * (1 - Math.exp(-dt * DAMPING_RATE))
      const idx = frameIndex(c.cur, c.count, c.reverse)
      if (idx !== c.drawn) draw(c, idx) // repaint only when the frame changes
      for (const b of c.bands) b.classList.toggle('on', p >= +b.dataset.from && p <= +b.dataset.to)
    }
    requestAnimationFrame(loop)
  }

  chapters.forEach(size)
  addEventListener('resize', () => chapters.forEach(size))
  preload().then(() => {
    chapters.forEach((c) => draw(c, frameIndex(0, c.count, c.reverse)))
    loading.classList.add('done')
    last = performance.now()
    requestAnimationFrame(loop)
  })
})()
