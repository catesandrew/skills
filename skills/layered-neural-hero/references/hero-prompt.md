# Hero prompt

Fill the `${input:...}` values from the inputs table in `SKILL.md`, then use this as the build brief for `Hero.tsx`.

> Build a highly premium, modern Hero section for a landing page using **Next.js (App Router), React, Tailwind CSS and Framer Motion**. The goal is a dark-mode, high-converting look that feels dynamic and alive but stays performant.
>
> ## 1. Base architecture (z-index layering)
>
> A `min-h-screen` container stacking four layers with absolute positioning:
>
> - **Layer 1 (z:1):** a background video loop, `object-cover`, very low opacity (about `opacity-15`), under a semi-transparent overlay of `${input:base_color}` at 70% so text stays readable.
> - **Layer 2 (z:2):** an interactive canvas component (the neural network, see `neural-canvas-prompt.md`) above the video and below the content.
> - **Layer 3 (z:3):** a static SVG fractal-noise texture, `pointer-events-none`, about `opacity-30`, for a grainy premium feel.
> - **Layer 4 (z:10):** the hero content (text, form, buttons), centered.
>
> ## 2. Content styling and typography
>
> - **Badge:** a pill above the heading with a glassmorphism effect (semi-transparent background, subtle border, backdrop blur) and a small icon such as `Sparkles` from `lucide-react`. Use `${input:brand_name}` in its text.
> - **Heading:** a massive, bold display face. One span inside the heading has an animated gradient underline: an `::after` pseudo-element that scales from `scaleX(0)` to `scaleX(1)` on load, left to right. Add a subtle `drop-shadow` in `${input:accent_color}`.
> - **Paragraph:** clean and legible (`text-lg` or `text-xl`), secondary text at about `text-white/70`, with keywords highlighted in `${input:accent_color}`.
>
> ## 3. Conversion mechanism
>
> - **Waitlist form:** an inline email input plus submit button inside a glassmorphic container (`bg-white/[0.06]`, `backdrop-blur-md`, subtle border, and a soft glow such as `shadow-[0_8px_40px_-12px_<accent>]`).
> - **Button:** solid `${input:accent_color}` with a continuous pulse-glow, a custom `@keyframes` that animates `box-shadow` size and opacity. Label it `${input:cta_label}`. An arrow icon moves slightly right (`translate-x-0.5`) on hover.
>
> ## 4. Performance and mobile
>
> - Load the canvas with `dynamic(..., { ssr: false })` to avoid hydration mismatches and keep the initial load small.
> - The video has `playsInline`, `muted`, `loop`, and a static `poster`.
> - On mobile, do not apply large Framer Motion `y` translations or heavy entrance animation to layout containers. It causes layout shift and flicker. Use opacity fades or a small scale (`0.98` to `1`).
>
> Output the complete `Hero.tsx`.

## Additions to apply on top of the brief

- Honor `prefers-reduced-motion`: drop the pulse and underline animations to a plain fade, and pass a flag so the canvas renders static or not at all.
- Put the form's accessible name and label on the email input, and keep visible focus styles on the input and button.
- Wire the form to the project's real submit path, or leave a clearly marked stub. Do not invent an endpoint.
