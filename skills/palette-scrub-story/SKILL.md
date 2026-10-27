---
name: palette-scrub-story
description: >-
  Use when the user wants a scroll-driven brand story where the whole page
  changes colour as the visitor scrolls: one short video per act, each scrubbed
  by scroll position, over a continuous background ramp (for example deep
  shade to open daylight), with text that flips light to dark and stays
  readable over any footage. Triggers on "background colour changes as you
  scroll", "shade to daylight", "dark to light scroll story", "six act scroll
  site", "one video per act", "scroll video with colour shift", "build a site
  like the KOEN matcha demo", or "make the text readable over scrubbing video".
  Not for a single hero clip (use cinematic-scroll-site) or one concatenated
  video (use five-act-scroll-story).
---

# palette-scrub-story

Six pinned acts, each its own `<video>` scrubbed by scroll, on a page whose
background and text colour are computed from total scroll progress. A scrim
solved against the worst possible footage pixel is what keeps the text legible.
Vanilla JS, no GSAP. Reverse-engineered from a live site; measurements are in
`references/observed-koen.md`.

## Companion skills (reuse, do not reimplement)

| Need | Use |
|---|---|
| Shot-prompt vocabulary and guardrail phrases | `five-act-scroll-story/references/cinematic-vocabulary.md` |
| Provider choice, cost gate, capability checklist | `cinematic-scroll-site/references/providers.md` |
| Scrub-friendly re-encode and posters | `cinematic-scroll-site/scripts/encode.mjs` (`hero`, `poster`) |
| Copy and em-dash gate | `cinematic-scroll-site/scripts/copy-gate.mjs` |

If a companion is missing, say so and use the inline recipe in this file.

## What is different from the other scroll skills

| | This skill | `five-act-scroll-story` | `cinematic-scroll-site` |
|---|---|---|---|
| Video files | one per act, crossfaded | concatenated into one | one hero or chained |
| Page colour | continuous ramp across all acts | static | static |
| Text legibility | solved scrim plus colour flip | per-act captions | design-package rules |

## Phase 1. Inputs (ask once, in one message)

1. The **subject**: any product, service, place or brand, plus its real facts
   (names, figures, claims) and any images. This is the one required input.
2. The six acts. If the user gives none, **propose them yourself** from the
   subject using the role arc in `references/prompt-templates.md` (origin,
   human touch, the turn, method, product in use, payoff), for products and for
   services alike. Show them as one line each and let the user overwrite any.
   Do not ask for camera language.
3. Palette direction: dark to light (default), or light to dark. One saturated
   stop is allowed, placed at the **turn** act (act 3 in the reference).

## Phase 2. Adapt the prompts and design the palette to the subject

Read `references/prompt-templates.md`. From the subject alone, write
`subject.json`: one **world line**, one **reference image** prompt, six act
scenes (text-to-video for acts 1 to 3, image-to-video from the reference for
acts 4 to 6), and a fallback for the riskiest act. Services get filmable
before-and-after scenes with one recurring stand-in object, never UI or
logos. Then:

```sh
node scripts/assemble-prompts.mjs subject.json prompts.md
```

This appends the same suffix to every clip and fails on a malformed pack.
Show the user a table (their words | scene | role) and get approval before any
credits are spent. Never invent facts for the beat copy; use only what the user gave.

Next derive the palette from the same subject (rules in the reference), edit `story.json` (copy `template/story.json`):

- `palette`: 5 to 7 hex stops, first = opening mood, last = the colour the rest of the page uses.
- `knots`: where each stop sits in 0..1 (omit for even spacing). The reference
  front-loads dark stops so the turn lands near progress 0.48.
- `text.light`, `text.dark`: the two text colours. `crossAct`: the act index
  where the flip starts (reference: 4). `crossSpan`: acts it takes (0.75).
- `acts[i].beat`: `[start, end]` as a fraction of that act's scroll when its
  text is visible.

Then **run the gate**:

```sh
node scripts/sweep-contrast.mjs story.json
node --test scripts/palette.test.mjs
```

The sweep grades only positions where a beat is on screen. It fails when text
would sit mid-grey (no scrim can fix that) or needs a scrim above 0.85 alpha
(footage effectively hidden). Fix by moving `crossAct`/`crossSpan` or the beat
windows so no text is up while the text colour crosses grey. In the reference
the text is mid-grey around progress 0.68-0.72 and no beat starts until 0.717.

## Phase 3. Generate the clips (cost gated)

Follow `cinematic-scroll-site/references/providers.md`: price one clip, state
the price of six, get one yes. Rules specific to scrubbed, per-act clips:

- Use the prompts from `prompts.md`: the suffix is already applied, including
  "locked camera, constant speed throughout with no easing at the start or end,
  no cuts". Scrubbing exposes easing, so ask for none. Do not edit the suffix per clip.
- 5 s, 16:9, audio off. Set `resolution` in `subject.json` to what the chosen model can actually output.
- Generate the reference image first, then the riskiest clip (marked `risky`; the reference's stone mill) and use its fallback if it fails.
- The saturated stop in `palette` should match the most saturated footage.
- Each clip goes to a review folder outside the app; the user approves it before encoding.

## Phase 4. Encode (this matters for scrubbing)

Source clips usually have **one keyframe**: every seek decodes from the start.
The reference site ships that way and leans on smoothing to hide it. Re-encode each clip:

```sh
node <cinematic-scroll-site>/scripts/encode.mjs hero act-1.mp4 assets/shade.mp4   # -g 6, no audio, faststart
node <cinematic-scroll-site>/scripts/encode.mjs poster assets/shade.mp4 assets/shade.jpg
```

Keep the six files separate. Run `ffprobe` and check keyframes with
`ffprobe -v error -select_streams v:0 -skip_frame nokey -show_entries frame=pts_time -of csv=p=0 f.mp4 | wc -l`
(expect about duration x fps / 6, not 1).

## Phase 5. Build

**Build model.** The reference build used GPT-6 Astra in ChatGPT at **medium**
reasoning, working as an autonomous agent from one long, precise prompt; the
author's point is that a strong model plus detailed instructions beats "build me
a website". Astra's default reasoning level is low, so set medium or higher. In
Codex: `codex exec -m gpt-6-astra -c model_reasoning_effort=medium "<task>"`
(check `codex debug models` or your model picker for the exact id). This skill's
template does most of the work, so another strong agent is fine; whichever model
builds it, the Phase 6 checks decide whether it passed.

1. Copy `template/` (`index.html`, `story.css`, `scrub.js`, `palette.js`,
   `package.json`, `story.json`) into the project. It is plain static files: serve with any static server.
2. In `index.html`, replace the six beat placeholders with the user's copy and
   keep `data-act` in act order. The brand-name beat and the call-to-action beat are the only special cases.
3. `story.json` drives video `src`, poster, palette, timing and story height.
   Add or remove acts by editing it and the matching `<video>` and `.beat` elements.
4. Part 2 (below the story) uses the **last palette stop** as its background and
   `text.dark` as its text, so the unpin is seamless. The engine fades the last
   frame into that colour and fades the stage's overlays out; the sticky header
   appears only after the story ends.
5. Engine behaviour you can rely on: videos seek only inside `requestAnimationFrame`,
   smoothed toward the target time and skipped while a seek is pending; the
   page, `theme-color` meta, scrim and beat all update from one `render()`;
   mobile and touch use looping muted clips with an `IntersectionObserver`
   gate on text; reduced motion shows the first frame, still colour-shifts, and uses opacity-only transitions.
6. Optional extras seen in the reference and left out of the template: a
   velocity blur on the footage (up to 4 px), a slow camera push (scale 1.14 to
   1.24), an opening title over a looping first clip, and a dialog for a "find us" CTA.

## Phase 6. Verify before showing anyone

Run in the browser (scroll with `behavior: 'instant'`; the page may restore the
previous scroll position on reload, so scroll to 0 first) at progress
`0, .08, .25, .42, .6, .75, .92, 1` and tabulate: active act, `currentTime`,
page background, text colour, visible beat, scrim colour. Expect:

- act index = floor(progress x acts); `currentTime` is about local progress x clip length;
- background moves monotonically from the first to the last stop with no jumps;
- exactly one beat visible, and none inside the grey crossover;
- the header is hidden until progress 1, then shown.

Then screenshot each beat, flick-scroll top to bottom and back, and check
mobile emulation and `prefers-reduced-motion`. Run `copy-gate.mjs` on the copy.

## Common mistakes

- **Trusting the colour ramp for contrast.** Text against the bare page colour
  drops to 1.04:1 mid-ramp in the reference. Legibility comes from the scrim; keep the sweep green.
- **A beat window over the grey crossover.** The scrim goes to near-opaque and hides the footage.
- **Full-bleed footage plus a "visible background" requirement.** If the clips fill the
  screen, the ramp only shows through the scrim, the tint and the last-frame wash. If the ramp must be seen, inset the frame (the original brief asked for 92% width) and accept a smaller image.
- **Reusing matcha scenes for another subject.** Keep the arc's roles, not its content; a clip prompt that still mentions leaves or a whisk will drift into the wrong story.
- **Inventing beat copy.** Stockist counts, awards and figures come from the user, never from the example.
- **Easing in the generated clips.** It shows up as the scrub speeding up and slowing down against the user's scroll.
- **Concatenating the clips.** That defeats per-act crossfades and per-act timing. Use `five-act-scroll-story` if one file is what is wanted.
- **Seeking on every scroll event.** Seek in `requestAnimationFrame` and skip while `video.seeking`.
- **Shipping the source clips unchanged.** One keyframe per clip makes every seek expensive.
- **Verifying only desktop.** The mobile path (loops plus `IntersectionObserver`) and the reduced-motion path are separate code; the template was browser-checked on desktop only.
