---
name: before-after-hero-video
description: >-
  Use when the user wants an animated website hero built from a before/after
  reveal of a real-world scene, for example a roof descending onto a bare house,
  a building finishing, a room being furnished, a landscape completing. Two AI
  stills (start and end frame) become one short video that is scrubbed or played
  as the hero. Triggers on "start and end frame hero", "before and after hero
  video", "roof coming down animation", "build the hero from two photos",
  "Higgsfield GPT Image 2 then Seedance", or "animated hero for a local
  service business". Not for product exploded/burst shots on a flat background
  (use product-reveal-prompts) or the full multi-clip pipeline (use
  cinematic-scroll-site).
---

# before-after-hero-video

Two stills, one video. The start frame is the scene before (bare trusses), the
end frame is the same scene after (finished roof), a video model animates the
transition, and the site uses that clip as the hero. Observed from a creator
walkthrough that built a roofing site this way.

## 1. Fill the scene (one line each, infer, do not interview)

- `${input:subject}`: the business or scene, e.g. "family-owned roofing company, Denver".
- **Before state / after state**: the single change that carries the story (roof missing -> roof on).
- **Setting**: one photorealistic location with warm light. Same camera angle and framing for both frames.
- **Motion**: one object arrives or settles, slow and weighty, static camera.

## 2. Generate the two stills (Higgsfield, GPT Image 2)

Settings used: model `GPT Image 2`, aspect `16:9`, quality `High`, resolution `2K`, the rest `Auto`.

**Start frame** (fresh generation):
"Aerial three-quarter view of [SCENE] [SETTING DETAILS]. [BEFORE STATE, e.g. roof completely missing, bare wooden trusses exposed]. [LIGHT, e.g. late afternoon golden light through the pines, soft mist, mountains in the distance]. Photorealistic architectural photography, cinematic, warm grade."

**End frame**: attach the start frame as a reference image, then:
"The exact same aerial three-quarter view of the same [SCENE]. Now with [AFTER STATE, e.g. a flawless new dark charcoal architectural shingle roof, crisp ridge lines, clean flashing]. Same light, same mist, same mountains, identical camera angle and framing. Photorealistic architectural photography, sharp detail, cinematic, warm color grade."

Never generate the end frame from scratch: framing drifts and the video morphs
instead of transitioning. Reject any pair that does not line up when flipped
between.

## 3. Generate the video (higgsfield.ai, Video, Create Video)

Download both stills, upload them as the start and end frames, then:

- Model `Seedance 2.0 Mini` (cheap; about 15 credits for 6s at 720p). Higgsfield flags it as **not available in the US**: pick Seedance 2.0 / 2.0 Fast, Seedance 2.5 or another start/end-frame model there.
- Duration `6s`, aspect `16:9`, resolution `720p`.

**Motion prompt:**
"The complete [OBJECT, e.g. roof] descends slowly from above and settles precisely onto the [BEFORE STRUCTURE, e.g. bare wooden trusses], locking into place as one solid piece. Slow, weighty, cinematic, like a lid closing. [CAMERA: static, or a slight top-to-bottom move on the wide aerial]. [LIGHT and ambient motion, e.g. warm golden light through pines, drifting mist]. Smooth deliberate motion, no shake."

## 4. Build the site

Give the site agent the brief plus: "leave a spot for the hero animation, I will add it later". Then drop in the clip and ask for a scroll-scrubbed hero (roof descends as the visitor scrolls, pauses when they stop, stays as the background). For the scrub mechanics use `pinned-video-blob-scrub`; for encode and publish use `cinematic-scroll-site`.

Brief that worked (swap the business): single page, hero with trust signals and one CTA, services, why choose us, stats counters, testimonials, final CTA, footer with service areas; research premium 2026 examples first; scroll-triggered fade/slide, hero parallax, hover states; premium and not template-like; mobile-first; finish by self-reviewing for anything broken, misaligned or cheap and listing remaining improvements.

## Common Mistakes

- End frame generated from scratch instead of from the start frame.
- Camera angle or light differs between frames: the clip jumps or morphs.
- Using Seedance 2.0 Mini from a US account (not available there).
- Moving camera in the motion prompt: breaks the lock-in feel; keep it static or a slight tilt.
- Generating the video before the stills match: re-rolling stills is cheaper than re-rolling video.
