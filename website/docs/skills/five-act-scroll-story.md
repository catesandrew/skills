---
title: Five-Act Scroll Story
description: Builds a five-act scroll story in Next.js from five short AI video clips. Prompts the user for plain-English act descriptions, rewrites them into cinematic shot prompts, generates the clips with Higgsfield or Kling behind a cost gate, and optionally adds a Shopify storefront through Hydrogen.
---

# five-act-scroll-story

## Why It Exists

A creator walkthrough ("Opus 5.5 Builds a Scroll-Animated Shopify Store" by Zygis Stan) generated five 5-second clips in Higgsfield (Seedance 2.0 mini), referenced them by filename, and had Claude Code build a headless Shopify store around a five-act scroll story: plant, leaf, extraction, bottle, skin. The store was fine, and the clip quality limited the result. The five-clip scroll story was the part worth keeping, and it works with or without a shop.

The prompts that drove those clips are written in film grammar ("the camera drifts slowly forward", "locked direction") that most people do not speak. The skill makes that translation its job: the user supplies the story in plain words and the skill converts it.

`cinematic-scroll-site` already covers a single hero or a chained journey as a static site. This skill is the narrower, Next.js-based variant with exactly five acts, a user-authored story, and an optional Shopify path.

## What It Does

Eight phases: a setup scan with three choices (provider, Shopify yes or no, subject); intake of five act descriptions; a cinematic rewrite; cost-gated generation; encode; a Next.js build; an optional Shopify step; and verification.

The rewrite writes one shared "world line" (light, palette, lens, setting) and pastes it into all five prompts so the acts match, then converts each act with a template of one camera move, speed, framing, ambient motion, and guardrail phrases. The user sees a table of their words, the prompt, and why, and edits any row before credits move. `references/cinematic-vocabulary.md` holds the vocabulary, the guardrail phrases with what each prevents, and worked conversions.

Generation tests act 1 alone first, then acts 2 to 5, with a watch-it-yourself gate per clip. The clips are joined into one file and scrubbed by scroll position with the engine from `scroll-video-site`. `template/FiveActScroll.tsx` maps scroll progress to the active act using each clip's real duration (`template/act-at.js`, unit-tested), and shows stacked poster stills on touch devices and for reduced-motion users.

Shopify is optional. When chosen, `references/shopify-hydrogen.md` follows Shopify's Hydrogen developer preview: `npx @shopify/hydrogen@preview setup` installs the package and copies its agent skills into the Next.js project, a server-only private Storefront token goes in the environment, and the agent wires the storefront below the story.

## How To Use It

Triggers on: "five video scroll story", "5 act scroll site", "scroll story with Higgsfield or Kling", "plant to product scroll animation", "scroll animated Shopify store", or turning an idea into video prompts for a scroll site.

```sh
skills add -g catesandrew/skills --skill skills/five-act-scroll-story
```

```sh
npm install @catesworks/skill-five-act-scroll-story
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

It reuses `cinematic-scroll-site` (provider notes, `encode.mjs`, `setup.sh`) and `scroll-video-site` (scrub engine), so install those too.

## Gotchas & Invariants

- Hydrogen is a developer preview. The API will change and deploying to Oxygen through the Shopify CLI was not wired up at the time of writing, so re-read the current docs and prefer a Vercel or Node host.
- The private Storefront token must never use a `NEXT_PUBLIC_` prefix.
- The five clips become one file, so there are visible cuts between acts unless the provider accepts first and last frames and the acts are chained.
- Provider tool names, prices, and end-frame support were not verified; the skill checks the connector's real tool list first.
- Caption timing uses measured clip durations, not an assumed 5.0 seconds.
- The section needs `clip-path: inset(0)` or the engine's fixed video shows below the story.

## Related Skills

- [cinematic-scroll-site](/docs/skills/cinematic-scroll-site): single-hero or chained-journey static sites; supplies provider notes and encode scripts.
- [scroll-video-site](/docs/skills/scroll-video-site): the scrub engine this skill builds on.
- [high-ticket-site-generator](/docs/skills/high-ticket-site-generator): another CreatorKore-derived site generator, single-file HTML.

---

_Sourced from: skills/five-act-scroll-story/SKILL.md, skills/five-act-scroll-story/metadata.json, skills/five-act-scroll-story/references/_
