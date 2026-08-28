---
name: frontend-quality-loop
description: Use when you want to iteratively raise the quality of frontend code to a satisfactory bar — auto-detects the stack from package.json, runs accessibility, performance, type-safety, and patterns/correctness lenses, applies fixes, and loops until the code is clean and verified.
---

# frontend-quality-loop

A stack-aware, self-correcting quality loop for frontend code. It detects which frameworks and libraries a project uses, runs the relevant review **lenses**, applies fixes, then re-runs the lenses until two consecutive rounds find nothing actionable — finishing with a build/typecheck/test verification gate.

This skill is **provider-portable** (Claude Code, Codex, Gemini). On Claude Code it can accelerate by dispatching each lens to a specialist subagent and persisting via the `ralph` loop; everywhere else it runs the same lenses inline. The procedure below is the source of truth — host wrappers only trigger it.

## Inputs

| Variable | Description | Example |
|----------|-------------|---------|
| `${input:target}` | File(s), directory, or glob to grade | `src/components/` |
| `${input:bar}` | Quality bar to stop at: `standard` or `strict` | `strict` |
| `${input:lenses}` | Comma-separated lens override (optional; default = auto from stack) | `a11y,perf,types` |
| `${input:max_rounds}` | Safety cap on loop iterations (optional, default 5) | `5` |

## Step 1: Detect the stack (do this first, every run)

Read `package.json` (and `tsconfig.json`, `angular.json`, `next.config.*`, `tailwind.config.*` if present). Classify into a **profile**. Do not assume — read the manifest.

| Signal in dependencies | Profile flag |
|---|---|
| `react` | `react` |
| `next` | `next` (implies `react`) |
| `@angular/core` | `angular` |
| `typescript` / `tsconfig.json` exists | `ts` |
| `@tanstack/react-query` or `react-query` | `react-query` |
| `zustand` | `zustand` |
| `tailwindcss` | `tailwind` |
| `@playwright/test` | `e2e-playwright` |
| `vitest` / `jest` | `unit-tests` |

State the detected profile in one line before proceeding, e.g.:
`Detected: next + ts + react-query + tailwind + e2e-playwright`.

If no `package.json` exists or it is not a frontend project, stop and say so.

## Step 2: Select lenses

Default lens set = the four quality dimensions, refined by profile. Honor `${input:lenses}` if given.

| Lens | Runs when | What it checks | Claude subagent (acceleration) | Portable skill to load |
|---|---|---|---|---|
| **a11y** | always | WCAG 2.1/2.2, ARIA, keyboard nav, contrast, focus management | `frontend-accessibility-expert` | `audit-a11y-code` |
| **perf** | `react`/`next`/`angular` | re-render churn, memoization, bundle weight, Core Web Vitals | `react-performance-expert` | `chrome-audit-performance`, `chrome-audit-bundles` |
| **types** | `ts` | strictness, `any` leakage, unsound casts, runtime-validation gaps | `typescript-type-expert` | `typescript-type-safety`, `zod-repair` |
| **patterns** | `react`/`next` | hooks correctness, component API, impossible states, idioms | `react-expert` | `audit-react-component`, `react-component-patterns` |
| **state** | `react-query`/`zustand` | query keys, cache invalidation, store shape, selector stability | `react-expert` | `react-query-patterns`, `zustand-patterns` |
| **styling** | `tailwind` or CSS-in-JS | class duplication, responsive correctness, design-token drift | `frontend-css-styling-expert` | `frontend-design` |
| **e2e** | `e2e-playwright` + `${input:bar}=strict` | critical-path coverage, flaky selectors, real-browser behavior | `e2e-playwright-expert` | `agent-browser`, `chrome-run-flow` |

`standard` bar runs a11y + perf + types + patterns (+ state/styling if present). `strict` adds the e2e lens and a Lighthouse check.

## Step 3: The loop (auto-fix + verify)

```
round = 1
while round <= max_rounds:
  findings = run all selected lenses   # parallel on Claude; sequential elsewhere
                                        # each finding = {lens, file, line, severity, fix}
  actionable = findings where severity in {high, medium}
  if actionable is empty:
    clean_streak += 1
    if clean_streak >= 2: break        # two clean rounds = satisfied
  else:
    clean_streak = 0
    apply fixes for actionable, highest-severity first
    (Claude: dispatch fixes to executor; else edit inline)
  round += 1

# Verification gate — never skip, never claim done without it
run typecheck (tsc --noEmit / ng build)
run affected unit tests
run build
if strict: run Lighthouse / e2e on critical path
```

**Rules of the loop:**
- A lens **reviews**; a separate fix pass **changes** code. Never let the same pass both grade and self-approve its own fix — re-grade in the next round.
- Stop at `max_rounds` even if not clean; report what remains rather than looping forever.
- If a fix introduces a new failure (typecheck/test regression), revert that fix and log it as a finding for human review.
- Every round, print a one-line scoreboard: `Round 2 — a11y:0 perf:2 types:0 patterns:1 → fixing 3`.

## Step 4: Output

### 📋 Stack & lenses
Detected profile and which lenses ran.

### 🔁 Round log
Per round: the scoreboard line and what was fixed.

### ✅ Verification
Typecheck / tests / build / (Lighthouse|e2e) results with actual output — not "should pass".

### ⚠️ Remaining
Anything left unfixed at `max_rounds`, or fixes reverted due to regressions, with file:line and why.

## Claude Code acceleration (optional, auto-detected)

When running inside Claude Code with oh-my-claudecode:
- Fire all lenses for a round **in parallel** as subagents (see table), passing `model` explicitly (`sonnet` standard, `opus` for `strict`/architectural).
- Wrap the whole loop in the `ralph` persistence skill so it survives across iterations and enforces the verification gate before declaring completion — this is the "copy an OMC loop, don't edit the plugin" path. The thin `/frontend-quality` command does this wiring.
- Use `chrome-*` MCP audit skills for live perf/a11y/Lighthouse evidence.

On Codex / Gemini / other hosts: skip subagents and `ralph`; run each lens's portable skill inline, apply fixes directly, and self-run the verification commands. Behavior and output format are identical — only the engine differs.

## Common Mistakes
- **Skipping stack detection** — running React lenses on an Angular repo (or vice versa) produces noise. Always read `package.json` first.
- **Grading and approving in one pass** — a fix must be re-graded in a fresh round, never blessed by the pass that wrote it. This is how partial fixes get declared "done".
- **Looping without a cap** — without `max_rounds` a stubborn finding (or two lenses disagreeing) loops forever. Cap it and report remainder.
- **Declaring done without the verification gate** — "fixed the a11y issues" means nothing if `tsc` now fails. Always run typecheck/tests/build at the end with real output.
- **Treating scaffolding as a quality lens** — adding feature flags, env vars, or endpoints is code *generation*, not code *grading*. Use the `frontend-scaffold` skill for that; mixing them lets generation bugs slip past the grader.
- **Hardcoding paths** — pass the target via `${input:target}`; never bake a repo-specific path into the loop.
