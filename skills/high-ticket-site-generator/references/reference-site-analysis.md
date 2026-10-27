# Reference: burnerscale.com (explored 2026-10-26)

A live site from the same author's lineage. Facts below were read from the rendered page and its source.

## What it is
Single HTML file (~71KB DOM), inline CSS + ~16KB inline JS, **no Tailwind, no GSAP, no canvas**. Third-party only: Google Fonts and a Cal.com booking embed. Product: done-for-you organic short-form video for AI apps/SaaS.

## Design tokens (`:root`)
- Background `#0B0B0C`, surfaces `#0F0F0E` / `#141413`, lines `#1E1D1A`–`#3A3936`
- Text `#F2F0EA`, muted `#B9B6AE`, dim `#9E9B93`, faint `#8A877F`
- Accent `#FF6A33`, accent-2 `#FF8A5C` (one warm accent on warm-black)
- Fonts: Bricolage Grotesque (display), Instrument Sans (body), JetBrains Mono (labels/prices). H1 ≈ 59px desktop.

## Section spine
Sticky header (anchors + "Book a call") → **Stage hero** ("Ads get skipped. Tips get saved.", phone reel of real example videos driven by scroll, swapping tip title and engagement chips, tap-for-sound, skip control) → How it works (4 steps) → Anatomy of a tip video (3 parts) → **"Try it" picker** (6 niches → 3 tailored ideas each; replaces the ROI slider) → Proof (founder, 50–70K views/video, 1.7M+ followers) → **Free sample form** (honeypot, 5 fields, "No call needed") → **Pricing** (Pilot $590 once, credited to month one; Starter $2,490; Growth $2,990 "Most popular"; Scale $3,490; per-tier CTA) → FAQ (6 objections) → Final CTA via Cal.com popup + free-sample fallback → footer.

## Techniques worth copying
- Product-in-context hero beats abstract particles.
- Two CTAs everywhere: commit (book) + low-friction (free sample).
- Low-priced pilot credited to month one lowers entry friction on a high-ticket retainer.
- Interactive element tailors examples to the visitor's category (more relevant than a generic calculator).
- `prefers-reduced-motion` respected in JS; `body.loaded` class for entrance; rAF-driven eased scroll.
- Complete head: description, OG/Twitter tags, `theme-color`, favicon.
- Cal.com embed (`Cal("init", …)`, brand color = accent, dark theme) with plain-link fallback.

## Departures from the original prompt
| Original prompt | Live site |
|---|---|
| Tailwind + GSAP + canvas | Hand-written CSS/JS, video + CSS motion |
| Space Grotesk / Inter | Bricolage Grotesque / Instrument Sans / JetBrains Mono |
| Particle intro overlay | Immediate content, light `loaded` fade-in |
| ROI slider | Niche picker with tailored ideas |
| (nothing) | Pricing, proof, lead form, FAQ, booking, OG meta |

## How the scroll / animation / video works (from the page's inline script, static read)

Corroborates the no-GSAP/no-Tailwind/no-canvas finding: all motion is one hand-written rAF loop plus CSS.

**Scroll-driven video reel (hero)**
- `#stage` is taller than the viewport and sticky; inside it `#reel` holds N `.slide`s, each with a `<video>` (`muted loop playsinline preload`, `poster`). `N = TIPS.length`; a `TIPS` array drives titles/labels/chips.
- Passive scroll listener schedules `frame()` via rAF: `p = clamp(-rect.top / (stage.offsetHeight - innerHeight))`.
- Hold-then-swipe: `raw = p*N`; first half of each segment holds, second half eases to the next slide with cubic ease-in-out `ease(clamp((t-0.5)/0.5))`.
- Damping: `cur += (target-cur)*0.16` per frame, stop under `0.0008` (or immediately when reduced motion).
- Render: `translate3d(0, -cur*100%, 0)` on the reel; each slide scales `1 - d*0.08`, its `.shade` overlay opacity `d*0.55` (d = distance from current, capped at 1).
- Scroll UI: progress bar follows `p`; scroll cue fades at `p > 0.02`; skip control fades at `p > 0.9`; header gets `scrolled` at `scrollY > 10`; dots `scrollTo` `total*((i+0.25)/N)` (smooth unless reduced motion).

**Video playback**
- Only the video within 0.999 of `cur` plays; the rest pause. Gated by an `IntersectionObserver` (threshold 0.05) so nothing plays off-screen.
- Muted by default; sound button / unmute / tap on screen toggles audio, only on the active slide.
- `timeupdate` fills per-slide progress bars; `playing` fades out the `.poster`.

**Other motion**
- Phone mockup tilts to the cursor (`rotateY` ±14°, `rotateX` ∓10°) — fine pointer only, no reduced motion, stage in view.
- `.reveal`/`.step` get an `in` class from an `IntersectionObserver` (threshold 0.15, bottom margin -40px).
- "Anatomy" hotspots auto-cycle every 2800 ms until hover/click, started by an observer (threshold 0.4).
- Idea cards stagger in at `60 + i*130` ms; category tabs and horizontal row snapping.
- `prefers-reduced-motion` removes damping, staggers, smooth scroll, chip animation, and tilt.
- Cal.com: namespace `burnerscale`, dark theme, brand `#FF6A33`; opens a popup in place, falls back to the plain link if the embed hasn't loaded.

**Unknown (not captured):** video file URLs/codecs, the full `TIPS` array length beyond 3, and the CSS for sticky/`.loaded`/`.reveal` transitions.
