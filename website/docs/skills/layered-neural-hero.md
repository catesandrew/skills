---
title: Layered Neural Hero
description: Builds a premium dark-mode Next.js landing-page hero with a four-layer background (looping video, interactive neural-network canvas, grain overlay, content), a glassmorphic waitlist form and a pulsing call-to-action, plus the cursor-reactive NeuralCanvas component it imports.
---

# layered-neural-hero

## Why It Exists

A hero that stacks video, a live canvas and a grain texture can look expensive, and it fails in predictable ways: flicker and layout shift on mobile, hydration errors from the canvas, a blurry canvas on retina screens, and a cursor effect that never fires because the content layer covers the canvas. The skill packages a build brief for both components with those failure points already handled.

## What It Does

It gathers a few inputs (brand name, accent color, base color, headline, video and poster, call-to-action label), then runs two build briefs:

- **Hero** (`references/hero-prompt.md`): a `min-h-screen` container with four layers, bottom to top. Background video at low opacity under a dark overlay. The neural canvas. An SVG noise texture. The content: a glass badge, a heading with an animated gradient underline, a paragraph, and a glass waitlist form whose button has a pulsing glow.
- **Canvas** (`references/neural-canvas-prompt.md`): drifting nodes, lines between nearby nodes, light pulses travelling along the lines, and cursor repulsion. It uses `requestAnimationFrame`, handles `devicePixelRatio` and resize, and renders 35 nodes below 768px width and 100 above.

It then runs a verification checklist: build and type-check, no hydration warning, video autoplay, no mobile flicker, reduced-motion behavior, working cursor repulsion, and readable text.

The two briefs carry corrections to the original prompts: pointer listeners go on the section or window instead of the canvas, the loop is cleaned up on unmount and paused when hidden, and `prefers-reduced-motion` is honored.

## How To Use It

Triggers on: "premium hero", "neural network hero", "particle hero", "constellation background", "waitlist hero", "glassmorphism hero".

```sh
skills add -g catesandrew/skills --skill skills/layered-neural-hero
```

```sh
npm install @catesworks/skill-layered-neural-hero
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

It targets Next.js (App Router), Tailwind CSS, Framer Motion and `lucide-react`.

## Gotchas & Invariants

- The canvas sits under the content layer, so it never receives pointer events. Attach the listeners to the section or `window`.
- The canvas must be loaded with `dynamic` and `ssr: false`, since it uses `window`.
- Avoid large `y` animations on mobile. Use opacity fades or a small scale.
- The skill writes build briefs, not tested template code, so check the generated components in a real browser, especially on a phone.
- The form submit is a stub unless the project already has an endpoint.

## Related Skills

- [dithered-motif-site](/docs/skills/dithered-motif-site): an animated dithered particle-field hero or background.
- [scroll-video-site](/docs/skills/scroll-video-site): a scroll-scrubbed video landing page.
- [high-ticket-site-generator](/docs/skills/high-ticket-site-generator): a single-file premium site with a conversion spine.

---

_Sourced from: skills/layered-neural-hero/SKILL.md, skills/layered-neural-hero/metadata.json, skills/layered-neural-hero/references/_
