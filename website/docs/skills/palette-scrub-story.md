---
title: Palette Scrub Story
description: Builds a scroll-driven brand story with one scrubbed video per act over a continuous background colour ramp, a text colour that flips light to dark, and a scrim solved against the worst footage pixel so copy stays readable. Vanilla JS template with an offline contrast sweep.
---

# palette-scrub-story

## Why It Exists

A creator walkthrough ("How I Build a $5,000 Website in Under 5 Minutes" by Zygis Stan) pastes one long prompt and six video clips into ChatGPT and gets back a matcha brand site that shifts from deep shade to open daylight as you scroll. The prompt was published, but the video does not explain how the result works, and the existing scroll skills here do not cover its distinctive parts: one video per act instead of one concatenated file, a page colour that is a function of scroll progress, and legible text over footage whose brightness changes.

The skill is built from inspecting the live site (HTML, CSS, JS, the six clips, and a scripted scroll in a browser), not from the prompt alone. `references/observed-koen.md` holds the measurements and where the shipped page differs from its own brief.

## What It Does

Six phases: inputs, prompt and palette adaptation, cost-gated clip generation, encode, build, verify.

The subject, a product or a service, is the only required input. The skill proposes six acts from a role arc (origin, human touch, the turn, method, product in use, payoff) rather than reusing the matcha scenes, writes a `subject.json` with a world line, a reference-image prompt and the act scenes, and `scripts/assemble-prompts.mjs` appends one shared suffix to every clip and rejects malformed packs. Services get filmable before-and-after scenes built around one recurring stand-in object. `references/prompt-templates.md` has the arc, the rules and a worked bicycle-shop example.

The palette is derived from the same subject and designed next, in `story.json`: colour stops, where each sits on the scroll, the two text colours, when the text flips, and when each act's text is visible. `scripts/sweep-contrast.mjs` then grades every scroll position where text is on screen. It fails when text would pass through mid-grey or when the scrim needed to rescue it is above 0.85 alpha, which would hide the footage.

The engine (`template/scrub.js` and `template/palette.js`, about 200 lines of vanilla JS) computes act and local progress from the scroll position of one tall section with a sticky stage. From those it sets the page and `theme-color` colours, the text colour, a black or white scrim solved against the worst possible footage pixel, the single visible text beat, and each video's `currentTime` (eased, written only inside `requestAnimationFrame`, skipped while a seek is pending). Touch devices loop the clips and gate text with an `IntersectionObserver`; reduced motion shows the first frame and still colour-shifts.

Encoding is the part the reference site skipped. Its clips have one keyframe each, so every seek decodes from the start. Re-encoding with `-g 6` (via `cinematic-scroll-site/scripts/encode.mjs hero`) gave 21 keyframes per clip.

## How To Use It

Triggers on: "background colour changes as you scroll", "shade to daylight", "dark to light scroll story", "six act scroll site", "one video per act", "scroll video with colour shift", or "make the text readable over scrubbing video".

```sh
skills add -g catesandrew/skills --skill skills/palette-scrub-story
```

```sh
npm install @catesworks/skill-palette-scrub-story
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

It reuses `cinematic-scroll-site` (provider notes, encode script, copy gate) and `product-reveal-prompts` for act and prompt writing, so install those too.

## Gotchas & Invariants

- Text against the bare page colour reaches 1.04:1 mid-ramp in the reference. Legibility comes from the scrim, so the sweep must stay green.
- No beat may be visible while the text colour crosses grey. In the reference the crossing is around progress 0.68 to 0.72 and the first beat after it starts at 0.717.
- Full-bleed footage hides the colour ramp. The reference's brief asked for 92% width so the ramp would show; the shipped page did not do that.
- The template was browser-checked on desktop only; the mobile and reduced-motion paths are untested.
- Browsers may restore the previous scroll position on reload, so scroll to 0 before sampling.

## Related Skills

- [cinematic-scroll-site](/docs/skills/cinematic-scroll-site): single-hero or chained-journey static sites; supplies provider notes and encode scripts.
- [five-act-scroll-story](/docs/skills/five-act-scroll-story): five clips concatenated into one file, in Next.js.
- [scroll-video-site](/docs/skills/scroll-video-site): single-file scrub engine with GSAP and Lenis.

---

_Sourced from: skills/palette-scrub-story/SKILL.md, skills/palette-scrub-story/metadata.json, skills/palette-scrub-story/references/_
