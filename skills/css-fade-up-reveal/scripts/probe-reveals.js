/* probe-reveals.js - paste into the DevTools console on a page, then scroll slowly top to bottom.
   Measures what a real page does so draft values (duration, easing, distance) can be replaced by measured ones.
   Override the default selector first with: window.__PROBE_SELECTOR = '.my-selector' */
(function () {
  if (window.__probe) window.__probe.stop()
  var sel = window.__PROBE_SELECTOR ||
    '.elementor-invisible, .animated, [class*="fadeIn"], [class*="reveal"], [data-reveal], [data-aos], [class*="wow"]'
  var t0 = performance.now(), rows = new Map(), cleanups = []
  var label = function (el) {
    return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + '.' + Array.from(el.classList).slice(0, 3).join('.')
  }
  function snap(el, why) {
    var cs = getComputedStyle(el)
    var r = rows.get(el) || { el: label(el), events: [] }
    rows.set(el, r)
    r.events.push({
      t: Math.round(performance.now() - t0), why: why, class: el.className,
      opacity: cs.opacity, transform: cs.transform,
      transition: cs.transitionProperty + ' ' + cs.transitionDuration + ' ' + cs.transitionTimingFunction + ' delay ' + cs.transitionDelay,
      animation: cs.animationName + ' ' + cs.animationDuration + ' ' + cs.animationTimingFunction + ' delay ' + cs.animationDelay
    })
  }
  var els = Array.from(document.querySelectorAll(sel))
  console.log('[probe] tracking', els.length, 'elements for', sel)
  var mo = new MutationObserver(function (ms) {
    ms.forEach(function (m) {
      if (m.target.matches && m.target.matches(sel)) snap(m.target, 'attr ' + m.attributeName + ': ' + (m.oldValue || '') + ' -> ' + (m.target.getAttribute(m.attributeName) || ''))
    })
  })
  els.forEach(function (el) {
    snap(el, 'initial')
    mo.observe(el, { attributes: true, attributeFilter: ['class', 'style'], attributeOldValue: true })
    ;['transitionstart', 'transitionend', 'animationstart', 'animationend'].forEach(function (ev) {
      var h = function (e) {
        if (e.target === el) snap(el, ev + (e.propertyName ? ':' + e.propertyName : '') + (e.animationName ? ':' + e.animationName : '') + ' elapsed=' + e.elapsedTime)
      }
      el.addEventListener(ev, h)
      cleanups.push(function () { el.removeEventListener(ev, h) })
    })
  })
  window.__probe = {
    rows: rows,
    // Measured duration = elapsedTime on the transitionend/animationend row; start offset = initial transform matrix (ty is the 6th value).
    report: function () {
      rows.forEach(function (r) {
        console.groupCollapsed('[probe] ' + r.el + ' (' + r.events.length + ' events)')
        console.table(r.events)
        console.groupEnd()
      })
    },
    stop: function () { mo.disconnect(); cleanups.forEach(function (f) { f() }); delete window.__probe }
  }
  console.log('[probe] scroll the page, then run __probe.report()')
})()
