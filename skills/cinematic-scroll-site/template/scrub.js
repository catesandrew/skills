// Vanilla scrub engine: damped playhead + seek coalescing (same design as scroll-video-site's engine notes).
// Video is fetched as a Blob so seeking never waits on the network.
(() => {
  const SRC = 'assets/hero.mp4'
  const DAMPING_RATE = 10   // higher = snappier
  const SEEK_THRESHOLD = 1 / 60

  const video = document.getElementById('scrub')
  const hero = document.getElementById('hero')
  const loading = document.getElementById('loading')
  const bands = [...document.querySelectorAll('.band')]
  const still = matchMedia('(hover: none), (prefers-reduced-motion: reduce)').matches

  if (still) { loading.classList.add('done'); return } // poster layout, no video

  let target = 0, playhead = 0, seeking = false, pending = null, last = performance.now()

  const progress = () => {
    const r = hero.getBoundingClientRect()
    const span = r.height - innerHeight
    return span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0
  }

  function showBands(p) {
    for (const b of bands) b.classList.toggle('on', p >= +b.dataset.from && p <= +b.dataset.to)
  }

  function tick(now) {
    const dt = (now - last) / 1000
    last = now
    const p = progress()
    target = p * video.duration
    playhead += (target - playhead) * (1 - Math.exp(-dt * DAMPING_RATE))
    if (!seeking && Math.abs(playhead - video.currentTime) > SEEK_THRESHOLD) {
      seeking = true
      video.currentTime = playhead
    } else if (seeking) {
      pending = playhead // newest wins; never queue stale seeks
    }
    showBands(p)
    requestAnimationFrame(tick)
  }

  video.addEventListener('seeked', () => {
    seeking = false
    if (pending !== null) { const t = pending; pending = null; seeking = true; video.currentTime = t }
  })

  fetch(SRC).then((r) => r.blob()).then((blob) => {
    video.src = URL.createObjectURL(blob)
    video.addEventListener('loadedmetadata', () => {
      loading.classList.add('done')
      requestAnimationFrame((t) => { last = t; tick(t) })
    }, { once: true })
    video.load()
  })
})()
