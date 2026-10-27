---
title: Product Reveal Prompts
description: Turns a subject such as a product or drink into copy-paste prompts for a start frame, a consistent end frame, and a start/end-frame video transition, plus the scrollytelling website prompt. Works with any image or video tool and never calls generation tools unless asked.
---

# product-reveal-prompts

## Why It Exists

A scroll-animated product reveal needs three assets that must match each other: a start image, an end image, and a video that travels between them. Generated independently, the product drifts in angle, scale, and color, and the video morphs instead of transitioning. The skill takes a subject alone and writes all of the prompts with the constraints already built in, so the user only copies and pastes.

## What It Does

It decides the style, hero angle, and background first, and states each in one line:

- **Style:** `exploded` for mechanical or multi-part products (e-bike, watch, headphones, espresso machine), `burst` for drinks, food, cosmetics, and single-body objects.
- **Hero angle:** one centered 3/4 view with the whole product in frame, the same for start and end so the transition is clean.
- **Background:** solid `#050505`, identical in every image.

It then outputs four prompts with every blank filled in:

- **A, start frame:** a fresh photorealistic studio shot.
- **B, end frame:** generated from A as a reference, either as a deconstructed engineering shot (`exploded`) or with suspended elements and one energy effect (`burst`).
- **C, video transition:** a smooth transition from A to B, with wrappers for Google Flow ("frames to video"), Kling (start and end frame), and tools without end-frame support.
- **D, website prompt:** the scrollytelling prompt with the brand, object, frame count, and real copy for four beats.

A reliability checklist follows: reject a cropped start frame, check that A and B match in position and scale, use a start-and-end-frame video tool at the highest tier, then cut to roughly 25 to 30 fps WebP frames in `/public/sequence/`.

## How To Use It

Triggers on: "start and end frame", "reveal animation", "scrollytelling product site", "exploded product shot", or a bare subject like "electric bike" or "matcha drink" when the goal is a scroll-animated site.

```sh
skills add -g catesandrew/skills --skill skills/product-reveal-prompts
```

```sh
npm install @catesworks/skill-product-reveal-prompts
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

Inputs: `subject` (required) and `site_prompt_path`, the path to the website prompt file. Without a path, it uses a generic scroll-canvas prompt.

## Gotchas & Invariants

- Generate the end frame from the start image, not from scratch. Otherwise the product and framing drift and the video morphs.
- Use `burst`, not `exploded`, for drinks and soft goods, or the product is torn apart.
- The background must be identical across every image, or the website shows seams.
- Use the highest video tier. The "fast" tier gives noticeably worse motion for this effect.
- It writes prompts only. It does not call generation tools unless asked, and it asks at most one question, only when the subject is ambiguous.
- Google Flow has no API or MCP, so that step is manual.

## Related Skills

- [five-act-scroll-story](/docs/skills/five-act-scroll-story): a five-clip, Next.js scroll story with generation behind a cost gate.
- [cinematic-scroll-site](/docs/skills/cinematic-scroll-site): the end-to-end pipeline that generates and encodes the hero video.
- [scroll-video-site](/docs/skills/scroll-video-site): the scroll-scrub engine for a video-driven landing page.

---

_Sourced from: skills/product-reveal-prompts/SKILL.md, skills/product-reveal-prompts/metadata.json_
