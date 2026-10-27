---
title: Before After Hero Video
description: Builds an animated website hero from a before/after reveal of a real-world scene, such as a roof descending onto a bare house. Two matching AI stills become one short start/end-frame video that the site scrubs as its hero. Includes the Higgsfield and Seedance settings and the prompts that worked.
---

# before-after-hero-video

## Why It Exists

A hero that shows the change a service delivers (a bare house getting its roof) is stronger than a stock photo, but it needs a video that travels between two states of one scene. If the two stills are generated independently, the camera angle, light and landscape drift, and the video morphs instead of transitioning. The skill fixes the order of operations so the two frames match before any video credits are spent. It was derived from a creator walkthrough that built a roofing-company site this way.

## What It Does

It reduces the request to a before state, an after state, one setting and one motion, then gives copy-paste prompts for each step:

- **Start frame:** a fresh photorealistic still of the scene in its "before" state (roof missing, bare trusses exposed), in warm late-afternoon light.
- **End frame:** generated from the start frame as an attached reference, with a prompt that opens "The exact same aerial three-quarter view of the same…" and adds the "after" state with identical light and framing.
- **Video:** both stills go into a start/end-frame video model, with a motion prompt where the object descends slowly and locks into place "like a lid closing", static camera, no shake.
- **Site:** a brief that leaves a slot for the hero animation, then a scroll-scrubbed hero that plays as the visitor scrolls and holds when they stop.

Settings from the walkthrough:

| Step | Tool | Settings |
|---|---|---|
| Stills | Higgsfield, GPT Image 2 | 16:9, High quality, 2K, other options Auto |
| Video | higgsfield.ai, Seedance 2.0 Mini | 6s, 16:9, 720p, about 15 credits |

Higgsfield marks Seedance 2.0 Mini as not available in the US. The skill tells the agent to pick Seedance 2.0, 2.0 Fast, 2.5 or another start/end-frame model there.

## How To Use It

Triggers on: "start and end frame hero", "before and after hero video", "roof coming down animation", "build the hero from two photos", "Higgsfield GPT Image 2 then Seedance", or an animated hero for a local service business.

```sh
skills add -g catesandrew/skills --skill skills/before-after-hero-video
```

```sh
npm install @catesworks/skill-before-after-hero-video
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

Input: `subject`, the business or scene (for example "family-owned roofing company, Denver"). The skill infers the rest and does not interview.

## Gotchas & Invariants

- Generate the end frame from the start frame, not from scratch. Otherwise framing drifts and the video morphs.
- Flip between the two stills before generating video. Re-rolling a still is cheaper than re-rolling a clip.
- Keep the camera static, or a slight top-to-bottom tilt. A moving camera breaks the lock-in feel.
- Seedance 2.0 Mini is not available on US accounts.
- The site brief tells the agent to research premium 2026 examples first and to self-review for anything broken, misaligned or cheap before finishing.

## Related Skills

- [product-reveal-prompts](/docs/skills/product-reveal-prompts): the same start/end-frame idea for products on a flat background (exploded and burst styles).
- [cinematic-scroll-site](/docs/skills/cinematic-scroll-site): the end-to-end pipeline that generates, encodes and publishes the hero video.
- [pinned-video-blob-scrub](/docs/skills/pinned-video-blob-scrub): the GSAP scroll-scrub mechanics for the hero clip.

---

_Sourced from: skills/before-after-hero-video/SKILL.md, skills/before-after-hero-video/metadata.json_
