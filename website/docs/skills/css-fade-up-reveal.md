---
title: CSS Fade-Up Reveal
description: Library-free scroll polish with native smooth scrolling and an IntersectionObserver fade-up reveal, including variants, stagger, a native view() enhancement, accessibility fallbacks, and a probe for measuring real pages.
---

# css-fade-up-reveal

## Why It Exists

Many pages need only one scroll effect: content that fades up as it enters view. Reaching for GSAP or a scrolljacking library for that is heavy. The skill began from inspecting one WordPress/Elementor page that used `scroll-behavior: smooth` and Elementor's `fadeInUp` entrance on nine elements, with no parallax, sticky or scrub effects.

The original durations and easing were not measured, so the skill keeps observed facts, a recipe, and unverified assumptions in separate sections, and ships a probe so the guessed values can be replaced by measured ones.

## What It Does

The recipe hides elements at `opacity: 0` with a small transform, adds `.is-visible` once through a shared `IntersectionObserver`, and lets a CSS transition animate. A `.js` class on `<html>` gates the hidden state, so no-JS visitors see everything.

The bundled template (`reveal.css`, `reveal.js`, `demo.html`) supports `data-reveal` variants (up, down, left, right, fade, scale), `data-reveal-delay`, parent-level `data-reveal-stagger`, late-inserted nodes via a `MutationObserver`, reduced motion, and browsers without `IntersectionObserver`. References cover variants (including an `animation-timeline: view()` enhancement and an Elementor mapping table), accessibility and fallbacks, tuning and performance, and verification. `scripts/probe-reveals.js` is a paste-into-DevTools tool that logs class changes, computed transitions and animations, and measured durations; `scripts/reveal.test.mjs` is a `node --test` self-check.

A decision table in the skill compares this approach with GSAP ScrollTrigger, Elementor's own settings, and native scroll-driven CSS.

## How To Use It

Triggers on: "fade in on scroll", "fadeInUp", "scroll reveal without GSAP", "scroll-behavior smooth", "Elementor-style entrance animation".

```sh
skills add -g catesandrew/skills --skill skills/css-fade-up-reveal
```

```sh
npm install @catesworks/skill-css-fade-up-reveal
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 60 skills as a single bundled plugin named `cw`; there is no standalone per-skill plugin.

Open `template/demo.html` directly in a browser to see it work; no build step. Self-check: `node --test scripts/reveal.test.mjs`.

## Gotchas & Invariants

- Gate the hidden state behind `html.js`; never hide content unconditionally.
- Animate only `transform` and `opacity`; keep the element's box (no `display: none`).
- Unobserve after the first reveal; do not re-trigger on scroll.
- Do not hide above-the-fold hero content behind a reveal (LCP).
- Very tall elements need `threshold: 0`, or they may never reach the ratio.
- Do not pair `scroll-behavior: smooth` with a JS smooth-scroll library.
- Reduced motion, missing `IntersectionObserver` and print must all end with content visible.
- The draft 700ms, easing and 24px are unmeasured; use the probe on the source page before claiming parity with Elementor.

## Related Skills

- [pinned-video-blob-scrub](/docs/skills/pinned-video-blob-scrub): pinned, scroll-scrubbed video and blob effects when a one-shot reveal is not enough.
- [lenis-section-snap-tilt](/docs/skills/lenis-section-snap-tilt): Lenis-driven section snapping with tilt; do not combine with native smooth scrolling.
- [scroll-video-site](/docs/skills/scroll-video-site): frame- or video-scrubbed scroll engine.
- [cinematic-scroll-site](/docs/skills/cinematic-scroll-site): the full pipeline for cinematic scroll-driven sites.

---

_Sourced from: skills/css-fade-up-reveal/SKILL.md, skills/css-fade-up-reveal/metadata.json, skills/css-fade-up-reveal/references/_
