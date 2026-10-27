// Paste into the DevTools console of the page you are measuring.
// Fires one wheel event (or listens for your real ones), samples scrollY every frame, prints a table.
// Synthetic events are untrusted (isTrusted === false); a page that ignores them needs MODE = 'listen'.
(() => {
  const MODE = 'synthetic' // 'synthetic' | 'listen'
  const DELTA_Y = 400
  const SETTLE_MS = 250 // scrollY unchanged this long = settled
  const MAX_MS = 4000
  const KEEP = [30, 60, 92, 150, 206, 300, 414, 500, 600] // ms after first movement to report

  const run = () => new Promise((resolve) => {
    const y0 = scrollY
    const samples = []
    let tWheel = 0
    let tMove = null
    let lastChange = 0
    const frame = (now) => {
      samples.push([now, scrollY])
      if (tMove === null && scrollY !== y0) { tMove = now; lastChange = now }
      else if (tMove !== null && scrollY !== samples.at(-2)[1]) lastChange = now
      if (now - tWheel > MAX_MS || (tMove !== null && now - lastChange > SETTLE_MS)) return resolve({ y0, tWheel, tMove, samples })
      requestAnimationFrame(frame)
    }
    const arm = (e) => { tWheel = performance.now(); console.log('wheel', { deltaY: e.deltaY, deltaMode: e.deltaMode, trusted: e.isTrusted }); requestAnimationFrame(frame) }
    if (MODE === 'listen') {
      console.log('Scroll once with your real wheel/trackpad now...')
      addEventListener('wheel', arm, { once: true, capture: true, passive: true })
    } else {
      const e = new WheelEvent('wheel', { deltaY: DELTA_Y, clientX: innerWidth / 2, clientY: innerHeight / 2, bubbles: true, cancelable: true })
      document.elementFromPoint(innerWidth / 2, innerHeight / 2).dispatchEvent(e)
      arm(e)
    }
  })

  run().then(({ y0, tWheel, tMove, samples }) => {
    const end = samples.at(-1)[1]
    const dist = end - y0
    const at = (ms) => samples.reduce((b, s) => (Math.abs(s[0] - (tMove + ms)) < Math.abs(b[0] - (tMove + ms)) ? s : b))
    const settleAt = samples.find((s) => s[1] === end)
    console.table(KEEP.map((ms) => ({ msAfterFirstMove: ms, dy: Math.round(at(ms)[1] - y0), fraction: +((at(ms)[1] - y0) / dist).toFixed(3) })))
    console.log({
      innerHeight, distance: dist, sectionsMoved: +(dist / innerHeight).toFixed(3),
      firstMoveAfterWheelMs: Math.round(tMove - tWheel), settledAfterFirstMoveMs: Math.round(settleAt[0] - tMove),
      settledAfterWheelMs: Math.round(settleAt[0] - tWheel),
    })
    console.log('fit input (ms after wheel, dy):', JSON.stringify(KEEP.map((ms) => [Math.round(at(ms)[0] - tWheel), Math.round(at(ms)[1] - y0)])))
  })
})()
