---
name: layered-neural-hero
description: Use when the user wants a premium dark-mode landing-page hero in Next.js with a layered background (looping video, interactive neural-network canvas, grain overlay), a glassmorphic waitlist form and a pulsing call-to-action. Triggers on "premium hero", "neural network hero", "particle hero", "constellation background", "waitlist hero", "glassmorphism hero".
---

# layered-neural-hero

Builds a `Hero.tsx` and a `NeuralCanvas.tsx` for a Next.js (App Router) landing page with Tailwind CSS and Framer Motion. The hero stacks four layers, the canvas reacts to the cursor, and the whole thing stays light on mobile.

## 1. Gather inputs

Infer what you can from the repo (brand name, Tailwind theme, existing accent color) and ask only for what is missing. At most one question.

| Param | Description | Default |
|---|---|---|
| `${input:brand_name}` | Product or brand name, used in copy and the badge | from `package.json` or the README |
| `${input:accent_color}` | Primary accent for glow, underline and button | the Tailwind theme's primary |
| `${input:base_color}` | Dark base for the video overlay | `#0a1628` |
| `${input:headline}` | Main heading, with the phrase to underline marked | write one from the product |
| `${input:video_src}` | Background loop and its poster image | a placeholder path, flagged in the reply |
| `${input:cta_label}` | Submit button text | `Join the waitlist` |

## 2. Build the hero

Follow [references/hero-prompt.md](references/hero-prompt.md). Output one `Hero.tsx`. The layers, bottom to top:

1. Background video, `object-cover`, about `opacity-15`, under a 70% `${input:base_color}` overlay.
2. `NeuralCanvas`, loaded with `dynamic(..., { ssr: false })`.
3. SVG fractal-noise texture, `pointer-events-none`, about `opacity-30`.
4. Content at `z-10`: glass badge, gradient-underline heading, paragraph, glass waitlist form with a pulsing button.

## 3. Build the canvas

Follow [references/neural-canvas-prompt.md](references/neural-canvas-prompt.md). Output one `NeuralCanvas.tsx`: drifting nodes, proximity lines, light pulses along the lines, and cursor repulsion. Use 35 nodes below 768px width and 100 above.

## 4. Verify before saying done

- The project builds and type-checks, and the page renders without a hydration warning.
- Video is `muted`, `playsInline`, `loop`, has a `poster`, and autoplays.
- On a narrow viewport there is no layout shift and no flicker while scrolling.
- With `prefers-reduced-motion: reduce`, the canvas is static or off and the entrance animations are plain fades.
- Cursor repulsion works with the content layer on top (see the first mistake below).
- The heading and paragraph stay readable over the video.

## Common Mistakes

- Attaching the pointer listener to the canvas. The content layer sits above it, so the canvas never receives the events. Listen on the section or on `window` and convert to canvas coordinates.
- Large `y` translations or heavy entrance animation on mobile. They cause layout shift and flicker. Use opacity fades or `scale` from 0.98 to 1.
- Importing `NeuralCanvas` normally. It touches `window` and `devicePixelRatio`, so it must be dynamic with `ssr: false`.
- Ignoring `devicePixelRatio`. The canvas looks blurry on retina screens. Scale the backing store and the context.
- Not cancelling `requestAnimationFrame` and the resize and pointer listeners on unmount. This leaks loops on route changes.
- Skipping `prefers-reduced-motion`. A constantly moving background is an accessibility problem.
- Leaving a brand name, color or video path from an example in the output. Fill every input or flag the placeholder.
- A tall, bright video. At `opacity-15` it should read as texture, not content. Check text contrast on the real page.
