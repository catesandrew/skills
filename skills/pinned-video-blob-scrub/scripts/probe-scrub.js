// probe-scrub.js: paste into the DevTools console of a page you want to inspect.
// Needs the page to expose window.gsap + window.ScrollTrigger (CDN/Webflow builds do).
// Usage after pasting:  await __probe.run()   (dump + sampler)   or  __probe.dump()
(() => {
  const ST = window.ScrollTrigger
  if (!ST) return console.warn('probe-scrub: window.ScrollTrigger not found (bundled? try the page\'s own module scope)')
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  const label = (el) => (el ? `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''}` : '-')

  function dump() {
    const triggers = ST.getAll().map((t, i) => ({
      i, trigger: label(t.trigger), pin: label(t.pin), start: Math.round(t.start), end: Math.round(t.end),
      scrub: t.vars.scrub ?? '-', pinSpacing: t.vars.pinSpacing ?? '-', refreshPriority: t.vars.refreshPriority ?? '-',
      invalidateOnRefresh: !!t.vars.invalidateOnRefresh, progress: +t.progress.toFixed(3), active: t.isActive,
    }))
    const videos = [...document.querySelectorAll('video')].map((v) => ({
      el: label(v), src: (v.currentSrc || v.src || '').slice(0, 40), isBlob: (v.currentSrc || v.src).startsWith('blob:'),
      readyState: v.readyState, networkState: v.networkState, duration: v.duration, currentTime: +v.currentTime.toFixed(3),
      buffered: [...Array(v.buffered.length)].map((_, i) => [+v.buffered.start(i).toFixed(2), +v.buffered.end(i).toFixed(2)]),
      size: `${v.videoWidth}x${v.videoHeight}`, paused: v.paused, muted: v.muted, preload: v.preload,
      dataset: { ...v.dataset }, parentDataset: { ...v.parentElement.dataset },
    }))
    console.table(triggers)
    console.table(videos.map(({ dataset, parentDataset, buffered, ...r }) => ({ ...r, buffered: JSON.stringify(buffered) })))
    return { triggers, videos, scrollMax: ST.maxScroll(window), env: { gsap: window.gsap?.version, st: ST.version, normalizeScroll: !!ST.normalizeScroll() } }
  }

  // Scroll the page in `steps` jumps; at each, wait `settle` ms and record scrollY -> progress -> currentTime/duration.
  async function sample({ video = document.querySelector('video'), steps = 20, settle = 600 } = {}) {
    // The scrub trigger is the non-pin trigger whose range contains the video's wrapper.
    const cand = ST.getAll().filter((t) => !t.pin && t.trigger && t.trigger.contains(video))
    const t = cand.sort((a, b) => (b.end - b.start) - (a.end - a.start))[0] || ST.getAll().find((x) => x.trigger?.contains?.(video))
    if (!t) return console.warn('no ScrollTrigger found around the video')
    const from = Math.max(0, t.start - 200), to = Math.min(ST.maxScroll(window), t.end + 200)
    const rows = []
    for (let i = 0; i <= steps; i++) {
      scrollTo(0, from + ((to - from) * i) / steps)
      await sleep(settle)
      const p = t.progress
      rows.push({ scrollY: Math.round(scrollY), progress: +p.toFixed(3), currentTime: +video.currentTime.toFixed(3),
        expected: +(p * video.duration).toFixed(3), err: +(video.currentTime - p * video.duration).toFixed(3) })
    }
    console.table(rows)
    const maxErr = Math.max(...rows.map((r) => Math.abs(r.err)))
    const mono = rows.every((r, i) => !i || r.currentTime >= rows[i - 1].currentTime - 0.05)
    console.log(`range ${Math.round(t.start)}..${Math.round(t.end)} | max |currentTime - progress*duration| = ${maxErr.toFixed(3)}s | monotonic: ${mono} | clamps: start=${rows[0].currentTime} end=${rows.at(-1).currentTime}/${video.duration}`)
    return rows
  }

  window.__probe = { dump, sample, run: async (o) => { const d = dump(); await sample(o); return d } }
  console.log('probe-scrub ready: await __probe.run() | __probe.dump() | await __probe.sample({steps, settle})')
})()
