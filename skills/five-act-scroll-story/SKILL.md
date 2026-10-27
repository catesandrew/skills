---
name: five-act-scroll-story
description: >-
  Use when the user wants a scroll-driven "story" site built from five short
  AI-generated video clips (one per act) in a Next.js app, with the option to
  add a Shopify storefront via Hydrogen afterwards. Prompts the user for five
  plain-English act descriptions, rewrites them into cinematic shot prompts,
  generates the clips with Higgsfield or Kling behind a cost gate, encodes
  them into one scrubbable video, and builds the page. Triggers on "five video
  scroll story", "5 act scroll site", "scroll story with Higgsfield or Kling",
  "plant to product scroll animation", "scroll animated Shopify store", or
  "turn my idea into video prompts for a scroll site". Not for single-hero
  sites (use cinematic-scroll-site).
---

# five-act-scroll-story

Five 5-second clips, one per act, joined into one file and scrubbed by scroll
position, with a caption per act. Shopify is optional: the story stands alone.

## Companion skills (reuse, do not reimplement)

| Need | Use |
|---|---|
| Provider connect steps, capability checklist, price comparison | `cinematic-scroll-site/references/providers.md` |
| Scrub engine (damped playhead, seek coalescing, iOS quirks) | `scroll-video-site/references/scroll-video-engine.tsx` |
| Concat / poster / last-frame encodes | `cinematic-scroll-site/scripts/encode.mjs` |
| Tool scan (ffmpeg, node) | `cinematic-scroll-site/scripts/setup.sh` |
| Shopify wiring | Hydrogen's own agent skills (see `references/shopify-hydrogen.md`) |

If a companion is missing, say so and fall back to its inline recipe.

## Phase 1. Preflight and three choices

Run the setup scan, then ask in one short message:

1. **Provider:** Higgsfield or Kling (detect connected tools first; if none, give connect steps from `providers.md` and verify the tools appear).
2. **Shopify:** yes or no. Default no. Say it can be added later.
3. **What is it:** brand or subject, and any assets or references.

## Phase 2. The five acts (prompt the user)

Ask for one plain-English line per act. Offer a default arc and let them
overwrite any line:

`1 origin -> 2 detail -> 3 process -> 4 product -> 5 payoff`
(example: plant -> leaf -> extraction -> bottle -> skin)

Accept rough text ("a bottle appears on a wet stone"). Do not ask them for
camera language; that is your job.

## Phase 3. Cinematic rewrite (text to shot prompt)

Read `references/cinematic-vocabulary.md`. First write one **world line**
(light source and color temperature, palette, lens, setting) and prepend it
verbatim to all five prompts so the acts match. Then convert each act using
the template there: one camera move, speed, framing, subject motion, the
guardrail phrases. Show a table: user's words | cinematic prompt | one-line
"why". Let the user edit any row. Nothing is generated until they approve it.

## Phase 4. Generate (cost gated)

1. Run the provider capability checklist (`providers.md`); preflight the price of one clip, state the price of five, get one yes.
2. Generate act 1 alone first as a style test. If it is off, fix the world line, not just the one prompt.
3. Generate acts 2-5. 5 s, 16:9, 1080p, audio off, no style preset.
4. **Review gate per clip:** save to a review folder outside the app, have the user watch each, re-roll cheaply on failure.
5. Where the provider accepts first and last frames, optionally chain acts (see `providers.md`) so cuts between acts disappear; otherwise accept hard cuts and design captions around them.

## Phase 5. Encode

```sh
node <cinematic-scroll-site>/scripts/encode.mjs concat public/media/story.mp4 act-1.mp4 act-2.mp4 act-3.mp4 act-4.mp4 act-5.mp4
node <cinematic-scroll-site>/scripts/encode.mjs poster act-1.mp4 public/media/poster-1.jpg   # repeat per act
```

Run `ffprobe` on each clip and record the real durations in `story.json`
(`template/story.json`). Act spans must come from real durations, not an
assumed 5.0 s.

## Phase 6. Build the Next.js app (no-Shopify path)

1. `npx create-next-app@latest` (App Router, TypeScript), `npm i gsap`.
2. Copy `scroll-video-engine.tsx` to `components/ScrollVideo.tsx` (add `'use client'`).
3. Copy `template/FiveActScroll.tsx` and `template/act-at.js` to `components/`, and `template/story.json` to the app root; fill titles, captions, durations, and poster paths from the approved prompts and the user's own copy.
4. Render `<FiveActScroll />` in `app/page.tsx`, then add the below-fold sections and one CTA.
5. Touch devices and reduced-motion users get the stacked poster layout (already in the template); say so to the user. Self-check for the act mapping: `node --test scripts/act-at.test.mjs`.

## Phase 7. Optional Shopify (only if chosen in Phase 1)

Follow `references/shopify-hydrogen.md`. Summary: Hydrogen is a developer
preview that works with Next.js. Run its setup in the same project, supply the
store domain and a server-only token, and let Hydrogen's bundled skills wire
the storefront. Keep the story as the homepage hero and put products below it.

## Phase 8. Verify before showing anyone

- Run the dev server; screenshot at the five act midpoints (progress 0.1, 0.3, 0.5, 0.7, 0.9) and confirm the right caption shows for each.
- Flick-scroll top to bottom and back: the video must keep up and captions must not stick.
- Check mobile emulation shows posters, not a frozen video.
- If Shopify: add to cart and reach a real checkout page.
- Scan copy for em dashes and stock words (`cinematic-scroll-site/scripts/copy-gate.mjs` on the built HTML or the copy in `story.json`).

## Common Mistakes

- Writing camera language for the user instead of asking only for the story, or the reverse: expecting them to know it.
- Different light or palette per act because the world line was not shared.
- Generating all five before testing act 1.
- Assuming each clip is exactly 5.0 s when mapping captions to scroll.
- Leaving the fixed scrub video visible below the story (the section needs `clip-path: inset(0)`).
- Putting the Shopify private token in a `NEXT_PUBLIC_` variable.
- Shipping the review or raw clips inside `public/`.
