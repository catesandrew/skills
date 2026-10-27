// Palette-scrub story engine. One sticky stage, one <video> per act, scroll
// progress -> act + local progress -> video time, page colour, text colour,
// scrim and beat. Config comes from story.json (see palette.js).
import { createTheme, clamp, css } from './palette.js'

const $ = (s) => document.querySelector(s)
const $$ = (s) => [...document.querySelectorAll(s)]

export async function init(url = 'story.json') {
  const cfg = await (await fetch(url)).json()
  const theme = createTheme(cfg)
  const story = $('#story')
  const stage = $('.stage')
  const shade = $('.film-shade')
  const header = $('.header')
  const videos = $$('.film')
  const beats = $$('.beat')
  const N = cfg.acts.length
  const mobile = matchMedia('(max-width: 700px), (pointer: coarse)')
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  let distance = 1
  let active = -1
  let visible = -1
  let mobileAct = 0
  let smooth = 0
  let last = performance.now()
  let pending = 0

  const request = () => { if (!pending) pending = requestAnimationFrame(render) }

  function setActive(i) {
    if (i === active) return
    videos.forEach((v, k) => {
      v.classList.toggle('active', k === i)
      v.classList.toggle('outgoing', k === active)
      if (k !== i) v.pause()
    })
    active = i
    smooth = videos[i].currentTime
    if (mobile.matches && !reduced.matches) videos[i].play().catch(() => {})
  }

  function showBeat(i) {
    if (i === visible) return
    beats.forEach((b, k) => {
      b.classList.toggle('visible', k === i)
      b.setAttribute('aria-hidden', String(k !== i))
      const btn = b.querySelector('button')
      if (btn) btn.tabIndex = k === i ? 0 : -1
    })
    visible = i
  }

  function render(now) {
    pending = 0
    const dt = Math.max(1, now - last)
    last = now
    const total = clamp(scrollY / distance)
    const act = Math.min(N - 1, Math.floor(total * N))
    const local = clamp(total * N - act)

    const bg = css(theme.bg(total))
    const fgc = theme.fg(total)
    story.style.setProperty('--story-bg', bg)
    story.style.setProperty('--story-fg', css(fgc))
    document.documentElement.style.backgroundColor = bg
    $('meta[name="theme-color"]').content = bg
    setActive(act)

    const [start, end] = cfg.acts[act].beat
    const beatOn = local >= start && (local <= end || act === N - 1)
    // Mobile: an IntersectionObserver marker must agree before text appears.
    showBeat((mobile.matches ? mobileAct === act && beatOn : beatOn) ? act : -1)

    // Scrim is solved against the worst footage pixel; near-transparent when no text is up.
    const s = theme.scrim(fgc)
    shade.style.backgroundColor = `rgba(${s.base.join(',')},${s.alpha.toFixed(3)})`
    shade.style.opacity = beatOn ? '1' : '.16'

    if (!mobile.matches && !reduced.matches) {
      const v = videos[act]
      if (v.readyState >= 1 && Number.isFinite(v.duration)) {
        const target = local * (v.duration - 0.04)
        smooth += (target - smooth) * (1 - Math.exp(-Math.min(dt, 50) / 90))
        if (!v.seeking && Math.abs(v.currentTime - smooth) > 0.018) v.currentTime = smooth
        if (Math.abs(target - smooth) > 0.018) request()
      }
    }

    $('.progress-fill').style.height = `${total * 100}%`
    const ended = scrollY >= distance
    stage.classList.toggle('story-end', ended)
    header.classList.toggle('shown', ended)
    // Last frame washes into the exact page colour before the sticky stage releases.
    $('.film-frame').style.opacity = act === N - 1 ? String(1 - clamp((local - 0.82) / 0.18)) : '1'
  }

  const markers = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { mobileAct = Number(e.target.dataset.act); request() }
  }, { rootMargin: '-45% 0px -45% 0px' })

  function setup() {
    const vh = mobile.matches ? cfg.vhPerAct.mobile : cfg.vhPerAct.desktop
    story.style.height = `${N * vh}vh`
    distance = story.offsetHeight - stage.offsetHeight
    $$('.mobile-trigger').forEach((e) => e.remove())
    markers.disconnect()
    for (let i = 0; i < N; i++) {
      const m = document.createElement('div')
      m.className = 'mobile-trigger'
      m.dataset.act = i
      m.style.top = `${(distance * i) / N + stage.offsetHeight / 2}px`
      m.style.height = `${distance / N}px`
      story.append(m)
      markers.observe(m)
    }
    videos.forEach((v) => {
      v.muted = true
      v.loop = mobile.matches && !reduced.matches
      if (reduced.matches) { v.pause(); v.currentTime = 0 }
    })
    active = -1
    request()
  }

  videos.forEach((v) => {
    v.addEventListener('loadedmetadata', request)
    v.addEventListener('seeked', request)
    v.addEventListener('error', () => { v.style.background = `center/cover url(${v.poster})` })
  })
  addEventListener('scroll', request, { passive: true })
  addEventListener('resize', setup)
  mobile.addEventListener('change', setup)
  reduced.addEventListener('change', setup)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) videos.forEach((v) => v.pause())
    else { active = -1; request() }
  })
  setup()
  return { theme, cfg }
}
