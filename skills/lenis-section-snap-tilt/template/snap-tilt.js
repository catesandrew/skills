// Section snap glide + scroll-driven 3D tilt. No build step: loads Lenis from a pinned CDN URL.
// Pure decisions live in snap-logic.js (unit-tested); this file only wires them to the DOM.
import {
  GLIDE_SECONDS, easeInOutCubic, computeTarget, nearestIndex, normalizeDelta,
  keyToStep, swipeToStep, createGestureFilter, localProgress, tiltAngles, tiltCss,
} from './snap-logic.js'

const LENIS_URL = 'https://cdn.jsdelivr.net/npm/lenis@1.3.27/dist/lenis.mjs'
const sections = [...document.querySelectorAll('[data-snap-section]')]
const cards = [...document.querySelectorAll('[data-tilt]')]
const dots = [...document.querySelectorAll('.dots a')]
const reduce = matchMedia('(prefers-reduced-motion: reduce)')
const PREVENT = '[data-lenis-prevent]'

// 1. Reveals work with or without the engine.
const io = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target) }
}, { threshold: 0.35 })
document.querySelectorAll('.reveal').forEach((el) => (reduce.matches ? el.classList.add('is-in') : io.observe(el)))

let engine = null // { lenis, destroy }

async function start() {
  if (engine || reduce.matches) return // reduced motion: native scroll, flat cards
  const { default: Lenis } = await import(LENIS_URL).catch(() => ({}))
  if (!Lenis || engine || reduce.matches) return // CDN failed: the page still works natively

  // Lenis is only the animator here: virtualScroll() returning false makes it ignore wheel and touch.
  const lenis = new Lenis({ autoRaf: true, smoothWheel: false, virtualScroll: () => false })
  const filter = createGestureFilter()
  let geo = [], vh = innerHeight, max = 0, locked = false, unlockTimer = 0
  const ac = new AbortController()
  const on = (t, type, fn, opts) => t.addEventListener(type, fn, { ...opts, signal: ac.signal })

  const measure = () => {
    vh = innerHeight
    const y = scrollY
    geo = sections.map((s) => ({ top: s.getBoundingClientRect().top + y, height: s.offsetHeight }))
    max = Math.max(0, document.documentElement.scrollHeight - vh)
  }
  const unlock = () => { locked = false; clearTimeout(unlockTimer) }

  function glideTo(y, { immediate = false } = {}) {
    y = Math.min(max, Math.max(0, y))
    if (Math.abs(y - scrollY) < 1) return
    if (immediate) { lenis.scrollTo(y, { immediate: true, force: true }); return }
    locked = true
    clearTimeout(unlockTimer)
    unlockTimer = setTimeout(unlock, GLIDE_SECONDS * 1000 + 400) // safety net if onComplete never fires
    lenis.scrollTo(y, { duration: GLIDE_SECONDS, easing: easeInOutCubic, force: true, onComplete: unlock })
  }
  const step = (dir) => !locked && glideTo(computeTarget({ scrollY, dir, sections: geo, vh, max }))
  const toIndex = (i, opts) => glideTo(geo[Math.min(geo.length - 1, Math.max(0, i))].top, opts)

  // Wheel: one gesture = one step. Events during a glide are swallowed, never queued.
  on(window, 'wheel', (e) => {
    if (e.ctrlKey || e.target.closest?.(PREVENT)) return // pinch-zoom and inner scrollers stay native
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return // horizontal swipes (browser back) stay native
    e.preventDefault()
    const dir = filter.accept({ deltaY: normalizeDelta(e.deltaY, e.deltaMode, vh), t: e.timeStamp })
    if (dir) step(dir)
  }, { passive: false })

  // Keyboard.
  on(window, 'keydown', (e) => {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return
    const t = e.target
    if (t.closest?.(PREVENT) || t.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON|A|SUMMARY)$/.test(t.tagName) && (e.key === ' ' || e.key.startsWith('Arrow'))) return
    const k = keyToStep(e.key, e.shiftKey)
    if (!k) return
    e.preventDefault()
    if (k.dir) step(k.dir)
    else if (!locked) toIndex(k.to === 'first' ? 0 : geo.length - 1)
  })

  // Touch swipe. touchmove is cancelled so the browser does not also scroll natively.
  let t0 = null
  on(window, 'touchstart', (e) => {
    t0 = e.touches.length === 1 && !e.target.closest?.(PREVENT) ? { y: e.touches[0].clientY, t: e.timeStamp } : null
  }, { passive: true })
  on(window, 'touchmove', (e) => { if (t0 && e.cancelable) e.preventDefault() }, { passive: false })
  on(window, 'touchend', (e) => {
    if (!t0) return
    const dir = swipeToStep(t0.y - e.changedTouches[0].clientY, e.timeStamp - t0.t)
    t0 = null
    if (dir) step(dir)
  })
  on(window, 'touchcancel', () => { t0 = null })

  // Hash / anchor navigation, focus following, resize.
  const goHash = (immediate) => {
    const i = sections.findIndex((s) => s.id === location.hash.slice(1))
    if (i >= 0) toIndex(i, { immediate })
  }
  on(window, 'hashchange', () => goHash(false))
  on(document, 'click', (e) => {
    const a = e.target.closest?.('a[href^="#"]')
    const i = a ? sections.findIndex((s) => '#' + s.id === a.getAttribute('href')) : -1
    if (i < 0) return
    e.preventDefault()
    history.pushState(null, '', a.getAttribute('href'))
    toIndex(i)
  })
  on(document, 'focusin', (e) => { // Tab into an off-screen section: glide there instead of a native jump
    const i = sections.findIndex((s) => s.contains(e.target))
    if (i >= 0 && !locked && Math.abs(geo[i].top - scrollY) > 1 && geo[i].height <= vh) toIndex(i)
  })
  const ro = new ResizeObserver(() => {
    const idx = nearestIndex(scrollY, geo.length ? geo : [{ top: 0, height: 0 }])
    measure(); lenis.resize()
    if (geo[idx] && geo[idx].height <= vh) glideTo(geo[idx].top, { immediate: true }) // re-align after resize
  })
  ro.observe(document.documentElement)

  // Scroll-driven tilt and nav state.
  const paint = () => {
    cards.forEach((c, i) => { c.style.transform = tiltCss(tiltAngles(localProgress(scrollY, i, vh))) })
    const cur = nearestIndex(scrollY, geo)
    dots.forEach((d, i) => (i === cur ? d.setAttribute('aria-current', 'true') : d.removeAttribute('aria-current')))
  }
  lenis.on('scroll', paint)

  measure(); paint()
  if (location.hash) goHash(true)

  engine = {
    lenis,
    destroy() {
      ac.abort(); ro.disconnect(); unlock(); lenis.destroy()
      cards.forEach((c) => (c.style.transform = ''))
      engine = null
    },
  }
  window.snapDemo = { lenis, get locked() { return locked }, get geo() { return geo } } // debug handle
}

function stop() { engine?.destroy(); delete window.snapDemo }

// Escape hatch + reduced-motion live switching.
const free = document.getElementById('free-scroll')
free.addEventListener('click', () => {
  const on = free.getAttribute('aria-pressed') !== 'true'
  free.setAttribute('aria-pressed', String(on))
  on ? stop() : start()
})
reduce.addEventListener('change', () => (reduce.matches ? stop() : start()))
if (new URLSearchParams(location.search).get('snap') !== 'off') start()
