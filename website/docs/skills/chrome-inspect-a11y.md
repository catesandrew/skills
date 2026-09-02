---
title: Chrome Inspect A11y
description: Produces a live accessibility report for a running page or specific element via Chrome DevTools MCP, checking ARIA roles, names, relationships, keyboard focus, and approximate contrast against WCAG.
---

# chrome-inspect-a11y

## Why It Exists

This skill began as `accessibility-snapshot.prompt.md`, a Codex/VS Code prompt added in the bulk baseline commit `c0ba2ee2` ("prompts", 2025-12-03), described there as collecting "a focused a11y snapshot for a page or a specific element (roles, names, relationships)." It was converted into Claude Skill format in `44d082a3` ("chore: add skills for prompts"), moved to `agent-skills/skills/chrome-inspect-a11y/` in `856e34fa`, and removed from dotfiles in `df4241d4` when the entire `chrome-*` family was split out to the external `catesandrew/skills` marketplace to keep one source of truth. Notably, the same `44d082a3` commit also added a second, distinct a11y prompt, `accessibility.prompt.md`, which maps to the separate `audit-a11y-code` skill for *static source-code* review — the SKILL.md for this skill explicitly cross-references that distinction ("for static source-code review, use `audit-a11y-code`"), so the split between live-runtime and static-code a11y checking is a real, deliberate design decision visible in both the prompt history and the current doc, not an accident of naming.

## What It Does

The skill takes a DOM snapshot with `includeAccessibility`, `includeAttributes`, and `includeFrames` all enabled, then resolves the target scope — either "page" (working at `document.body`) or a CSS selector for a specific element's `uid`. From there it runs several targeted `evaluate_script` calls: one collecting role/name/relationship attributes (`role`, `aria-label`, `aria-labelledby`, `aria-describedby`, `aria-modal`, `aria-required`, `aria-expanded`, `aria-disabled`, `tabIndex`, and whether the element matches a natively-focusable selector list); one reading computed `color`, `background-color`, and `font-size` for a best-effort contrast approximation; and, when the scope looks like a dialog, a dedicated check for `role`, `aria-modal`, and whether `aria-labelledby` resolves to actual visible label text.

Keyboard checks are inferred statically rather than simulated: is the element one of the naturally-focusable tags (`a`, `button`, `input`, `select`, `textarea`)? If not, does it carry `tabindex="0"` (in the tab order) or `tabindex="-1"` (programmatically focusable only)? Any gaps are flagged as issues rather than assumed correct.

The output is structured as an Accessibility Summary (scope, role, name, relationships, focusability), an Issues list with WCAG success-criterion references where applicable (e.g., "insufficient contrast" tagged with SC 1.4.3, missing accessible name tagged with SC 4.1.2), a Passes list of correctly-implemented attributes, and an optional screenshot. A WCAG Quick Reference table anchors the thresholds used: ≥4.5:1 contrast for normal text, ≥3:1 for large text (≥18pt or 14pt bold), and structural requirements for dialogs (`role="dialog"`, `aria-modal="true"`, `aria-labelledby"`) and required fields (`aria-required="true"` plus a visible indicator).

## How To Use It

Triggers on: "live accessibility snapshot of a running page or specific element via Chrome DevTools MCP", checking roles, names, relationships, keyboard focus, and contrast, live runtime a11y checks (as opposed to static source-code review).

```sh
skills add -g catesandrew/skills --skill skills/chrome-inspect-a11y
```

```sh
npm install @catesworks/skill-chrome-inspect-a11y
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 52 skills as a single bundled plugin named `cw` — there is no standalone per-skill plugin.

## Gotchas & Invariants

- Requires a running, connected Chrome DevTools MCP server.
- `includeFrames: true` is mandatory on the snapshot call — without it, elements inside iframes (Storybook previews, embedded widgets) are simply invisible to the check.
- Contrast checking is a best-effort approximation from `getComputedStyle` values only — it does not account for opacity layering or overlapping backgrounds, so treat flags as leads, not final verdicts; use a dedicated contrast tool to confirm.
- Check the *native* control, not its wrapper — role/tabIndex read from a custom wrapper element can differ from the actual interactive `<input>` or `<button>` inside it.
- Keyboard-focus checks are static inference only (tag type + tabindex), not a simulated Tab-key walkthrough.
- This skill is explicitly for live runtime checks; static source-code accessibility review is a separate skill (`audit-a11y-code`), by the SKILL.md's own design.

## Related Skills

- [audit-a11y-code](/docs/skills/audit-a11y-code) — the static source-code counterpart this skill explicitly defers to for non-runtime a11y review.
- [chrome-inspect-element](/docs/skills/chrome-inspect-element) — shares the snapshot → resolve-uid → evaluate pipeline, generalized to full element inspection beyond accessibility.
- [chrome-debug-screenshot](/docs/skills/chrome-debug-screenshot) — same `includeFrames`-aware snapshot approach, applied to screenshot troubleshooting instead of a11y checks.

---

_Sourced from: skills/chrome-inspect-a11y/SKILL.md, skills/chrome-inspect-a11y/metadata.json, ~/.dotfiles git history (commit `44d082a3`)_
