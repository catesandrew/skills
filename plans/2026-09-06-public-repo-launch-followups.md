# Plan: Close out the two remaining public-repo-launch follow-ups

**Status:** pending approval
**Mode:** Direct (planning only — no implementation performed)
**Repo:** `catesandrew/skills` (`/Volumes/dev-ssd/repos/personal/skills`)
**Tracker:** beads epic `skills-0kq` — "Public skills repo launch — remaining follow-ups"

## Review Outcome (2026-09-06) — reconciled, supersedes Steps 1–4 below

Two independent reviews ran against this plan: `oh-my-claudecode:architect`
(APPROVE-WITH-CHANGES) and `oh-my-claudecode:critic` (DISAGREE). Reconciled
here because they conflict on Lane A's central premise.

- **Architect** confirmed `cw@skills` is correct (`marketplace.json` proves
  it), found the plugin is *already installed and working* on this machine
  (`~/.claude/plugins/installed_plugins.json`: `cw@skills` since 2026-08-30,
  cache has all 52 skills + `references/`, no `plugin.json` needed — matches
  7 sibling marketplaces of the identical shape), and narrowed the one
  genuinely untested delta to: registered marketplace source is an SSH URL,
  not the `catesandrew/skills` GitHub shorthand README documents. Also caught
  a real defect: Step 2's "count is 52" check will spuriously fail because a
  second `cw@cates-works` plugin also contributes a `cw:` skill (53 total) —
  fix to set-inclusion, not count.
- **Critic** went further and actually ran it: Claude Code ships a headless
  `claude plugin` CLI (`marketplace add`, `install -y`, `plugin details`,
  `plugin validate`) with no session-restart requirement. Ran the plan's own
  C1–C4 in a scratch dir with an isolated `CLAUDE_CONFIG_DIR`, using the
  shorthand `catesandrew/skills` form specifically (resolving architect's
  SSH-vs-shorthand question too): marketplace add ✔, install ✔, `plugin
  details cw` → 52 skills ✔, `references/` present in the cache for
  `session-wrap` and `react-query-patterns` ✔. **The smoke test already
  passed.** The plan's "cannot be automated" section is factually wrong.

**Resolution: adopt the critic's finding as ground truth** (it's a direct
empirical run, not inference from logs) and collapse Steps 1–4 into two
beads instead of four:

- **Bead A1** — fix the stale `skills@skills` command in `FOLLOWUPS.md`
  (was Step 1's one real remaining action).
- **Bead A2** — write a small persisted script (isolated `CLAUDE_CONFIG_DIR`,
  headless `claude plugin` CLI) that reproduces the critic's already-passing
  run, using **set-inclusion of the 52 named skills** (not a raw count, per
  the `cw@cates-works` collision) as the pass check, plus the `references/`
  presence check. Record the dated PASS. Not user-blocked — no human,
  no separate session, no restart needed.

Steps 1–4's prose below is kept for its research value (the manifest/name
audit, the failure-mode catalog) but its execution plan and "cannot be
automated" framing are superseded. Steps 5–8 (Lane B, distillation) stand
as originally planned — both reviewers agreed that lane is sound, and
critic additionally recommended collapsing it to one decision bead pointing
at the source repo rather than a spike+decision+build triad; kept as
originally planned (spike memo has real research value per architect) but
seeded as fewer, coarser beads (see beads seeded under `skills-0kq`).

## Requirements Summary

`.sessions/2026-08-28-public-skills-repo-launch/FOLLOWUPS.md` leaves exactly
two items open under "Nice-to-have / later". Everything else from that session
is done. This plan turns those two into discrete, trackable steps:

1. **Plugin-install smoke test.** The repo publishes itself as a self-hosted
   Claude Code plugin marketplace (`.claude-plugin/marketplace.json`), but that
   install path has never actually been exercised. It has to be proven from a
   *different* repo and a *fresh* Claude Code session, because `/plugin
   marketplace add` and `/plugin install` are interactive client commands whose
   effects (marketplace registration, plugin activation, skill namespacing) are
   process- and session-scoped. **This is not fully automatable from an agent
   session** — see "Why the smoke test cannot be fully automated" below. The
   deliverable is a written, checkable manual procedure plus a human run of it.
2. **Distillation decision on the 7 excluded employer-coupled skills.** The
   dossier explicitly flagged this as a judgment call, not a build. The
   deliverable here is a *spike + recommendation memo first*, then a human
   decision gate, and only then — conditionally — implementation.

Both follow-ups are independent of each other and can run in parallel. Within
each, the ordering is strict (see "Dependency graph").

### Blocking finding surfaced during planning: the follow-up's install command is wrong

`FOLLOWUPS.md` records the smoke test as:

```
/plugin marketplace add catesandrew/skills
/plugin install skills@skills
```

`skills@skills` is **wrong**. `.claude-plugin/marketplace.json` names the
marketplace `skills` but the single plugin inside it `cw` (matching this repo's
`cw:` skill command prefix). `README.md` already documents the correct pair:

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

Running the command as written in `FOLLOWUPS.md` would fail on a
plugin-not-found error and produce a false negative for the whole smoke test.
Step 1 pins this down before anyone runs anything.

### Second finding: there is no `.claude-plugin/plugin.json`

`.claude-plugin/` contains only `marketplace.json`. The `cw` plugin entry uses
`"source": "./"`, an inline 52-entry `skills` array, and `"strict": false` —
i.e. it leans on the non-strict path to load without a plugin manifest at the
source root. That is plausibly fine, and is exactly the assumption the smoke
test exists to falsify. It is called out here so that a load failure is
diagnosed as "missing plugin.json" in one step rather than being re-derived
from scratch.

### Pre-verified facts (do not re-litigate during execution)

Checked while drafting this plan, so the smoke test can focus on *client*
behavior rather than repo hygiene:

- `skills/` contains 52 directories; `marketplace.json` lists 52 `./skills/...`
  paths; the two sets are identical (`diff` clean). No missing or stray entry.
- The repo also ships a second distribution channel (`packages/skill-*` npm
  packages via Changesets, plus `skills add -g catesandrew/skills`). **That
  channel is out of scope for this plan** — this plan tests the Claude Code
  plugin channel only.

## Why the smoke test cannot be fully automated

Stated explicitly, because the answer is "no" and the plan must not pretend
otherwise:

- `/plugin marketplace add` and `/plugin install` are Claude Code *client*
  slash commands, not repo scripts. There is no supported headless CLI
  equivalent to assert against.
- Installation mutates the user's Claude Code config and the skill namespace
  for **subsequent** sessions. An agent cannot observe its own post-install
  skill list changing mid-session.
- The success signal that actually matters — "the skill is offered and is
  invocable as `cw:<name>` from an unrelated repo" — is only observable from a
  session started *after* install, in a *different* working directory, where
  this repo's on-disk `skills/` tree is not already providing the skills. From
  inside this repo the skills resolve locally, so a green result would be
  meaningless.

Therefore: Step 2 produces a written procedure, and Step 3 is a **human-run**
verification whose evidence (pasted session output) is committed. Automation is
limited to the static pre-flight checks in Step 1.

## Acceptance Criteria (plan level)

1. A committed, self-contained smoke-test procedure exists that a human can
   follow without re-reading this plan, using the *correct* install command.
2. That procedure has been run once by a human, and its pass/fail result plus
   raw evidence is recorded in the repo.
3. Any defect the smoke test surfaces is either fixed or filed as its own
   tracked issue — not silently absorbed.
4. A written recommendation exists for each of the 7 excluded skills, stating
   distill / don't distill and why, grounded in a read of the actual skill
   source (not the directory name).
5. The user has made an explicit yes/no distillation decision, and that
   decision is recorded.
6. If the decision is yes, every new skill created meets this repo's existing
   quality bar in `AGENTS.md` (kebab-case `name` matching the directory,
   `description` starting with "Use when...", <500 lines, no employer/client
   names, no internal org URLs, no absolute machine paths) and is wired into
   `marketplace.json`, `README.md`, `metadata.json`, and `packages/`.
7. `FOLLOWUPS.md` and beads epic `skills-0kq` reflect the closed-out state.

## Implementation Steps

Each step is sized to become one child issue under `skills-0kq`. Acceptance
criteria are embedded per step so a child issue is self-contained.

---

### Step 1 — Pre-flight: pin the correct install command and audit the plugin manifest

**Type:** executable (no user input needed)
**Depends on:** nothing
**Beads:** child of `skills-0kq`

Static verification of everything the smoke test would otherwise waste a
human's round-trip discovering. Confirm the marketplace/plugin name pair
(`cw@skills`), confirm the 52-path manifest still matches `skills/` on disk,
confirm every `skills/<dir>/SKILL.md` frontmatter `name` equals its directory
name, and determine whether the absence of `.claude-plugin/plugin.json` is
actually supported for a `strict: false` marketplace entry with `source: "./"`
(check current Claude Code plugin docs; if a manifest is required, add it as
part of this step). Fix the stale `skills@skills` command in `FOLLOWUPS.md`.

**Acceptance criteria:** the exact install command pair is confirmed against
`marketplace.json` and written down; `diff` of `skills/` vs. the manifest's
paths is empty; every SKILL.md `name` matches its directory; the `plugin.json`
question is answered in writing (either "not required, here's the doc
reference" or "required — added"); `FOLLOWUPS.md` no longer says
`skills@skills`.

---

### Step 2 — Write the manual smoke-test procedure

**Type:** executable (no user input needed)
**Depends on:** Step 1 (needs the confirmed command and the `plugin.json`
answer)

Author `.sessions/2026-08-28-public-skills-repo-launch/SMOKE-TEST.md` — a
numbered, copy-pasteable procedure a human runs in one sitting. It must
specify: a clean starting state (an unrelated repo, e.g. a scratch dir, that is
*not* this repo and does not already have these skills on disk); the exact
commands; and a concrete pass definition for each of four checkpoints:

- **C1 marketplace registers** — `/plugin marketplace add catesandrew/skills`
  succeeds and `skills` appears in the marketplace list.
- **C2 plugin installs** — `/plugin install cw@skills` succeeds and `cw` shows
  as installed.
- **C3 skills load** — after restarting the session, the skill list contains
  `cw:`-prefixed entries and the count is 52.
- **C4 a skill is actually invocable** — invoke two representative skills and
  confirm the real body loads: one plain single-file skill (`commit-message`)
  and one with a `references/` directory (`session-wrap` or
  `react-query-patterns`), proving reference files ship inside the plugin
  payload rather than only resolving from a local checkout.

The doc must state, up front, that this is manual by necessity and why (one
short paragraph, sourced from "Why the smoke test cannot be fully automated"),
and must include a results table for the runner to fill in with pass/fail plus
pasted output per checkpoint. It must also name the most likely failure modes
so the runner can report a useful diagnosis rather than just "it broke":
plugin-not-found (wrong name pair), plugin loads but zero skills (manifest
path/`plugin.json` problem), skills listed but body missing (packaging
problem), reference files missing (C4 specifically).

**Acceptance criteria:** the file exists; it names the clean-room requirement
explicitly; it gives a binary pass definition for all four checkpoints; it
contains an empty results table; a reader who was not part of this planning
session could run it end to end without asking a question.

---

### Step 3 — Human runs the smoke test and records the result

**Type:** 🚧 **USER-BLOCKED** — requires a human operating a separate Claude
Code session on their own machine. An agent cannot perform this step.
**Depends on:** Step 2

The user follows `SMOKE-TEST.md` in a fresh session in an unrelated directory,
fills in the results table, and commits it.

**Acceptance criteria:** the results table in `SMOKE-TEST.md` is fully
populated with pass/fail plus raw output for C1–C4, dated, and committed. A
partial run counts as a fail for the unreached checkpoints, not as "skipped".

---

### Step 4 — Remediate smoke-test failures (conditional)

**Type:** executable, **conditional** — runs only if Step 3 records any fail
**Depends on:** Step 3

For each failed checkpoint, diagnose and fix at the source (most likely
candidates: add `.claude-plugin/plugin.json`; correct `source`/`strict`
settings; adjust the `skills` array shape; correct `README.md`'s install
snippet). Re-run the affected checkpoints from Step 2's procedure — which
re-enters the user-blocked loop for anything past C1.

**Acceptance criteria:** every C1–C4 failure is either fixed and re-verified
green, or filed as its own beads issue with a written reason for deferring. No
failure is left undocumented. If Step 3 is all-green, this step closes
immediately as not-needed.

---

### Step 5 — Distillation spike: audit the 7 excluded skills, produce a recommendation memo

**Type:** executable (read-only analysis; produces a recommendation, **not** a
decision and **not** any new skill)
**Depends on:** nothing — can run in parallel with Steps 1–4

The 7 skills live in the user's private dotfiles at
`~/.dotfiles/agent-skills/skills/`, **not** in this repo. Read each one and
write `.omc/plans/2026-09-06-ado-baseline-distillation-spike.md` with a
per-skill distill / don't-distill recommendation.

The precedent to follow is `~/.dotfiles/agent-skills/SKILLS-AUDIT-2026-08.md`,
which handled the analogous envmgr-vs-dotfiles drift: it distilled 3 new
*generic* skills out of large repo-specific ones (`excel-like-table-navigation`
from 891 lines, `nextjs-react-query-cache-coordination` from 852,
`react-query-cache-determinism` from 783), each de-scoped to ~230 lines with
the proprietary domain replaced by a neutral example — and explicitly *skipped*
everything whose generic core wasn't worth extracting. The bar that audit set,
and that this spike must apply: **a real de-scope, not a copy.**

Shape of the material, established while drafting this plan (the spike should
verify, not re-discover, this):

- The **6 `ado-*` skills** are thin (50–58 lines each) and are near-identical
  wrappers over one shared 63-line reference,
  `references/ado-origence.instructions.md`, duplicated into all six. The
  employer coupling is concentrated in that reference, and it is heavy:
  organization and project names, a literal area path, a named individual as
  testing contact, a custom 7-value state vocabulary, custom fields, and an
  internal backlog URL. What *is* structurally generic is the *shape* — an
  iteration-selection procedure, a required-fields validation gate before save,
  work-item-type classification rules, and acceptance-criteria generation
  rules. Note the repo already ships `pr-ado-open` and `pr-ado-code-review` as
  successfully genericized Azure DevOps skills, which is direct evidence the
  `${input:...}` parameterization approach works here — and also raises a real
  question the spike must answer: whether 6 near-duplicate skills should
  collapse into **one** parameterized work-item skill rather than six.
- **`baseline-design`** is 266 lines plus bundled binary assets: brand logos,
  a licensed icon font, a variable brand font, and 5 design-token JSON files,
  describing a 3,300-class `bl-*` utility system for a specific employer's
  product line. The assets are employer brand IP and **cannot ship in a public
  repo** under any distillation. The only conceivably portable core is the
  *methodology* — how to package a design system as a skill (tokens + component
  specs + utility-class conventions + white-label theming + dark mode) — with
  every actual value replaced. The spike must judge whether that residue is a
  real skill or an empty shell, and must weigh it against the repo's existing
  `ui-engineer` and `frontend-quality-loop`, which may already cover the ground.

For each of the 7, the memo states: recommendation (distill / don't), what the
portable core actually is in one sentence, what has to be stripped or
parameterized, rough size of the result, and overlap with existing repo skills.
It must also give an explicit consolidation recommendation for the `ado-*`
group (6 skills vs. 1 parameterized skill vs. none) and a legal/IP note on
`baseline-design`'s assets.

**Acceptance criteria:** the memo exists and covers all 7 skills; each verdict
cites specifics from that skill's actual source rather than its name; the
`ado-*` consolidation question is answered; the `baseline-design` asset/IP
constraint is stated; the memo makes a clear overall recommendation but does
**not** create, move, or edit any skill in `skills/`.

---

### Step 6 — User decision on distillation

**Type:** 🚧 **USER-BLOCKED** — this is the judgment call the dossier flagged.
An agent must not decide it.
**Depends on:** Step 5

Present the memo's recommendation and ask the user (via `AskUserQuestion`, one
focused question) which of: distill nothing (close the follow-up as
"considered, declined"); distill the `ado-*` core only; distill
`baseline-design`'s methodology only; or distill both. Record the answer and
its rationale in the memo.

**Acceptance criteria:** an explicit user decision is recorded in the spike memo
with a date. "No" is a fully valid outcome and closes the follow-up — the
follow-up asked to *decide*, not to *build*.

---

### Step 7 — Implement approved distillations (conditional)

**Type:** executable, **conditional** — runs only if Step 6 approves at least
one distillation
**Depends on:** Step 6

For each approved skill, follow this repo's own add-a-skill checklist
end-to-end: author `skills/<name>/SKILL.md` (kebab-case `name` matching the
directory, `description` starting with "Use when..." and describing triggering
conditions only, under 500 lines, heavy material moved to `references/`); add
`metadata.json` matching the repo's established schema (`version` `1.0.0`,
`organization` `"Personal"`, `date`, `abstract`, `references` array only if a
`references/` dir exists); add the path to `.claude-plugin/marketplace.json`;
add a row to the right `README.md` table; generate the `packages/skill-<name>/`
package and the docs page via the existing `bin/` scripts; add a changeset.

Every line of employer coupling identified in Step 5 must be gone —
parameterized with `${input:variableName}` or dropped. No brand assets. If one
consolidated `ado-*` skill was chosen, it must not read as six skills stapled
together.

**Acceptance criteria:** each new skill passes the `AGENTS.md` quality bar;
`grep -ri` for the employer/product/individual names identified in Step 5
returns nothing across the new files; `diff` of `skills/` vs. `marketplace.json`
paths stays empty; `pnpm docs:check` passes; the skill appears in `README.md`;
a changeset exists. If Step 6 declined everything, this step closes as
not-needed.

---

### Step 8 — Close out the follow-up record

**Type:** executable
**Depends on:** Step 4 (or Step 3 if all-green) **and** Step 6 (or Step 7 if
distillation was approved)

Tick both items in `FOLLOWUPS.md` with a one-line outcome each, and close beads
epic `skills-0kq` and its children.

**Acceptance criteria:** both "Nice-to-have / later" checkboxes in
`FOLLOWUPS.md` are `[x]` with an outcome note and a link to the produced
artifact (`SMOKE-TEST.md`, the spike memo); `bd list` shows `skills-0kq` and all
its children closed.

## Dependency graph

```
Lane A (smoke test):        Step 1 → Step 2 → Step 3* → Step 4(cond.) ┐
                                                                      ├→ Step 8
Lane B (distillation):      Step 5 ─────────→ Step 6* → Step 7(cond.) ┘

* = blocked on the human user
```

Lane A and Lane B are fully independent and can run concurrently. Within each
lane the ordering is strict. Step 8 requires both lanes resolved.

## Blocked on the user vs. executable

| Step | Status |
|---|---|
| 1 — Pre-flight manifest audit | executable |
| 2 — Write smoke-test procedure | executable |
| **3 — Run the smoke test** | 🚧 **user-blocked** (needs a separate Claude Code session on the user's machine; not automatable) |
| 4 — Remediate failures | executable, conditional on Step 3 |
| 5 — Distillation spike memo | executable |
| **6 — Distillation decision** | 🚧 **user-blocked** (judgment call the dossier explicitly reserved for a human) |
| 7 — Implement distillations | executable, conditional on Step 6 |
| 8 — Close out | executable |

## Risks and Mitigations

- **Risk:** the smoke test is run from inside this repo, where the 52 skills
  already resolve from the local `skills/` tree, producing a meaningless green.
  **Mitigation:** Step 2's procedure makes the clean-room requirement (a
  different directory, a fresh session) an explicit numbered precondition, and
  C3/C4 check for the `cw:` prefix specifically rather than bare skill names.
- **Risk:** a human runs `skills@skills` from the stale `FOLLOWUPS.md` line and
  files a false "install is broken" result. **Mitigation:** Step 1 fixes that
  line before Step 2 is written, and Step 2's doc is the only artifact the
  runner is pointed at.
- **Risk:** the distillation spike drifts into implementation — an agent reads
  the ADO skills, decides they look portable, and starts writing them.
  **Mitigation:** Step 5's acceptance criteria explicitly forbid touching
  `skills/`, and the decision gate is a separate step owned by the user.
- **Risk:** a distilled `baseline-design` inadvertently carries employer brand
  IP (logo, licensed icon font, product-specific token values) into a public
  repo. **Mitigation:** Step 5 must produce an explicit asset/IP note; Step 7's
  acceptance criteria include a `grep` sweep for the identified names and a
  blanket no-binary-assets rule. This is the same sweep discipline
  `LESSONS.md` established at launch.
- **Risk:** distilling the 6 `ado-*` skills as-is yields six near-identical
  50-line skills that add noise rather than value. **Mitigation:** Step 5 must
  answer the consolidation question (6 vs. 1 vs. 0) before any build, and the
  `SKILLS-AUDIT-2026-08.md` precedent — real de-scope, not a copy — is named as
  the bar.
- **Risk:** Step 4 discovers a packaging defect that also affects the npm
  channel (`packages/skill-*`), and scope balloons. **Mitigation:** the npm
  channel is declared out of scope up front; any cross-channel defect is filed
  as a separate beads issue rather than absorbed into this plan.

## Verification Steps

1. `diff <(ls skills) <(grep -o 'skills/[a-z0-9-]*' .claude-plugin/marketplace.json | sed 's|skills/||' | sort)` — empty, before and after any Step 7 additions.
2. `grep -c 'skills@skills' .sessions/2026-08-28-public-skills-repo-launch/FOLLOWUPS.md` — zero after Step 1.
3. `.sessions/2026-08-28-public-skills-repo-launch/SMOKE-TEST.md` exists, and its results table has no empty cells after Step 3.
4. `.omc/plans/2026-09-06-ado-baseline-distillation-spike.md` exists, names all 7 skills, and records a dated user decision after Step 6.
5. If Step 7 ran: `pnpm docs:check` passes, and a `grep -ri` for the employer/product/individual names identified in Step 5 across `skills/`, `README.md`, and `packages/` returns nothing.
6. `bd list` — `skills-0kq` and all children closed after Step 8.

## Follow-ups (not part of this plan)

- The npm / `skills` CLI distribution channel (`packages/skill-*`, `skills add
  -g catesandrew/skills`) has also never been smoke-tested end to end. Same
  clean-room argument applies. Worth its own issue once the plugin channel is
  proven.
- If Step 6 declines distillation, the 7 skills stay in private dotfiles with
  no further action — but the decision should be re-examined if the employer
  coupling ever changes (e.g. the ADO conventions are generalized upstream).
