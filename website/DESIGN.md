---
name: skills (docs site)
description: Docusaurus 3 docs site for catesandrew/skills, restyled as a warm-paper field manual with one signal-orange accent.
colors:
  primary: "#b13f16"
  primary-dark: "#9f3914"
  primary-darker: "#953613"
  primary-darkest: "#7b2c0f"
  primary-light: "#c24418"
  primary-lighter: "#ca4719"
  primary-lightest: "#dc5322"
  primary-tint: "#f6e3da"
  primary-on-dark: "#ff8f66"
  primary-tint-dark: "#34231a"
  paper: "#f5f2ea"
  surface: "#fbf9f4"
  ink: "#1c1a15"
  ink-muted: "#5b564b"
  rule: "#d9d2c1"
  paper-deep: "#ece6d8"
  code-bg: "#ebe5d6"
  code-ink: "#3a1f12"
  night: "#16140f"
  night-surface: "#1e1b15"
  night-ink: "#ece7da"
  night-ink-muted: "#a8a291"
  night-rule: "#38342a"
  night-paper-deep: "#25211a"
  night-code-ink: "#f3d9c8"
  footer: "#1b1912"
  footer-night: "#0f0e0a"
  syntax-comment: "#6b6556"
  syntax-keyword: "#9f3914"
  syntax-string: "#4a6a1c"
  syntax-number: "#7a3f9e"
  syntax-function: "#1b5c8a"
  syntax-type: "#7f5200"
  syntax-inserted: "#2f6b1f"
  syntax-deleted: "#a3261a"
  syntax-night-comment: "#9a9482"
  syntax-night-string: "#b5d46a"
  syntax-night-number: "#d3aef5"
  syntax-night-function: "#7cc4f0"
  syntax-night-type: "#f0c060"
  syntax-night-inserted: "#9ad06a"
  syntax-night-deleted: "#ff8a80"
typography:
  display:
    fontFamily: "IBM Plex Sans Condensed, IBM Plex Sans, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 5.5vw, 4rem)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "IBM Plex Sans Condensed, IBM Plex Sans, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 3vw, 2rem)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.015em"
  body:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
  lede:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "1.15rem"
    fontWeight: 400
    lineHeight: 1.65
  code:
    fontFamily: "IBM Plex Mono, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "92%"
    fontWeight: 400
  label:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  global: "0.25rem"
  pill: "999px"
spacing:
  hero-y: "4.5rem"
  section-y: "3rem"
  row-y: "1rem"
  target: "44px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.global}"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.paper-deep}"
    textColor: "{colors.ink}"
    rounded: "{rounded.global}"
    height: "44px"
  chip:
    backgroundColor: "{colors.paper-deep}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    height: "36px"
  chip-selected:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.paper}"
  code-block:
    backgroundColor: "{colors.code-bg}"
    textColor: "{colors.code-ink}"
    rounded: "{rounded.global}"
---

# Design System: skills (docs site)

## Overview

**Creative North Star: "The Field Manual"**

A reference you carry because it is trusted: warm paper, hairline rules, a condensed heading face that reads like a stamped label, and one signal-orange accent used the way a manual uses a tab or a warning mark. The deep-dive pages are the product, so the interface serves finding and reading them: it indexes, it filters, and it gets out of the way.

The look is deliberately not the stock Docusaurus template it replaced. That template (green accent, system fonts, a hero-only home page) is the anti-reference. Light and dark modes both exist and follow `prefers-color-scheme`; the dark mode is a warm near-black, not a blue-gray.

**Key Characteristics:**
- Warm paper and ink, never pure white or black; one accent.
- Hairline rules and ruled indexes instead of cards for structure.
- Condensed display face for headings; mono only for commands and skill names.
- Flat: depth comes from tone and rules, not shadow.
- 44px minimum targets on every control.

## Colors

One signal orange on warm neutrals; the dark mode lifts the accent for contrast against warm near-black.

### Primary
- **Signal Orange** (#b13f16): links, the primary button, active sidebar item, selected chips, category titles. Contrast 5.23:1 on paper, 5.85:1 with white text on it.
- **Ember** (#ff8f66): the same roles in dark mode; 8.21:1 on night.

### Neutral
- **Paper** (#f5f2ea) and **Surface** (#fbf9f4): page and raised surfaces (navbar, excerpt panel, inputs).
- **Ink** (#1c1a15) and **Ink Muted** (#5b564b): body and secondary text (15.5:1 and 6.5:1 on paper).
- **Rule** (#d9d2c1) and **Paper Deep** (#ece6d8): hairlines, table heads, tabs, secondary buttons, chips.
- **Code Bg** (#ebe5d6) with **Code Ink** (#3a1f12): inline code and blocks (12:1).
- **Night** (#16140f), **Night Surface** (#1e1b15), **Night Ink** (#ece7da), **Night Ink Muted** (#a8a291): the dark counterparts.
- **Footer** (#1b1912, #0f0e0a in dark): the one dark band in light mode.

### Syntax and diagrams
Code tokens use a muted set tuned to the code background, every one at 4.5:1 or better: keywords and tags take the accent, strings olive (#4a6a1c, night #b5d46a), numbers plum (#7a3f9e, night #d3aef5), functions and variables blue (#1b5c8a, night #7cc4f0), types and attributes ochre (#7f5200, night #f0c060), comments muted italic. Mermaid diagrams are recolored from the same CSS variables: boxes Paper Deep with an accent outline, edges Ink Muted, labels Ink. Both live in `src/prism/` and `src/css/custom.css`.

### Named Rules
**The One Signal Rule.** Orange marks what is clickable or current. It never fills a section background.
**The Frontmatter Is Normative Rule.** Accent ramps live in `src/css/custom.css` as `--ifm-color-primary-*`; this file mirrors them. Change the CSS first.

## Typography

**Display Font:** IBM Plex Sans Condensed (700), self-hosted via `@fontsource`
**Body Font:** IBM Plex Sans (400/500/600)
**Label/Mono Font:** IBM Plex Mono (400/500), for commands, skill names and code only

**Character:** a single family in three widths. Condensed headings give a stamped, labeled feel; Plex Sans keeps long reading comfortable; mono marks anything you could type.

### Hierarchy
- **Display** (700, clamp(2.25rem, 5.5vw, 4rem), 1.05): home hero title, capped at 18ch.
- **Headline** (700, clamp(1.5rem, 3vw, 2rem), 1.15): section titles; `/skills` title.
- **Body** (400, 1rem, 1.65): docs prose, measure capped at 75ch.
- **Lede** (400, 1.15rem, 1.65): hero subtitle, 60ch.
- **Code** (400, 92%): inline code, blocks, skill names, example lists.
- **Label** (400, 0.9rem, 1.5) and **Caption** (400, 0.8rem, 1.5): filter chips, status lines, skill categories, code titles, index counts.

### Named Rules
**The Typeable Rule.** Mono is for things a reader can type or copy. It is never a costume for "technical".

## Layout

Docusaurus classic shell with a ruled, left-aligned home page: hero, category index, deep-dive excerpt, all on one left edge. The category index is a two-column ruled list (not cards) that drops to one column on narrow screens. `/skills` is a single column with search, category chips and a list that gains a three-column row (name, summary, action) through a container query at 44rem. Docs pages keep Infima's sidebar and table of contents, with prose capped at 75ch and h2s opened by a hairline.

## Elevation & Depth

Flat. Depth is tone (paper, surface, paper-deep) and 1px rules. The navbar shadow is removed in favor of a bottom rule. No custom shadows.

### Named Rules
**The Flat-By-Default Rule.** Nothing lifts at rest or on hover; hover is a tint change.

## Shapes

Tight 0.25rem corners on buttons, inputs, code and panels; pill (999px) only for filter chips. No decorative geometry.

## Components

### Buttons
- **Shape:** 0.25rem corners, 44px minimum height.
- **Primary:** Signal Orange fill, white text (dark mode: Ember fill, night text).
- **Secondary:** Paper Deep fill with a Rule border and ink text.
- **Hover / Focus:** a darker accent step on hover; a 2px accent outline with 2px offset on `:focus-visible`.

### Chips (category filters)
Pill, Paper Deep fill with a count in Ink Muted; selected state is a filled accent with `aria-pressed="true"`. 36px tall on fine pointers, 44px on coarse pointers.

### Search (`/skills` and navbar)
48px field on `/skills` with a `/` shortcut hint; the navbar uses the local-search plugin, which indexes the deep-dive pages and shows breadcrumbs.

### Navigation
Sticky navbar on Surface with a bottom Rule. Links, brand and toggles are 44px. The active sidebar item is a filled tint with accent text (no colored side border).

### Index rows and skill rows
Ruled rows, no cards. Category rows show title (accent, condensed), count, and three example skill names in mono. Skill rows show name (mono link), category, a two-line summary and a Copy install button.

### Code blocks
Code Bg with Code Ink text; the install block is tabbed (Claude Code, skills CLI).

## Do's and Don'ts

### Do:
- **Do** keep light and dark modes, with the dark palette warm.
- **Do** derive counts and skill lists from `skills-data.ts`; never type a number in copy.
- **Do** use ruled rows and indexes for structure.
- **Do** keep every interactive target at 44px or larger.

### Don't:
- **Don't** fill sections with the accent or use it for decoration.
- **Don't** use cards of icon, heading and text as page structure.
- **Don't** use a colored side border on callouts, list items or menu items.
- **Don't** hardcode "N skills" anywhere; the build computes it.
- **Don't** break the generated catalog or `pnpm docs:check`.
