# Observed: the KOEN scroll-story demo

Facts from inspecting one live page (a static Netlify site made from a single
long prompt) and its downloaded assets, October 2026. Nothing here is a
standard; it is the evidence the skill was built from.

## Structure

- No framework, no GSAP. `index.html` (7.8 KB), `style.css` (13 KB), `app.js` (8.9 KB).
- `.story` is `1300vh` tall (`840vh` on narrow or touch screens). One `position: sticky; 100svh` `.stage` holds six stacked `<video>` elements, a `.film-shade` overlay, a beat layer and a progress line.
- Scroll maths: `total = scrollY / (storyHeight - stageHeight)`, `act = floor(total x 6)`, `local = total x 6 - act`.

## Per-frame state (all derived from `total`)

| State | How |
|---|---|
| Page and `theme-color` | piecewise-linear mix of 7 stops at knots `[0, .19, .335, .48, .62, .8, 1]` |
| Text colour | `#F4F7F0` to `#12200F`, eased over 0.75 acts starting at act 5 |
| Scrim | black or white overlay, alpha raised in 0.005 steps until text clears 4.6:1 against the worst pixel (white under black, black under white), plus 0.015 |
| Scrim opacity | 1 while a beat or the opening title is visible, 0.16 otherwise |
| Beat | windows `[.25,.75] [.25,.75] [.2,.6] [.5,1] [.3,.8] [.5,1]`; the last act stays on |
| Video time | `target = local x (duration - 0.04)`, eased with `1 - exp(-dt/90)`, written only if off by more than 18 ms and not already seeking |
| Last frame | opacity `1 - ease((local - .82)/.18)` so it washes into the page colour before the stage releases |

## Measurements (live page, 1436 x 1238 viewport)

| Progress | Act | Clip time | Background | Text | Beat |
|---|---|---|---|---|---|
| 0.08 | 1 | 3.01 s | 17,32,22 | 244,247,240 | Grown in shade for twenty days. |
| 0.25 | 2 | 2.48 s | 26,54,32 | 244,247,240 | Only the youngest leaves. |
| 0.42 | 3 | 2.58 s | 56,122,53 | 244,247,240 | Stone-ground. One hour for thirty grams. |
| 0.60 | 4 | n/a | 119,186,94 | white | KOEN |
| 0.75 | 5 | 2.48 s | 180,212,149 | 26,40,23 | Whisked, not shaken. |
| 1.00 | 6 | 4.98 s | 244,247,240 | 18,32,15 | call to action; header shown |

Scrim at 0.08 and 0.60 was `rgba(0,0,0,.58)`; at 0.75 it was `rgba(255,255,255,.565)`.

## Clips

Six H.264 files, 1280 x 720, 24 fps, 121 frames, 5.04 s, no audio, 1.6 to 5.1 MB each. Each has **one keyframe** (`ffprobe -skip_frame nokey`), so every seek decodes from the start of the clip. Re-encoding the same files with `-g 6` gave 21 keyframes each, and the template scrubbed them correctly.

## Where the shipped page differs from its brief

- Brief: text vs background never below 4.5:1. Measured bare text-vs-page contrast reaches 1.04:1 at progress 0.68. The brief is met only through the scrim.
- Brief: video at 92% width with the background visible around it. Shipped CSS makes the footage full-bleed, so the ramp shows only through a 9% colour tint, the scrim and the final wash.
- Brief: six acts of about 200vh (1200vh). Shipped: 1300vh.
- Added by the model, not in the brief: an opening title over a looping first clip, a "find us" dialog with sample cafes, velocity blur, a camera push.

## What this skill changed

- Config-driven: palette, knots, text flip, beat windows and acts live in `story.json`.
- The contrast claim is checkable offline: `scripts/sweep-contrast.mjs` grades only on-screen text positions and fails on mid-grey text or a near-opaque scrim. For the reference timing the strongest scrim while text is visible is 0.745 (at progress 0.718, as act 5 text appears).
- A template run against the same clips reproduced the reference backgrounds to within 1 RGB step, the scrim values exactly, and clip times to within 0.05 s for acts 2 to 6. Act 1 differs (live 3.01 s, template 2.37 s at progress 0.08) because the live page starts that clip's scrub where its opening loop stopped; the template has no opening loop.
