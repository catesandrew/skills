---
name: design-critique-loop
description: >-
  Use when a frontend build needs to be iteratively judged on how it actually
  looks rendered, not just whether the code compiles or lints clean — a
  single page/component, or many built in parallel, each needing genuine
  visual polish rather than "plausible AI output." Covers the screenshot
  self-critique loop: a small headless-browser harness renders the real page
  at multiple viewports and scroll depths, the agent reads its own
  screenshots with vision and critiques them like a hostile design director,
  fixes what it finds, then adds one deliberate complexity upgrade so
  iteration converges on distinctive rather than bland-safe. Also covers
  scaling the same loop to N parallel builds: an orchestrator/builder split
  (one shared non-negotiable build standard + individually art-directed
  briefs per builder, no shared templates so outputs can't converge), a
  diversity constraint for growing a set over time, and a director role that
  does cold review with specific findings. Triggers on "critique this design",
  "does this look right", "screenshot review loop", "visual QA with vision",
  "iterate on design quality", "build N different landing pages", "parallel
  design agents", or any request to raise a build's visual/design quality
  through repeated self-review rather than a single pass.
---

# design-critique-loop

## Overview

Code review catches bugs. It cannot see a widow, a low-contrast button, or a
paragraph drowning in artwork — those only exist in the rendered pixels. This
skill closes that gap: render the real page, look at it with vision, critique
it like an adversarial design director, fix what's found, then push past
"acceptable" with a forced complexity upgrade. It scales cleanly from a
single page to N pages built in parallel by independent agents.

**Complements, doesn't replace:** `frontend-quality-loop` (a11y/perf/type-
safety/patterns lenses on the code itself). Run both — this skill covers the
lens neither one does: does it actually *look* right.

## The core loop (single build)

1. **Render it for real.** Headless-browser screenshot at desktop and mobile
   viewports, at multiple scroll depths (top, mid-scroll, bottom for anything
   taller than one viewport). Capture console errors and document height in
   the same pass — a screenshot harness is a natural place to also catch
   runtime errors and layout blowouts for free. See
   `references/screenshot-harness.md` for a minimal reference implementation
   (~25 lines is enough).
2. **Look at the pixels with vision, adversarially.** The agent reviews its
   own screenshots and actively hunts for: rhythm and alignment problems,
   contrast failures, orphans/widows in text, dead zones (empty areas that
   read as unfinished rather than intentional), and anything that "smells
   like AI default" — generic centered hero, floating glassmorphism cards,
   template SaaS sections, interchangeable stock layout. Critique like a
   director who wants you to fail, not like the author defending the work.
3. **Fix everything found.** No partial fixes, no "good enough for now."
4. **Add one deliberate complexity upgrade.** A texture, a micro-interaction,
   a marginal detail, a small surprise — something not strictly required by
   the brief. This is the step that matters most: without it, iteration
   converges toward the safest, blandest version of the design, because
   "fix what's broken" alone has no force pushing toward distinctive. The
   upgrade step supplies that force.
5. **Repeat for a fixed number of passes** (3 is a reasonable default for a
   single build). Do not skip a pass just because pass N-1 looked clean —
   the complexity-upgrade step means each pass should find something new to
   add even when nothing is broken.

## Scaling to N parallel builds

When building many distinct artifacts (a set of landing pages, a gallery of
demos, N component variants) at once, run the loop above per-build but add
an orchestration layer so the set doesn't converge on itself:

1. **Write a build constitution first, separately from any individual
   brief.** A short, non-negotiable standard every build must meet
   regardless of concept: real copy (no lorem ipsum), a distinctive
   typographic/motion system, responsive, accessible, zero console errors.
   This is the floor; briefs are where the variation lives.
2. **Write one individually art-directed brief per build.** Each brief names
   a concept, a palette (exact values, not vibes), typefaces, one or two
   signature techniques, and — critically — **one specific thing this build
   has to prove** that the others don't. A brief without a "what does this
   prove" line tends to produce a generic, interchangeable result.
3. **No shared templates or shared components across builds, deliberately.**
   Shared scaffolding is exactly what makes parallel outputs converge toward
   each other. Give each build its own folder and full autonomy within it.
4. **One director reviews cold.** After the builder-level critique loop
   finishes, a separate reviewing pass (fresh eyes, not the builder that made
   it) looks at final screenshots and sends back specific, concrete findings
   — not "make it better," but "this button's contrast fails, this line
   breaks mid-word." Specificity is what makes the fix pass useful.
5. **If growing the set over time, enforce a diversity constraint.** Keep a
   registry of each existing build's "DNA" (domain, technique, palette,
   typography, mood, in a few words each). Any new brief may share **at
   most one axis** with anything already in the set. Without an explicit
   constraint like this, a model asked for "six more, different this time"
   will quietly reuse whatever domain/technique combination worked last time.
6. **Own asset generation centrally, not per-builder, once N gets large.**
   If builds consume generated media (images, video, 3D), route generation
   requests through the director/orchestrator with one shared budget and
   queue, not through each builder independently — avoids rate-limit/cap
   collisions when several builders request generation simultaneously. Below
   roughly two generation jobs per builder this doesn't matter; above that,
   centralize it.

## Asset discipline (when builds include generated media)

Treat generated media like production assets, not throwaway output:

- Compress images to a modern format (WebP) at a sane max width — a 5MB
  source PNG has no business shipping; target tens to a couple hundred KB.
- Compress video (h264, reasonable CRF, muted, `faststart` for immediate
  playback) and keep it small enough to autoplay responsibly (well under
  1MB for a short loop is achievable).
- If both a still and a video/3D asset are needed for the same subject,
  generate the video/3D *from* the still (image-to-video, image-to-3D)
  rather than generating them independently — keeps the poster frame and the
  animated/interactive version visually continuous instead of subtly
  mismatched.
- Not everything needs to be generated. Procedural techniques (shaders,
  canvas, SVG, CSS) are free to iterate on and often read as more
  intentional than a generated asset — mix generated and procedural based on
  what a given build actually needs, not by default.

## Common Mistakes

- **Treating one clean pass as done.** A single "render, check, fix" cycle
  converges on merely-acceptable. The complexity-upgrade step in a
  multi-pass loop is what pushes past that — skipping it produces
  functional-but-forgettable output.
- **Reviewing only one viewport.** Desktop-only review routinely misses
  mobile-specific breakage (content sitting under a fixed header, text
  overflow, a control that only exists off-screen). Always include a mobile
  viewport and, for anything with meaningful scroll length, more than one
  scroll depth.
- **Vague critique instead of specific findings.** "Make it better" doesn't
  converge; "this heading breaks mid-word at 390px, this CTA's contrast
  ratio fails" does. Both the self-critique step and any director-level
  review should produce concrete, actionable findings, not general vibes.
- **Sharing templates/components across parallel builds meant to be
  distinct.** Immediately produces convergent, interchangeable output —
  defeats the point of building N different things.
- **No diversity constraint when growing a set over time.** Without an
  explicit "share at most one axis with what already exists" rule, later
  additions quietly drift toward whatever combination worked best last time,
  and the set stops actually covering a range.
- **Decentralized asset generation at scale.** When many builders each
  independently hit a generation API/MCP at once, expect rate-limit or
  budget-cap collisions — route it through one owner once the builder count
  gets non-trivial.
- **Headless-browser screenshot capture hanging under heavy parallel load.**
  If running many builders' screenshot harnesses concurrently, pin a single
  stable headless-rendering mode/flag set rather than letting each builder
  pick its own — mixed or default configurations have been observed to hang
  machine-wide under concurrent load.
