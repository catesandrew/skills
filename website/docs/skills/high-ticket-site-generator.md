---
title: High-Ticket Site Generator
description: Turns a fill-in brief (brand, niche, vibe, palette, headline, calculator input) into a single-file animated premium marketing site, plus the conversion section spine (proof, lead form, pricing, FAQ, booking) learned from a live reference site.
---

# high-ticket-site-generator

## Why It Exists

It started as a copy-paste prompt — Zygis Stan's "Universal High-Ticket Site Generator" in the CreatorKore Skool community — meant to get Awwwards-style single-file sites out of an LLM for any niche by filling in blanks. Comparing that prompt to the live site it lineage-produced (burnerscale.com) showed the prompt only covers the visual layer: a particle entrance, a hero, and an ROI calculator whose two outputs are never defined. The live site instead ships a full conversion path (pricing tiers, proof, free-sample form, FAQ, Cal.com booking) and drops Tailwind, GSAP, and canvas entirely. The skill keeps the prompt as its `showcase` mode and adds a `conversion` mode built from what the live site actually does.

## What It Does

Collects a short intake (brand, niche, vibe, two hex colors, entrance effect, headline/subheadline, calculator input and logic, CTAs, mode), then generates one `index.html` with all CSS/JS inline. Build rules cover the stack (Tailwind CDN, GSAP + ScrollTrigger, raw canvas particles, display/body font pair — or dependency-free vanilla), CSS-variable tokens, a skippable cinematic entrance that never blocks content, a hero with two CTAs, an ROI calculator with stated assumptions, reduced-motion and off-screen-pause handling, and mobile rules (`overflow-x: hidden`, hamburger overlay, stacked grids). In `conversion` mode it adds the ten-part section spine and a mandatory browser verification pass at 1440px and 390px.

Two references back it: `prompt-template.md` (the original prompt, with its known gaps) and `reference-site-analysis.md` (tokens, section spine, and techniques read from burnerscale.com on 2026-10-26).

## How To Use It

Triggers on: "build a landing page for `<brand>`", "Awwwards-style site", "high-ticket site", "$5k website", "site generator prompt", or filling in a brand/niche/vibe/palette template.

```sh
skills add -g catesandrew/skills --skill skills/high-ticket-site-generator
```

```sh
npm install @catesworks/skill-high-ticket-site-generator
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

## Gotchas & Invariants

- Never ship unfilled `[INSERT ...]` tokens or invented testimonials, metrics, or prices presented as real.
- The entrance must be skippable and must not delay content; reduced-motion users see final states immediately.
- ROI outputs must show their assumptions or they read as a gimmick.
- Pause canvases off-screen and cap devicePixelRatio at 2.
- Hero + calculator alone is a demo, not a site — `conversion` mode is the default for anything a client will publish.
- Check muted text contrast (≥ 4.5:1) on dark backgrounds.

## Related Skills

- [cinematic-scroll-site](/docs/skills/cinematic-scroll-site) — heavier scroll-video pipeline for the hero.
- [dithered-motif-site](/docs/skills/dithered-motif-site) — alternative animated hero/background.
- [design-critique-loop](/docs/skills/design-critique-loop) — review loop for judging the generated site.

---

_Sourced from: skills/high-ticket-site-generator/SKILL.md, skills/high-ticket-site-generator/metadata.json_
