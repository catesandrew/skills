---
name: product-reveal-prompts
description: Use when the user gives a subject/product (e.g. "electric bike", "matcha drink") and wants a scroll-animated website built from an AI-generated start frame, end frame and transition video. Turns the subject alone into tool-agnostic prompts - start image, end image, video transition - and the final website prompt. Triggers on "start and end frame", "reveal animation", "scrollytelling product site", "exploded product shot", "impossible moment" scroll concepts.
---

# product-reveal-prompts

Input: a subject only. Output: copy-paste prompts for ANY image/video tool (Gemini/Nano Banana, Higgsfield, Kling, Midjourney, Google Flow...). Never call generation tools unless the user asks; never ask for info you can infer. Ask at most one question, only if the subject is ambiguous.

## 1. Decide, then state in one line each
- **Style**: `exploded` if mechanical/multi-part (e-bike, watch, headphones, engine, espresso machine); `burst` if a drink, food, cosmetic, or single-body object (matcha, sneaker, perfume).
- **Hero angle**: one 3/4 view, centered, full product in frame, portrait or landscape (default landscape 16:9). THE SAME ANGLE and framing is used for start and end so the transition is clean.
- **Background**: solid `#050505` (matches the site prompt). Identical in every image.
- Infer: product type, 4-6 key internal parts (exploded) or 3-4 flying elements + one energy effect (burst, e.g. ice cubes, liquid arc, petals, sparks).

## 2. Output these prompts (fill all blanks, no brackets left)

**A. Start frame** (fresh generation):
"Hyper-photorealistic studio product photo of [PRODUCT, specific details: colors, materials, finish], 3/4 view, centered, entire product visible with margin around it, resting on nothing, floating slightly. Solid flat #050505 background, no gradient, no floor, no shadow plate, no text. Soft high-contrast rim lighting. Razor sharp."

**B. End frame** (upload A as reference; instruction: "keep it consistent with the reference"):
- exploded: "Using the reference image, show the same [PRODUCT] as a deconstructed engineering shot: every sub-assembly detached and hovering along its assembly axis, showing [KEY INTERNAL PARTS] with fine machined textures. Same camera angle, same scale, same centered framing, same colors and materials, same solid #050505 background. Parts align logically (screws to threads, PCBs above standoffs). Overall silhouette still reads instantly as [PRODUCT]. Zero motion blur, no text, labels or overlays."
- burst: "Using the reference image, keep the [PRODUCT] exactly as is, intact, same shape, colors, proportions, angle and position. Add [ELEMENTS] suspended mid-air around it with [ENERGY EFFECT], frozen, zero motion blur, dramatic rim lighting catching the droplets/edges. Same solid #050505 background, no text."

**C. Video transition** (start frame = A, end frame = B):
"Smooth cinematic transition from the assembled [PRODUCT] to the [exploded / burst] final frame. Product centered, well lit, in slow mid-rotation. [exploded: parts separate steadily along their assembly axes / burst: [ELEMENTS] enter from behind and around the product, increasing in density]. Halfway, a subtle [ENERGY EFFECT] wraps partially around the product. Everything ultra-sharp, no motion blur, background stays pure solid #050505 with no gradients or effects. Camera static. Motion is smooth, deliberate, engineered, premium. Ends exactly on the end frame."

**C2. Tool-specific video settings** (same prompt text as C, different wrapper):
- **Google Flow** ("frames to video"): upload A as the start frame and B as the end frame, highest-quality Veo model (not "fast"), paste C. Download the upscaled version. Flow has no API/MCP, so this step is manual.
- **Kling** (start/end frame image-to-video): upload A as the first frame and B as the tail frame, 5s or 10s, paste C. Add a negative prompt: "motion blur, camera shake, text, watermark, background change, product distortion, extra objects". Scriptable via the `kling-cli` skill if installed.
- **Any other tool without an end-frame option**: generate from A only and describe the end state in words (use B's description as the final beat of C), then pick the closest frames.

**D. Website prompt**: fill the Antigravity scrollytelling prompt in the scrollytelling prompt file at `${input:site_prompt_path}` (or any Antigravity/Next.js scroll-canvas prompt) (section ANTIGRAVITY SYSTEM PROMPT): set the brand, OBJECT, FRAME_COUNT, and write beats A-D with real copy for this product.

## 3. Reliability checklist (print after the prompts)
1. Generate A; reject if product is cropped, tilted oddly, or the background isn't flat.
2. Generate B with A as reference; reject if framing/angle/colors drifted or the product is unrecognizable. Retry with "keep the product exactly as in the reference".
3. Compare A and B side by side: same position and scale or the video will jump.
4. Video tool needs start AND end frame support (Google Flow "frames to video", Kling start/end frame). Use the highest quality tier, download upscaled.
5. Cut to frames (ffmpeg or ezgif), ~25-30 fps, trim dead seconds, WebP into /public/sequence/, then run prompt D. For a plain-HTML canvas build with a frame budget, extraction script and fallbacks, use `frame-sequence-scrub-site` instead.

## 4. Other impossible moments
`exploded` and `burst` are two of seven. When the subject suits a different transformation, keep the same start-frame-then-reference-image method and swap the moment. Formula: one subject plus one impossible moment; change the subject, never the system.

| Moment | The transformation clip | Suits |
|---|---|---|
| Explosion | The product disassembles into floating parts and holds exploded. Scrubbed backward it is the reassembly. | Mechanical, multi-part (`exploded`) |
| Fly-through | One continuous dolly through a dark space that passes the exhibits, each caught in its own light. | Portfolio, gallery, architecture |
| Molten birth | A glowing stream coils into the finished object and cools from white heat to its final finish. | Jewelry, metalwork, craft |
| Frozen time | The liquid or splash is frozen while the camera orbits it; one clip lets time release for a breath, then refreezes. | Drinks, spirits, spills |
| Bloom | Growth under the scroll: a bud opens petal by petal, then the product appears from its heart. | Skincare, botanical, beauty |
| Descent | The subject sinks through depth; the page background and light darken in sync with progress. | Watches, dive gear, anything "rated for the dark" |
| Light reveal | Everything starts in darkness and a single beam reveals the object section by section. | Instruments, lacquer, luxury objects |

Pick the moment whose motion reads in both directions. One start frame, one transformation clip and one macro clip are enough; `frame-sequence-scrub-site` turns those clips into a canvas frame-scrub site, and the transformation clip played backward is a free reverse chapter.

## Inputs
| Param | Description | Default |
|---|---|---|
| `${input:subject}` | The product or subject | (required) |
| `${input:site_prompt_path}` | Path to the Antigravity scrollytelling website prompt | none; use a generic scroll-canvas prompt |

## Common Mistakes
- End frame generated from scratch instead of from the start image: the product and framing drift and the video morphs instead of transitioning.
- Using the exploded style on a drink or soft goods: the product is torn apart. Use `burst`.
- Background not identical across images: visible seams on the website.
- Using a "fast" video tier: noticeably worse motion for this effect.
