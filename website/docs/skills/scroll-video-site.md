---
title: Scroll Video Site
description: Builds a full-bleed, scroll-scrubbed video landing page where scroll position maps to a video's currentTime, covering a damped-playhead seek-coalescing engine, Lenis smooth scrolling, an autoplay tour control, and anti-slop constraints.
---

# scroll-video-site

## Why It Exists

Unlike most of this catalog, `scroll-video-site` was authored directly in the public `catesandrew/skills` repo rather than migrated from `~/.dotfiles` — commit `35b6689` ("feat: add scroll-video-site skill", 5 days ago at time of writing) adds the skill, its two reference files, a README entry, and a marketplace.json update in one 466-line diff, with no prior trace anywhere in dotfiles history (confirmed: both a directory-path search and a commit-message grep for `scroll-video-site` against `~/.dotfiles` return zero hits). The commit message is candid about its origin: the technique was "inspired by a technique seen in a paid course, rewritten from scratch (no verbatim source text, no vendor branding) to fit this repo's skill format and quality bar" — i.e., the underlying pattern (damped-playhead video scrubbing) is externally inspired, but the skill's actual text is original.

## What It Does

The skill documents the mechanism behind a one-page cinematic microsite: a single pre-generated video file pinned full-viewport behind the page, where scrolling from top to bottom scrubs the video from its first frame to its last, with chapter content animating in sync. It's explicit that this skill doesn't generate the video — that's assumed to already exist at a static path — and instead solves the much harder problem of making scroll-driven `currentTime` scrubbing feel smooth instead of stuttery.

The core "ScrollVideo engine" section lays out why the naive `video.currentTime = scrollProgress * duration` approach fails (seeking a compressed video isn't instantaneous, and scroll events fire faster than the decoder can seek) and prescribes a specific fix: ScrollTrigger only ever sets a *target* time; a single `requestAnimationFrame` loop eases an internal `playhead` value toward that target using frame-rate-independent exponential damping (`playhead += (targetTime - playhead) * damping`, not a fixed per-frame step); a new seek is issued only if the decoder isn't already mid-seek, tracked via the video element's `seeking`/`seeked` events, with only the newest requested target queued (an unbounded seek queue is called out as "the #1 cause of scroll-scrub sites feeling laggy or behind"); stale queued seeks that would move the film backward after a newer target has superseded them are rejected outright; `requestVideoFrameCallback` is preferred where available to align updates to actual decoded frames; duration is always read from `loadedmetadata`, never hardcoded; and `ScrollTrigger.refresh()` is called only on real layout changes, never on a scroll tick or timer.

Beyond the engine, the skill covers wiring Lenis smooth scrolling through GSAP's own ticker instead of a second competing RAF loop, an optional "Auto Tour" autoplay control with explicit states (Start Tour → Pause/Resume → Replay) that pauses on any manual scroll input (wheel, touch, pointer, or keyboard scroll keys) and respects route changes, and an "anti-slop constraints" section pushing back on generic AI-site tells — no floating glassmorphism panels, no bolted-on SaaS feature-card grids, no animating every element, no scroll hijacking beyond the intentional video scrub. It ships a `references/scroll-video-engine.md` gotcha list and a `references/scroll-video-engine.tsx` reference component implementation.

## How To Use It

Triggers on: "scroll-scrubbed video", "video scrubbing scrolltrigger", "currentTime scroll sync", "cinematic scroll video landing page", "video background scroll site", "scrub video with scroll position", or adapting a single hero video into a one-page scroll experience.

```sh
skills add -g catesandrew/skills --skill skills/scroll-video-site
```

```sh
npm install @catesworks/skill-scroll-video-site
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 52 skills as a single bundled plugin named `cw` — there is no standalone per-skill plugin.

## Gotchas & Invariants

- Never assign `video.currentTime` directly from a scroll handler — always route through the damped-playhead + seek-coalescing pattern, or the scrub visibly stutters.
- Only one active seek at a time: track `seeking`/`seeked` state and queue just the newest target; an unbounded seek queue is the named #1 cause of a laggy-feeling scrub.
- Reject stale queued seeks that would move the film backward once a later target has already superseded them.
- Read video duration from the `loadedmetadata` event — never hardcode clip length, or the last few percent of scroll silently desyncs.
- Call `ScrollTrigger.refresh()` only on real layout changes (resize, route change) — never inside the RAF loop or on a scroll tick.
- Drive Lenis off GSAP's ticker (`gsap.ticker.add(...)`), not a second independent RAF loop — two competing loops is a named source of jitter and stale ScrollTrigger reads.
- Guard StrictMode double-invoked cleanup so it doesn't tear down the video's `src` on the throwaway probe-mount — this has caused a real dev-only flash/reload bug.
- Test scrubbing specifically on iOS Safari, not just desktop Chrome — its stricter autoplay/seek behavior surfaces bugs invisible elsewhere.
- Disable Lenis smoothing and decorative parallax under `prefers-reduced-motion`; the core video-scrub itself may remain since it's the primary content.
- Any manual scroll input (wheel, touch, pointer, or keyboard scroll keys) must pause the Auto Tour immediately — a tour fighting a scrolling user causes instant bounce.
- Update Auto Tour progress via refs or CSS custom properties, not React state, to avoid a re-render every animation frame.

## Related Skills

- [dithered-motif-site](/docs/skills/dithered-motif-site) — another generative-frontend pipeline skill using produced media as a page centerpiece.
- [point-cloud-assembly-scene](/docs/skills/point-cloud-assembly-scene) — a related generative-frontend particle/motif technique.

---

_Sourced from: skills/scroll-video-site/SKILL.md, skills/scroll-video-site/metadata.json, public-repo commit `35b6689`_
