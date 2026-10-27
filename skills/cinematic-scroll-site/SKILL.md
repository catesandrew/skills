---
name: cinematic-scroll-site
description: >-
  Use when the user asks for a website, landing page, one-page site, or
  hero-video site for any business, product, brand, place, or portfolio and
  wants a cinematic scroll-driven result: an AI-generated hero video (or
  chained journey of videos) that scrubs as the visitor scrolls, designed
  from a written design package and shipped as a static site. Triggers on
  "build me a website for X", "cinematic scroll site", "scroll-driven hero
  video", "scrolling website with AI video", "Higgsfield hero", or "10K
  websites" style requests. Orchestrates the whole pipeline (tier choice,
  storyboard, image and video generation with cost gates, ffmpeg encode,
  build, copy review, publish); the scrub engine itself lives in
  scroll-video-site.
---

# cinematic-scroll-site

You are the designer, director, and engineer. The user is the taste: they
came to have a site made, not to learn to code. Handle the technical side
silently, keep every question to plain words, and never spend credits
without a gate. The bar: it should look like it cost thousands of dollars.

## Companion skills (use them, do not reimplement)

| Need | Use |
|---|---|
| Scrub engine (damped playhead, seek coalescing, Lenis + GSAP, iOS quirks) | `scroll-video-site` and its `references/scroll-video-engine.*` |
| Any video or image encode, concat, frame extract, contact sheet, platform check | `ffmpeg-skill` (probe, `look.py`, `check.py`); the few commands this pipeline needs are in `references/ffmpeg-recipes.md` |
| GSAP-only pages (Webflow, plain HTML) with a pinned, Blob-preloaded scrub and a stills fallback | `pinned-video-blob-scrub` |
| One-section-per-wheel glide and 3D tilt panels | `lenis-section-snap-tilt` |
| Lightest scroll polish (smooth scroll, fade-up reveals, no library) | `css-fade-up-reveal` |
| Animated titles or captions over footage (optional extra) | `remotion-ffmpeg-skill` |
| Fonts, layout, and color that do not look AI-made | any installed design skill (for example `modern-web-guidance`) |

If a companion is not installed, say so and fall back to the inline recipe.

## Bundled tools

- `scripts/setup.sh`: Phase 1 scan, prints ✓/✗ per tool, installs nothing.
- `scripts/encode.mjs`: `hero | poster | last | concat` encodes (`--dry-run` prints the command).
- `scripts/copy-gate.mjs <index.html>`: the Phase 9 copy gate, exits 1 on any hit.
- `template/index.html` + `template/scrub.js`: starter page with the vanilla scrub engine, band map, loading ring, and poster layout for touch and reduced motion. Copy into the project's deploy folder and fill the `{{placeholders}}` from the design package.
- Self-checks: `node --test scripts/*.test.mjs`.

## Phase 1. Setup scan (first message, before any questions)

Run `scripts/setup.sh`, then report a short ✓/✗ checklist with the plan for each ✗:

1. Image and video generation tools available (Higgsfield MCP by default)?
2. `ffmpeg` and `ffprobe` run? (`brew install ffmpeg` / `winget install ffmpeg`)
3. Node.js installed (`node --version`) for the local preview server?
4. `ffmpeg-skill` installed?

Install the automatic ones after one yes. The generation connector is the one
manual step: the user creates a free account and adds the connector URL as a
custom connector; give exact clicks, then verify the tools appear. Do not
raise hosting or domains in this phase.

## Phase 2. Intake

Ask in one short message: what is it (business, product, idea), any existing
assets (logo, photos, copy), any reference sites they love, and anything to
avoid. "Surprise me" is a valid answer: invent a coherent brand and say so.

## Phase 3. Pick the tier (tell the user what each costs)

- **Tier 1, one hero (about 6-8 s of scroll):** one starting frame, one video.
  Cheapest, the default.
- **Tier 2, chained journey (15-20 s):** several segments, each starting from
  the last frame of the previous one, joined into one long scrub.
- **Tier 3, Tier 2 plus a richer below-fold** (extra bands, vector layer,
  more stills).

Tier 1 skips the full design loop but still writes a trimmed design package.

## Phase 4. Concepts

Propose two or three hero concepts that obey `references/prompt-laws.md`. For
each: one plain sentence of what the visitor sees while scrolling and the
final resting frame. Recommend one. Add one honest line: phones see a
designed still image instead of the scrubbing video; laptops and desktops get
the video.

## Phase 5. Creative Director's Loop (Tier 2 and 3; trimmed for Tier 1)

Decide and write down, in this order: producer numbers (tier, segment count,
total credits, mobile decision), brand premise, palette tokens (never pure
black or white as the canvas), type trio, one signature element, the band map
(which copy sits over which scroll range), every line of copy, below-fold
outline, vector layer plan. The single deliverable is the design package,
written to the template in `references/design-package.md`. Get one yes on the
storyboard before any credits move; it is the cheapest gate in the pipeline.

## Phase 6. Generate

Read `references/prompt-laws.md` first. Then, per segment:

1. **Preflight and say the price** of the starting frame (`get_cost: true` is
   free). Give the road ahead in one line.
2. **Starting frame** (about 2 credits): 16:9, 2k, frame one of the motion,
   in the brand's world, no text, no logos. A real product photo can replace it.
3. **Inspect the image yourself** for invented trademarks, broken anatomy,
   and composition before animating. Then show the user.
4. **Model choice**: preflight the same planned video on the top two or three
   models, present real prices and credits remaining, recommend one, let the
   user pick. Fold the supporting stills into the same total.
5. **Video**: image-to-video from the approved frame, using the prompt
   templates in `prompt-laws.md`.
6. **Video gate (never skip, every segment):** save the clip to a review
   folder outside the deploy folder, have the user watch it, re-roll cheaply
   if it fails. Chained segments take the final frame of the approved clip as
   the next start (see the chaining recipe).
7. **Supporting stills** (2-4 small images) in the same world.

Renders take minutes. Say so, then use the wait to scaffold the page. A job
that reports progress is fine; a call that hangs with no response is a stall:
stop and retry once, then report.

## Phase 7. Encode

No credits spent. Use `scripts/encode.mjs` and follow `references/ffmpeg-recipes.md`: all-intra or
short-GOP scrub encode, poster and ending frame, one compression pass for
web stills, concat for chained segments. Raw and review files stay OUT of the
deploy folder.

## Phase 8. Build

Open by consuming the design package: copy ships verbatim, never paraphrased.
Start from `template/`. Architecture: one `index.html` plus an `assets/` folder, plain HTML, CSS and
vanilla JS unless the user's project is already React (then use the
`scroll-video-site` TSX engine). No build step for the default path, so a
double-click preview and a drag-and-drop host both work.

Hero: use the engine and gotchas from `scroll-video-site` (fetch the video
as a Blob behind an honest loading ring when large, damped playhead,
seek coalescing, poster fallback on touch devices and reduced motion). Below
the fold: the outline from the package, one fixed background environment
layer, the accent color in rare doses.

## Phase 9. Verify (adversarial, before showing anyone)

- Screenshot the page; exercise every button and the form.
- Scrub at top, middle, and bottom; flick-scroll fast and confirm the band
  map still lands (the flick test validates the band ranges).
- Audit each band's worst-frame legibility.
- Run `ffmpeg-skill` `look.py` on the encoded hero to inspect frames.
- **Copy gate (mandatory):** run `node scripts/copy-gate.mjs index.html`, which greps `index.html` for em dashes and for the stock
  words leverage, seamless, empower, unlock, robust, actionable, data-driven,
  solutions. Rewrite every hit in plain friend-voice and re-grep until both
  return zero. Cover the whole file, especially lower sections (proof, FAQ,
  testimonials, CTA, form microcopy), where drift lands.

Then invite the user to look through the whole site and say, in their own
words, what to change. Take feedback in rounds.

## Phase 10. Publish (only when the user says they are ready)

The site is a static folder, so any static host works. Default suggestion:
Netlify drag-and-drop of the folder (free, no build). Settle the address
first (free subdomain or a domain they own), update the og tags with the
live URL, zip or drop the CONTENTS of the project folder, then verify the
live site yourself and have the user test on desktop and on their phone over
a real network. Chrome shows scroll choppiness first; check the hero's top
and bottom there.

## Common Mistakes

- Generating video before the starting frame is approved: a 2-credit fix
  becomes a 50-credit one.
- Skipping the per-segment video gate on chained journeys.
- Paraphrasing authored copy during the build.
- Shipping the raw or review folder inside the deploy folder.
- Letting an image model invent real brand logos in the frame.
- Seeking on every scroll tick instead of the damped, coalesced engine.
- Asking about hosting before the user has approved the site.
