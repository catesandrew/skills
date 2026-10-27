---
name: high-ticket-site-generator
description: >-
  Use when asked to generate a polished, premium-feeling marketing or lead-gen
  website for any niche (real estate, med spa, law, solar, SaaS, agency, local
  service) as a single self-contained HTML file — "build a landing page for
  <brand>", "Awwwards-style site", "high-ticket site", "$5k website",
  "site generator prompt", or filling in a brand/niche/vibe/palette template.
  Covers the intake (brand, niche, vibe, palette, headline, calculator input),
  the stack (single HTML, Tailwind CDN, GSAP + ScrollTrigger, canvas particles,
  display+body font pair), the cinematic entrance and hero, the interactive
  ROI calculator, mobile rules, AND the conversion structure a real high-ticket
  site needs (offer, proof, pricing, FAQ, booking CTA, SEO/OG) learned from a
  live reference site.
---

# high-ticket-site-generator

Turns a fill-in-the-blanks brief into a single-file, animated, conversion-minded site.
Originated as Zygis Stan's "Universal High-Ticket Site Generator" prompt
(`references/prompt-template.md`); extended with what the live reference
(burnerscale.com) does that the raw prompt omits
(`references/reference-site-analysis.md`).

## Workflow

1. **Intake.** Collect the inputs below. Ask only for what you cannot infer; propose defaults for the rest (palette, vibe, effect) and state them.
2. **Pick the mode** (default `conversion`):
   - `showcase` — exactly the original prompt: entrance + hero + ROI calculator. Pure visual demo.
   - `conversion` — showcase sections **plus** the section stack in "Conversion structure". Use for anything a real client will publish.
3. **Generate** one `index.html` (all CSS/JS inline) following "Build rules".
4. **Verify** (mandatory, see below) before saying done.

## Inputs

| Input | Example | Default if missing |
|---|---|---|
| `${input:brand}` | Aurelia Estates | required |
| `${input:niche}` | Luxury real estate | required |
| `${input:vibe}` | "Marble & Gold Luxury" | derive from niche |
| `${input:primary}` / `${input:accent}` hex | `#0B0B0C` / `#FF6A33` | dark neutral + one warm/neon accent |
| `${input:entrance_effect}` | Falling gold dust | one themed particle effect |
| `${input:headline}` / `${input:subheadline}` | outcome-first, specific | draft 3, pick strongest |
| `${input:calc_input}` | Budget / sq ft / leads | the number the buyer already knows |
| `${input:calc_logic}` | how the 2 outputs derive from the input | state assumptions visibly |
| `${input:cta}` | Book a call (+ low-friction secondary) | book + free sample/quote |
| `${input:mode}` | showcase / conversion | conversion |

## Build rules

- **Stack:** single HTML file, Tailwind via CDN, GSAP + ScrollTrigger via CDN, raw-JS `<canvas>` particles. Display + body font pair (original: Space Grotesk + Inter; pick a less-default pair when the vibe allows). Dependency-free vanilla CSS/JS is acceptable if the user prefers — the reference site ships ~70KB with no libraries.
- **Tokens first:** declare palette, fonts, spacing as CSS variables in `:root`; everything references them. Text contrast ≥ 4.5:1 (check muted/dim greys on dark).
- **Cinematic entrance:** full-screen overlay in the background color, canvas particle effect, brand name animating in with accent glow, overlay lifts away. Keep it ≤ ~2.5s, skippable, never blocking content or LCP; no-JS and reduced-motion users see content immediately.
- **Hero:** second subtle canvas matching the theme; gradient-text headline; subheadline; **two CTAs** (primary + low-friction). Prefer showing the product/outcome in context (the reference puts a phone showing real examples in the hero) over pure decoration. For a scroll-driven video/section reel, use the sticky-stage + damped-playhead pattern in `references/reference-site-analysis.md` (hold-then-ease per slide, play only the active video, pause off-screen).
- **ROI calculator:** slider for `calc_input`; two outputs update live from `calc_logic`; odometer count-up. Label assumptions; no fabricated precision.
- **Motion:** GSAP/ScrollTrigger for reveals; honour `prefers-reduced-motion` (no particles/count-up, show final states); pause canvases off-screen (`IntersectionObserver`) and on `visibilitychange`; cap devicePixelRatio at 2.
- **Mobile:** `overflow-x: hidden` on html/body, hamburger → full-screen overlay menu, grids stack vertically, tap targets ≥ 44px, thumb-usable slider.
- **A11y/SEO:** semantic landmarks, one `<h1>`, `<title>`, meta description, OG/Twitter tags, `theme-color`, favicon.
- **Placeholders:** never invent testimonials, logos, metrics, or prices as if real. Use clearly marked placeholders (`[CLIENT RESULT]`) or ask for real numbers.

## Conversion structure (mode = conversion)

Order used by the reference site; drop sections that don't apply, keep the spine order:

1. Sticky header: brand, 3–4 anchors, primary CTA.
2. Hero (outcome headline, 2 CTAs, product-in-context visual, one-line proof stat).
3. How it works — 3–4 numbered steps.
4. What you get / anatomy of the deliverable.
5. Interactive "try it" (ROI calculator, or a niche-picker that shows tailored examples).
6. Proof — founder/owner credibility with 2–3 hard numbers.
7. Lead magnet — free sample/quote/audit form (few fields, honeypot, "no call needed").
8. Pricing — 3–4 tiers, low-priced entry/pilot credited to month one, "most popular" highlight, inclusions, per-tier CTA.
9. FAQ — objections (what's included, who owns it, how it's measured, time required).
10. Final CTA (booking embed such as Cal.com, plain-link fallback) + soft secondary CTA, footer with contact.

Copy rules: headline states the outcome in plain words ("Ads get skipped. Tips get saved."); every section heading is a claim, not a label; specificity beats adjectives.

## Verify before done

1. Open the file in a browser; screenshot at 1440px and 390px.
2. Confirm: no horizontal scroll at 390px (`document.documentElement.scrollWidth <= innerWidth`), no console errors, entrance completes and reveals content, calculator updates, hamburger works, CTAs link somewhere real.
3. Emulate reduced-motion; content must still be fully visible.
4. `grep -n "INSERT\|\[CLIENT" index.html` — no leftover template tokens or placeholder claims presented as real.

## Common mistakes

- Pasting the template with blanks unfilled, or filling them with generic text ("Premium solutions").
- Entrance animation that hides content 4s+ or loops forever on low-end phones.
- Particle canvases animating off-screen / ignoring reduced motion.
- ROI numbers with no stated assumptions — reads as a gimmick and hurts trust.
- Stopping at hero + calculator: pretty, but no offer, proof, pricing, or booking path.
- Invented testimonials/metrics presented as real.
- Low-contrast muted text on dark backgrounds.
