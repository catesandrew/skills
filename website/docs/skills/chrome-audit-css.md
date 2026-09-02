---
title: Chrome Audit CSS
description: Uses Chrome DevTools MCP to compare computed styles against authored CSS rules for a target element, revealing cascade winners, specificity conflicts, and dead or overridden declarations.
---

# chrome-audit-css

## Why It Exists

`chrome-audit-css` traces to `44d082a3` ("chore: add skills for prompts"), the commit that converted a batch of Codex CLI custom prompts into portable Agent Skills. That commit deleted `home/.codex/prompts/css-usage-audit.prompt.md` while adding `agent-skills/chrome-audit-css/SKILL.md` — a direct name match. It was relocated to `agent-skills/skills/chrome-audit-css/` in `856e34fa`, migrated to the external `cw` marketplace in `df4241d4`, and imported into this public repo via the bulk `13fbfbc` commit.

## What It Does

Given a CSS selector, the skill first takes a full accessibility/DOM snapshot via `mcp__chrome__take_snapshot` (with attributes and frames included) to resolve the first visible matching node. It then pulls a curated set of computed styles for that element via `getComputedStyle` — display, position, box-sizing, width/height, padding/margin (all four sides), border, color, background, font-size/weight/line-height, z-index, overflow, and a combined flexbox summary (display + grow/shrink/basis).

Separately, it walks `document.styleSheets`, and for each rule whose selector matches the element (`element.matches(rule.selectorText)`), records the selector, source stylesheet (or `inline`), and declaration text — skipping any cross-origin sheet that throws on access. From that rule set it determines, per CSS property set by more than one matching rule, which rule actually wins the cascade (by specificity, then source order for ties) and which are overridden; declarations that never win under any competing rule are flagged as likely-dead and safe to remove.

Output covers the resolved target node (`tag#id.classes`), a computed-styles table, the matching rules in cascade order (source URL, selector, declarations), a "⚠️ Conflicts & Overrides" table (property / winning rule / overridden rule(s) / reason), a "🚫 Dead declarations" list, an optional screenshot, and an embedded specificity quick-reference (`!important` > inline `style=""` (1,0,0,0) > `#id` (0,1,0,0) > `.class`/`[attr]`/`:pseudo-class` (0,0,1,0) > element/`::pseudo-element` (0,0,0,1), with later source order breaking ties at equal specificity).

## How To Use It

Triggers on: "audit CSS cascade for a specific element via Chrome DevTools MCP — reveals computed styles, matching rules, specificity conflicts, and overridden/dead declarations".

```sh
skills add -g catesandrew/skills --skill skills/chrome-audit-css
```

```sh
npm install @catesworks/skill-chrome-audit-css
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 52 skills as a single bundled plugin named `cw` — there is no standalone per-skill plugin.

## Gotchas & Invariants

- Requires a running, connected Chrome DevTools MCP server.
- Cross-origin stylesheets throw a `SecurityError` on `sheet.cssRules` access and are silently skipped — rules from those sheets will not appear in the matching-rules output even if they apply.
- `document.styleSheets` does not reach into Shadow DOM — a component's shadow root must be inspected separately if styles live there.
- Inline `style=""` attributes beat any authored stylesheet rule regardless of specificity, unless overridden by `!important` elsewhere — the audit treats this as a hard rule, not a heuristic.
- "Dead declarations" are only ones that *never* win against any competing rule for that property — a declaration that wins in some contexts but loses in others is a conflict, not dead code.

## Related Skills

- [chrome-audit-console](/docs/skills/chrome-audit-console) — same Chrome DevTools MCP dependency and `44d082a3` origin commit, for runtime error capture instead of style cascade debugging.
- [chrome-audit-bundles](/docs/skills/chrome-audit-bundles) — same MCP dependency and origin commit, for CSS/JS transfer-size and caching instead of cascade correctness.

---

_Sourced from: skills/chrome-audit-css/SKILL.md, skills/chrome-audit-css/metadata.json, ~/.dotfiles git history (commit `44d082a3`)_
