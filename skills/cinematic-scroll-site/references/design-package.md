# Design package template

The design package is the single deliverable of the Creative Director's Loop
and the sole input to the build. Every decision lives here; every line of
copy in it ships verbatim. Band ranges and pacing numbers are starting
points, validated later by the flick test.

Save as `design-package.md` in the project workspace (not in the deploy
folder). Tier 1 builds use a trimmed version: fewer bands, same sections.

---

```markdown
# Design package: {brand}

## 1. Producer
- Tier: {1 | 2 | 3}
- Provider: {Higgsfield | Kling | other}, tools and how images are passed in
- Segments: {n} x {seconds}s at {model}
- Credits: images {n} x {price}, video {n} x {price}, total {sum}
- Assets: existing {list} / generated {list}
- Mobile decision: {poster image | simplified scrub | video}
- Budget said out loud to the user: {yes, date}

## 2. Brand premise
One sentence: who it is for, what they feel, what the site must make them do.
Voice: {three adjectives}. Words to avoid: {list}.

## 3. Palette tokens
--bg: {never pure black or white}
--surface:
--text:
--muted:
--accent: {used in rare doses}
Background environment layer: {the one fixed layer behind everything}

## 4. Type trio
Display: {font, weight, use}
Body: {font, weight, use}
Detail / mono / accent: {font, weight, use}

## 5. Signature element
The one memorable thing (a motion, a texture, a cursor, a recurring shape).

## 6. Hero concept and storyboard
Starting frame: {description}
Camera move: {move}
Final resting frame: {description, where the CTA sits}
Segment list (Tier 2+): {n: start -> end}
Approved by user: {yes, date}

## 7. Band map (scroll range -> content)
| Band | Scroll range | Headline (verbatim) | Support line (verbatim) | Enters / exits |
|---|---|---|---|---|
| 1 | 0-15% | | | |
| 2 | 15-40% | | | |
| ... | | | | |
The last band holds the CTA on the final frame.

## 8. Below-fold outline
Ordered sections with verbatim copy: proof, how it works, offerings, FAQ,
testimonials, CTA, form microcopy, footer.

## 9. Vector layer plan
Which overlays, lines, icons, or SVG details, and which bands they belong to.

## 10. Build checklist
- [ ] Copy matches this file verbatim
- [ ] Copy gate: no em dashes, no stock words
- [ ] Flick test passed against the band map
- [ ] Worst-frame legibility audited per band
- [ ] Mobile decision implemented
```
