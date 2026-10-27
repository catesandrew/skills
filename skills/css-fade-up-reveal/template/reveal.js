/* reveal.js - tiny IntersectionObserver reveal. Classic script (works from file://) and CommonJS-testable.
   Usage: <script src="reveal.js"></script> then Reveal.init(). */
(function (root, factory) {
  var api = factory(root)
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else root.Reveal = api
})(typeof window !== 'undefined' ? window : globalThis, function (root) {
  var VARIANTS = ['up', 'down', 'left', 'right', 'fade', 'scale']

  // Unknown or empty variants fall back to "up" (the CSS default).
  function parseVariant(value) {
    var v = String(value == null ? '' : value).trim().toLowerCase()
    return VARIANTS.indexOf(v) === -1 ? 'up' : v
  }

  // "200", "200ms", "0.2s" -> milliseconds; garbage or negative -> 0.
  function parseDelay(value) {
    var m = /^\s*(\d*\.?\d+)\s*(ms|s)?\s*$/i.exec(String(value == null ? '' : value))
    if (!m) return 0
    var n = parseFloat(m[1]) * (m[2] && m[2].toLowerCase() === 's' ? 1000 : 1)
    return n > 0 ? Math.round(n) : 0
  }

  // Delay for the index-th child; capped so long lists never wait seconds.
  function staggerDelay(index, step, cap) {
    var s = step == null ? 80 : step
    var c = cap == null ? 600 : cap
    return Math.min(Math.max(index, 0) * s, c)
  }

  function init(opts) {
    opts = opts || {}
    var doc = opts.document || root.document
    var selector = opts.selector || '[data-reveal]'
    var step = opts.staggerStep == null ? 80 : opts.staggerStep
    var html = doc.documentElement
    html.classList.add('js')

    var reduce = !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches)
    var io = null
    var prepared = new WeakSet()

    function show(el) { el.classList.add('is-visible') }

    function prepare(el) {
      if (prepared.has(el)) return
      prepared.add(el)
      el.setAttribute('data-reveal', parseVariant(el.getAttribute('data-reveal')))
      var own = el.getAttribute('data-reveal-delay')
      var parent = el.parentElement
      var ms = 0
      if (own != null) ms = parseDelay(own)
      else if (parent && parent.hasAttribute('data-reveal-stagger')) {
        var kids = Array.prototype.filter.call(parent.children, function (c) { return c.matches(selector) })
        ms = staggerDelay(kids.indexOf(el), parseDelay(parent.getAttribute('data-reveal-stagger')) || step)
      }
      if (ms) el.style.setProperty('--reveal-delay', ms + 'ms')
      if (reduce || !io) show(el)
      else io.observe(el)
    }

    function scan(node) {
      if (node.nodeType !== 1) return
      if (node.matches(selector)) prepare(node)
      node.querySelectorAll(selector).forEach(prepare)
    }

    if (!reduce && 'IntersectionObserver' in root) {
      io = new root.IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return
          show(e.target)
          io.unobserve(e.target)
        })
      }, { threshold: opts.threshold == null ? 0.15 : opts.threshold, rootMargin: opts.rootMargin || '0px 0px -8% 0px' })
    }

    scan(doc.body || html)

    var mo = null
    if ('MutationObserver' in root) {
      mo = new root.MutationObserver(function (muts) {
        muts.forEach(function (m) { m.addedNodes.forEach(scan) })
      })
      mo.observe(doc.body || html, { childList: true, subtree: true })
    }

    return {
      refresh: function () { scan(doc.body || html) },
      destroy: function () { if (io) io.disconnect(); if (mo) mo.disconnect() }
    }
  }

  return { init: init, parseVariant: parseVariant, parseDelay: parseDelay, staggerDelay: staggerDelay, VARIANTS: VARIANTS }
})
