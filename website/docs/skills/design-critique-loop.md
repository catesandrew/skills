---
title: Design Critique Loop
description: Runs an iterative screenshot self-critique loop that renders a frontend build with a headless browser, reviews it with vision like an adversarial design director, fixes issues, and adds a deliberate complexity upgrade each pass.
---

# design-critique-loop

## Why It Exists

Unlike most skills in this catalog, `design-critique-loop` has no dotfiles history at all — it was authored directly in this public repo in commit `5ebf063` ("feat: add design-critique-loop skill"). The commit message is explicit about origin and intent: it is "distilled from a public 'how we built it' guide, rewritten generically (no brand names, no verbatim text)," and its stated purpose is codifying a screenshot self-critique loop — render at multiple viewports/scroll depths, critique the agent's own screenshots with vision "like a hostile design director," fix everything found, then force one deliberate complexity upgrade so repeated passes converge toward something distinctive rather than merely acceptable. It also introduces an orchestrator/builder split with a diversity constraint for scaling the same loop across N parallel builds.

## What It Does

The core loop is five steps applied per build: (1) render the real page with a headless browser at desktop and mobile viewports, at multiple scroll depths for anything taller than one viewport, capturing console errors and document height in the same pass; (2) look at the screenshots with vision, adversarially, hunting specifically for rhythm/alignment problems, contrast failures, text orphans/widows, dead zones, and anything that "smells like AI default" (generic centered hero, floating glassmorphism cards, template SaaS sections); (3) fix everything found, with no partial fixes; (4) add one deliberate complexity upgrade not strictly required by the brief — a texture, micro-interaction, or small surprise — which the skill frames as the step that actually matters, since "fix what's broken" alone has no force pushing toward distinctive output; (5) repeat for a fixed number of passes (3 by default), without skipping a pass just because the prior one looked clean.

For scaling to N parallel builds (a set of landing pages, a gallery of demos, N component variants), the skill layers on an orchestration model: write a non-negotiable build constitution separately from any individual brief (real copy, distinctive typography/motion, responsive, accessible, zero console errors); write one individually art-directed brief per build that names a concept, an exact palette, typefaces, signature techniques, and — critically — the one specific thing that build has to prove that the others don't; deliberately avoid shared templates/components across builds so outputs can't converge; run a separate cold-review "director" pass with fresh eyes producing specific, concrete findings rather than vague feedback; and, if growing the set over time, enforce a diversity constraint where any new brief may share at most one axis (domain, technique, palette, typography, mood) with anything already in the set.

A dedicated asset-discipline section treats generated media as production assets: compress images to WebP at a sane max width, compress video (h264, reasonable CRF, muted, `faststart`), generate video/3D *from* a still rather than independently to keep them visually continuous, and default to procedural techniques (shaders, canvas, SVG, CSS) over generated assets where appropriate.

## How To Use It

Triggers on: "critique this design", "does this look right", "screenshot review loop", "visual QA with vision", "iterate on design quality", "build N different landing pages", "parallel design agents", any request to raise a build's visual/design quality through repeated self-review rather than a single pass.

```sh
skills add -g catesandrew/skills --skill skills/design-critique-loop
```

```sh
npm install @catesworks/skill-design-critique-loop
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 52 skills as a single bundled plugin named `cw` — there is no standalone per-skill plugin.

## Gotchas & Invariants

- One clean pass is not done — the complexity-upgrade step is what prevents convergence on merely-acceptable output; skipping it produces functional-but-forgettable results.
- Desktop-only review is insufficient — always include a mobile viewport, and multiple scroll depths for anything with meaningful scroll length.
- Critique must be specific and actionable ("this heading breaks mid-word at 390px"), never vague ("make it better").
- Never share templates or components across parallel builds meant to be distinct — doing so defeats the purpose and produces convergent output.
- When growing a build set over time, enforce the "share at most one axis" diversity constraint, or later additions drift toward whatever combination worked last time.
- Route generated-media requests through one central owner once builder count is non-trivial (roughly above two generation jobs per builder) to avoid rate-limit/budget collisions.
- Pin a single stable headless-rendering mode/flag set across concurrent builders — mixed configurations have been observed to hang machine-wide under heavy parallel load.
- `mix-blend-mode: multiply` for legibility over generated backgrounds only works on light grounds; use a scrim or backing panel on dark grounds.

## Related Skills

- [dithered-motif-site](/docs/skills/dithered-motif-site) — a generative-frontend build this critique loop would review.
- [scroll-video-site](/docs/skills/scroll-video-site) — another generative-frontend build type suited to this review loop.

---

_Sourced from: skills/design-critique-loop/SKILL.md, skills/design-critique-loop/metadata.json, public-repo commit `5ebf063`_
