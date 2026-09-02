---
title: Audit A11y Code
description: Performs a static, source-code accessibility review of a component or template, checking semantic structure, ARIA usage, keyboard access, forms, tables, and contrast against WCAG 2.1 AA.
---

# audit-a11y-code

## Why It Exists

`audit-a11y-code` traces back to `44d082a3` ("chore: add skills for prompts"), a commit that converted a batch of existing Codex CLI custom prompts (under `home/.codex/prompts/*.prompt.md`) into the new portable Agent Skills format — the same commit deleted `home/.codex/prompts/accessibility.prompt.md` and `accessibility-snapshot.prompt.md` while adding `agent-skills/audit-a11y-code/SKILL.md` alongside a sibling `chrome-inspect-a11y/SKILL.md`. The skill's own text confirms the split: it says "No browser required — analysis is static. For live runtime checks, use `chrome-inspect-a11y`" — which lines up with `accessibility.prompt.md` (static review) becoming this skill and `accessibility-snapshot.prompt.md` (live snapshot) becoming `chrome-inspect-a11y`. It was then relocated from `agent-skills/audit-a11y-code/` to `agent-skills/skills/audit-a11y-code/` in `856e34fa` ("chore: agent-skills"), migrated out to the external `cw` marketplace in `df4241d4`, and imported into this public repo via the bulk `13fbfbc` commit.

## What It Does

This is a static, no-browser-required accessibility reviewer for a single component or template file. It runs nine categories of checks against WCAG 2.1 AA: semantic landmarks and heading order, ARIA usage correctness (no redundant ARIA, `aria-labelledby`/`aria-describedby` must reference real visible elements, `aria-hidden` must never sit on a focusable element), interactive-control keyboard operability and focus order, dialog/overlay requirements (`role="dialog"`, `aria-modal`, focus trapping, Escape-to-close), form labeling and error-message association, data-table header semantics (`scope`, `headers`/`id` pairs, `aria-sort`), media/icon alt-text and SVG labeling, motion/`prefers-reduced-motion` and live-region announcements, and a heuristic contrast pass (4.5:1 normal text, 3:1 large text/UI components).

Output is a fixed three-part structure: a "✅ Passes" bullet list of already-correct patterns, an "⚠️ Issues" section per problem citing the WCAG success criterion (e.g. SC 1.3.1, SC 4.1.2) and exact location, and a "🛠 Recommended fixes" section as literal diff-style patches (e.g. `- <div (click)="save()">Save</div>` → `+ <button type="button" (click)="save()">Save</button>`). It also embeds a WCAG 2.1 AA quick-reference table mapping criterion numbers to plain-English requirements, and a short list of common mistakes (misuse of `aria-label` on non-interactive elements, duplicate ids breaking `aria-labelledby`, missing focus traps, unlinked error messages).

## How To Use It

Triggers on: "a static accessibility review of a component, template, or markup file — checks semantic structure, ARIA usage, keyboard access, forms, tables, and contrast against WCAG 2.1 AA".

```sh
skills add -g catesandrew/skills --skill skills/audit-a11y-code
```

```sh
npm install @catesworks/skill-audit-a11y-code
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 52 skills as a single bundled plugin named `cw` — there is no standalone per-skill plugin.

## Gotchas & Invariants

- Purely static analysis — no browser is launched; for runtime/live-DOM checks the skill explicitly defers to `chrome-inspect-a11y`.
- Every `aria-labelledby`/`aria-describedby` must point to an id that actually exists and is visible — ambiguous or dangling references are flagged.
- `aria-hidden="true"` is a hard violation when applied to a still-focusable element.
- Required-field indication must be both visual (`*`) and programmatic (`aria-required="true"`) — one without the other is incomplete.
- `placeholder` text is explicitly called out as not a substitute for a real `<label>`.
- Issues must be reported with the WCAG success-criterion number and a minimal fix snippet, not just a description of the problem.

## Related Skills

- [audit-react-component](/docs/skills/audit-react-component) — same "audit" family and originates from the same `44d082a3` prompt-conversion commit, but reviews hooks/render behavior rather than accessibility.

---

_Sourced from: skills/audit-a11y-code/SKILL.md, skills/audit-a11y-code/metadata.json, ~/.dotfiles git history (commit `44d082a3`)_
