// Pure logic for pinned-video-scrub. No DOM, no GSAP: unit-tested with `node --test`.

export const DEFAULTS = {
  smoothing: 0.18, // lerp factor per frame (observed default)
  snap: 0.005, // seconds; below this gap the playhead snaps to target (observed)
  seekThreshold: 0.02, // seconds; our definition: smaller gaps are not worth a seek
  readyTimeout: 2000, // ms (observed default)
  readyThreshold: 0.6, // our definition: fraction of duration buffered
}

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

/** Scroll progress 0..1 -> video time in seconds, clamped to [0, duration]. */
export function progressToTime(progress, duration) {
  if (!Number.isFinite(duration) || duration <= 0) return 0
  return clamp(progress, 0, 1) * duration
}

/** One lerp step toward target; snaps when closer than `snap` seconds. */
export function lerpStep(current, target, smoothing = DEFAULTS.smoothing, snap = DEFAULTS.snap) {
  if (Math.abs(target - current) < snap) return target
  return current + (target - current) * clamp(smoothing, 0, 1)
}

/**
 * Seek coalescing. 'seek' = assign currentTime now, 'queue' = a seek is in
 * flight so remember only the newest value, 'skip' = gap too small to matter.
 */
export function planSeek({ playhead, currentTime, seeking, threshold = DEFAULTS.seekThreshold }) {
  if (Math.abs(playhead - currentTime) <= threshold) return 'skip'
  return seeking ? 'queue' : 'seek'
}

/** Fraction of the clip buffered from 0. `ranges` is [[start, end], ...]. */
export function bufferedFraction(ranges, duration) {
  if (!duration || !ranges.length) return 0
  const end = ranges.reduce((m, [s, e]) => (s <= 0.1 ? Math.max(m, e) : m), 0)
  return clamp(end / duration, 0, 1)
}

/**
 * Ready gate: 'ready' | 'wait' | 'fallback'.
 * Ready needs metadata (duration known), readyState >= 3 (HAVE_FUTURE_DATA)
 * and bufferedFraction >= threshold. Errors fall back immediately; otherwise
 * the timeout (ms since init) decides between wait and fallback.
 */
export function readyDecision({ errored = false, readyState = 0, duration = NaN, buffered = 0,
  threshold = DEFAULTS.readyThreshold, elapsed = 0, timeout = DEFAULTS.readyTimeout }) {
  if (errored) return 'fallback'
  if (Number.isFinite(duration) && duration > 0 && readyState >= 3 && buffered >= threshold) return 'ready'
  return elapsed >= timeout ? 'fallback' : 'wait'
}

const mime = (url) => (/\.webm(\?|#|$)/i.test(url) ? 'video/webm' : /\.(mp4|m4v)(\?|#|$)/i.test(url) ? 'video/mp4' : '')

/**
 * Source selection. `desktop` / `mobile` are space-separated candidate lists
 * (first playable wins, e.g. "clip.mp4 clip.webm"). Reduced motion or no
 * playable candidate -> stills.
 */
export function chooseSource({ desktop = '', mobile = '', isMobile = false, reducedMotion = false,
  canPlay = (type) => !!type }) {
  if (reducedMotion) return { mode: 'stills', src: '', reason: 'reduced-motion' }
  const useMobile = isMobile && mobile.trim() !== ''
  const src = (useMobile ? mobile : desktop).split(/\s+/).filter(Boolean).find((u) => canPlay(mime(u)))
  return src ? { mode: 'video', src, reason: useMobile ? 'mobile' : 'desktop' }
    : { mode: 'stills', src: '', reason: 'no-playable-source' }
}

/** Read data-* config from a dataset-like object, falling back to DEFAULTS. */
export function parseConfig(ds = {}) {
  const num = (v, d) => (v === undefined || v === '' || !Number.isFinite(+v) ? d : +v)
  return {
    start: ds.scrollStart || 'top top',
    end: ds.scrollEnd || 'bottom bottom',
    smoothing: clamp(num(ds.smoothing, DEFAULTS.smoothing), 0.01, 1),
    readyTimeout: Math.max(0, num(ds.readyTimeout, DEFAULTS.readyTimeout)),
    readyThreshold: clamp(num(ds.readyThreshold, DEFAULTS.readyThreshold), 0, 1),
    preload: ds.preload === 'direct' ? 'direct' : 'blob',
    desktopSrc: ds.desktopSrc || '',
    mobileSrc: ds.mobileSrc || '',
    normalize: ds.normalizeScroll === 'true',
  }
}
