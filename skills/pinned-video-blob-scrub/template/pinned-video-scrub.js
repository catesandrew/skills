// Pinned video scrub: Blob preload + lerped rAF seek loop + stills fallback.
// GSAP and ScrollTrigger are expected as globals (CDN) or passed in `deps`.
// States (wrap.dataset.state): loading -> ready | fallback | static | destroyed.
import {
  bufferedFraction, chooseSource, lerpStep, parseConfig, planSeek, progressToTime, readyDecision,
} from './scrub-logic.js'

const $ = (root, sel) => root.querySelector(sel)

export function initPinnedVideoScrub(wrap, deps = {}) {
  const gsap = deps.gsap || window.gsap
  const ScrollTrigger = deps.ScrollTrigger || window.ScrollTrigger
  gsap.registerPlugin(ScrollTrigger)

  const cfg = parseConfig(wrap.dataset)
  const video = $(wrap, '[data-video]')
  const stage = $(wrap, '[data-pin]')
  const media = $(wrap, '[data-media]')
  const still1 = $(wrap, '[data-still="1"]')
  const still2 = $(wrap, '[data-still="2"]')
  const loader = $(wrap, '[data-loader]')

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  const isMobile = matchMedia('(max-width: 767px)').matches
  const choice = chooseSource({
    desktop: cfg.desktopSrc, mobile: cfg.mobileSrc, isMobile, reducedMotion,
    canPlay: (type) => !!type && video.canPlayType(type) !== '',
  })

  const mm = gsap.matchMedia()
  let abort = new AbortController()
  let blobUrl = ''
  let trigger = null
  let fallbackTween = null
  let readyTimer = 0
  let raf = 0
  let errored = false
  let ready = false
  let dirty = false // a newer seek target arrived while a seek was in flight
  let duration = NaN
  let target = 0
  let current = 0
  let destroyed = false
  const t0 = performance.now()
  const cleanups = []
  const on = (el, ev, fn, opts) => { el.addEventListener(ev, fn, opts); cleanups.push(() => el.removeEventListener(ev, fn, opts)) }

  function setState(state, reason = '') {
    wrap.dataset.state = state
    if (reason) wrap.dataset.reason = reason
    wrap.dispatchEvent(new CustomEvent('pvbs:state', { detail: { state, reason } }))
  }

  function setProgress(fraction) { // fraction 0..1, or null = indeterminate
    if (!loader) return
    loader.classList.toggle('indeterminate', fraction === null)
    if (fraction !== null) {
      loader.style.setProperty('--p', fraction.toFixed(3))
      loader.setAttribute('aria-valuenow', String(Math.round(fraction * 100)))
    }
  }

  // ---- layout: pin + flip, responsive via gsap.matchMedia -----------------
  function buildPin() {
    mm.add({ desktop: '(min-width: 768px)', mobile: '(max-width: 767px)' }, (ctx) => {
      const pin = { trigger: wrap, start: cfg.start, end: cfg.end, pin: stage, pinSpacing: false,
        invalidateOnRefresh: true, refreshPriority: 1 }
      if (ctx.conditions.desktop) {
        gsap.timeline({ scrollTrigger: { ...pin, scrub: 0.8 } })
          .fromTo(media, { scale: 1, borderRadius: 0 }, { scale: 0.62, borderRadius: 28, ease: 'none' })
      } else {
        ScrollTrigger.create(pin) // phones: pin only, no scale
      }
    })
  }

  // ---- stills fallback / reduced motion -----------------------------------
  function showStills(mode, reason) {
    ready = false
    stopLoop()
    clearTimeout(readyTimer)
    abort.abort()
    if (trigger) { trigger.kill(); trigger = null }
    if (blobUrl) { URL.revokeObjectURL(blobUrl); blobUrl = '' }
    video.removeAttribute('src')
    video.load()
    video.hidden = true
    if (loader) loader.hidden = true
    if (mode === 'fallback' && still2 && !fallbackTween) {
      // crossfade first -> second still with the same scroll range
      fallbackTween = gsap.fromTo(still2, { opacity: 0 }, { opacity: 1, ease: 'none',
        scrollTrigger: { trigger: wrap, start: cfg.start, end: cfg.end, scrub: true } })
    }
    setState(mode, reason)
  }

  // ---- seek loop -----------------------------------------------------------
  function applySeek(t) {
    const plan = planSeek({ playhead: t, currentTime: video.currentTime, seeking: video.seeking })
    if (plan === 'seek') video.currentTime = t
    else if (plan === 'queue') dirty = true
  }
  function tick() {
    current = lerpStep(current, target, cfg.smoothing)
    applySeek(current)
    raf = requestAnimationFrame(tick)
  }
  const startLoop = () => { if (ready && !raf && !document.hidden) raf = requestAnimationFrame(tick) }
  function stopLoop() { cancelAnimationFrame(raf); raf = 0 }

  // ---- ready gate -----------------------------------------------------------
  function check(force = false) {
    if (ready || destroyed || wrap.dataset.state !== 'loading') return
    const d = readyDecision({
      errored, readyState: video.readyState, duration: video.duration,
      buffered: bufferedFraction([...Array(video.buffered.length)].map((_, i) => [video.buffered.start(i), video.buffered.end(i)]), video.duration),
      threshold: cfg.readyThreshold, elapsed: force ? Infinity : performance.now() - t0, timeout: cfg.readyTimeout,
    })
    if (d === 'ready') onReady()
    else if (d === 'fallback') showStills('fallback', errored ? 'error' : 'timeout')
  }

  function onReady() {
    ready = true
    clearTimeout(readyTimer)
    duration = video.duration
    video.currentTime = 0
    still1?.classList.add('is-hidden')
    if (loader) loader.hidden = true
    trigger = ScrollTrigger.create({
      trigger: wrap, start: cfg.start, end: cfg.end,
      onUpdate: (self) => { target = progressToTime(self.progress, duration) },
      onToggle: (self) => {
        if (self.isActive) return startLoop()
        stopLoop()
        // the loop is off, so land exactly on the end frame (progress is 0 or 1 here)
        target = current = progressToTime(self.progress, duration)
        applySeek(current)
      },
    })
    target = current = progressToTime(trigger.progress, duration)
    applySeek(current)
    if (trigger.isActive) startLoop() // page loaded or restored mid-range: no toggle will fire
    unlockIOS()
    setState('ready')
    ScrollTrigger.refresh() // only strictly needed if the video's size changes layout
  }

  // iOS: a muted play()->pause() once makes later currentTime writes reliable. Unverified on device.
  function unlockIOS() {
    const unlock = () => video.play().then(() => video.pause()).catch(() => {})
    unlock()
    for (const ev of ['pointerdown', 'touchstart', 'keydown']) on(window, ev, unlock, { once: true, passive: true })
  }

  // ---- loading -----------------------------------------------------------------
  async function fetchBlob(src) {
    const res = await fetch(src, { signal: abort.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    // Content-Length is the encoded size; for MP4 (not gzip'd) it matches the bytes read.
    const total = Number(res.headers.get('content-length')) || 0
    const type = res.headers.get('content-type') || (src.includes('.webm') ? 'video/webm' : 'video/mp4')
    if (!res.body) return res.blob()
    const reader = res.body.getReader()
    const chunks = []
    let got = 0
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      got += value.length
      setProgress(total ? Math.min(1, got / total) : null)
    }
    setProgress(1)
    return new Blob(chunks, { type })
  }

  async function load(src) {
    if (cfg.preload === 'blob') {
      try {
        blobUrl = URL.createObjectURL(await fetchBlob(src))
        if (destroyed || wrap.dataset.state !== 'loading') { URL.revokeObjectURL(blobUrl); blobUrl = ''; return }
        video.src = blobUrl
      } catch (err) {
        if (err.name === 'AbortError') return
        video.src = src // fetch failed (CORS, offline): let the element try; its error event gates
      }
    } else {
      video.src = src
    }
    video.load()
    check()
  }

  // ---- boot ----------------------------------------------------------------------
  if (reducedMotion || choice.mode === 'stills') {
    wrap.classList.add('is-static') // no pin, no scrub, no download
    showStills('static', choice.reason)
  } else {
    setState('loading')
    buildPin()
    if (cfg.normalize) { // opt-in: replaces native scrolling, see references/pin-and-flip.md
      ScrollTrigger.normalizeScroll(true)
      cleanups.push(() => ScrollTrigger.normalizeScroll(false))
    }
    setProgress(0)
    for (const ev of ['loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough', 'progress']) on(video, ev, () => check())
    on(video, 'error', () => { errored = true; check() })
    on(video, 'seeked', () => { if (dirty) { dirty = false; applySeek(current) } })
    on(document, 'visibilitychange', () => (document.hidden ? stopLoop() : trigger?.isActive && startLoop()))
    readyTimer = setTimeout(() => check(true), cfg.readyTimeout)
    load(choice.src)
  }

  return {
    get state() { return wrap.dataset.state },
    destroy() {
      destroyed = true
      stopLoop()
      clearTimeout(readyTimer)
      abort.abort()
      cleanups.forEach((fn) => fn())
      trigger?.kill()
      fallbackTween?.scrollTrigger?.kill()
      fallbackTween?.kill()
      mm.revert()
      if (blobUrl) URL.revokeObjectURL(blobUrl)
      video.removeAttribute('src')
      video.load()
      setState('destroyed')
    },
  }
}

document.querySelectorAll('[data-video-wrap]').forEach((el) => { el.pvbs = initPinnedVideoScrub(el) })
