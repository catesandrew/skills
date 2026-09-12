# Plan: Close out the skills docs-site follow-ups

**Status:** pending approval
**Mode:** Direct (follow-up closeout of the 2026-09-02 docs-site session)
**Repo:** `catesandrew/skills` (`/Volumes/dev-ssd/repos/personal/skills`)
**Source dossier:** `.sessions/2026-09-02-skills-docs-site/` (`FOLLOWUPS.md`, `ARCHITECTURE.md`, `SUMMARY.md`, `BLOG.md`)

## Requirements Summary

The 2026-09-02 session built and shipped a Docusaurus docs site under
`website/`, live at `skills.catesworks.dev` via a **manual** CLI deploy
(`vercel deploy --cwd website --prod`). It left five open items in
`FOLLOWUPS.md`: two blocked on a user decision (push the pending commits;
decide whether to wire Vercel auto-deploy), one CI hardening item, and two
nice-to-haves (richer homepage, turn on the blog).

This plan decomposes those into six discrete, independently-trackable steps
suitable for beads child issues, each with its own acceptance criteria and
explicit dependency ordering. Two of the six are gated on a human decision
and cannot be started by an agent; the other four are pure execution work.

**This plan does not implement, push, or deploy anything.** It is planning
only.

### Ground truth verified for this plan (2026-09-06)

- `git log --oneline origin/main..HEAD` → **4 unpushed commits** (oldest
  first): `f710d60` (chore: ignore `website/.vercel` and env files),
  `6d454b8` (docs: session dossier), `77f5a6e` (add cbm — adds `.cbmignore`),
  `e3f07f2` (bd init — adds `.beads/**` + 6 lines to `.gitignore`).
  `git status` also shows one **untracked** file: `.beads/PRIME.md`.
  Note this is a larger and different set than `FOLLOWUPS.md` records — that
  file only knew about `f710d60`.
- `website/docusaurus.config.ts:42` → `blog: false`.
- `website/src/` contains only `css/custom.css`, `pages/index.tsx`,
  `pages/index.module.css`. `index.tsx` renders a single `HomepageHero`
  component — there is **no** `HomepageStats` / `HomepageFeatures`.
  The porting source exists locally at
  `/Volumes/dev-ssd/repos/personal/next-starters/website/src/components/{HomepageFeatures,HomepageStats}/`.
- `.github/workflows/skills-release.yml` has exactly one PR-gated job,
  `verify` (`if: github.event_name == 'pull_request'`), running:
  `generate-skill-package-json.mjs --check`, `sync-skill-content.mjs --all`,
  `validate-skill-package.mjs --all`, `generate-marketplace.mjs --prefix cw`,
  then `git diff --exit-code`. It does **not** run
  `node bin/generate-skill-docs.mjs --check` (exposed as `pnpm docs:check` in
  root `package.json`) and does **not** build the website.
- `bin/generate-skill-docs.mjs` documents `--check` at its top as
  "CI: diff in-memory output against the committed file"; per
  `ARCHITECTURE.md` invariant 1 it also enforces that a deep-dive page exists
  for every `skills/<name>/`.
- `pnpm-workspace.yaml` includes `website`, so a root
  `pnpm install --frozen-lockfile` already installs the Docusaurus deps —
  no extra install step is needed to add a website build to CI.
- `.gitignore` already ignores `website/build/` and `website/.docusaurus/`,
  so a CI website build will not trip the existing `git diff --exit-code`.
- No Vercel GitHub auto-deploy is wired: `website/vercel.json` does not
  exist, and `.github/workflows/` contains only `skills-release.yml`.
  Deploys are manual CLI only.

## Review Outcome (2026-09-06) — reconciled, supersedes the S1/S3/S5/S6 shapes below

Two independent reviews ran: `oh-my-claudecode:architect` (APPROVE-WITH-CHANGES)
and `oh-my-claudecode:critic` (AGREE-WITH-CHANGES). They converge; corrections
below are adopted as the seeding basis.

- **S1 leak concern is real but overstated.** Architect found precedent this
  plan missed: `.sessions/2026-08-28-public-skills-repo-launch/**` is already
  on `origin/main` (`6bf991e`), and *that* pushed dossier contains actual
  `/Volumes/...` machine paths — worse than the new one, which has zero.
  `.beads/**`'s tracked payload is inert (0-byte `interactions.jsonl`, 5-key
  `metadata.json`, boilerplate hooks, its own `.gitignore` already excludes
  secrets/dolt-data). Net: the `.sessions/**` precedent question is
  effectively pre-answered ("continue the existing convention"); `.beads/**`
  is the one genuine first-time call. Critic independently converged on the
  same conclusion via a different angle: split S1 into **S1a** (decision:
  confirm `.beads/**` is fine to publish + `.beads/PRIME.md` disposition —
  the `.sessions/**` half is precedent, not a live question) and **S1b**
  (execution: `git push`). Adopted: two beads, not one.
- **S3's dependency on S1 downgrades to soft.** Architect: git-connecting
  Vercel deploys `origin/main`'s current head (what the site already
  serves) — connecting the repo, verifying Root Directory = `website`, and a
  *preview* deploy are all safe before S1 lands. Only the first **production**
  auto-deploy needs S1 pushed. S2 (auto-deploy y/n = yes) remains the sole
  hard blocker.
- **S3's live-site acceptance criterion is unfalsifiable as written.** Critic
  ran the plan's own curl check against the *current* manually-deployed site
  right now — `/` and `/docs/skills-catalog` already return 200, pre-work.
  That proves the site is up, not that auto-deploy fired. Fixed: S3's AC
  becomes "deployed production SHA in the Vercel dashboard equals
  `git rev-parse origin/main`" (plus the existing curl checks as a secondary
  smoke check, and note `/docs/skills/dataviz`-shaped deep-dive URLs are the
  right kind of page to check, not the catalog alone).
- **S4 needs one added guard + one added note.** Architect: if S4's required
  real PR run is branched off local `main` (4 commits ahead of pushed
  `origin/main`), the PR diff silently carries the unpushed S1 commits, and
  merging it publishes them — bypassing S1's user gate entirely. Fixed: S4's
  AC now requires branching from `origin/main`, not local `main`. Also:
  `concurrency: group: skills-release, cancel-in-progress: false` is one
  group shared by `verify` and `release`, so a slow Docusaurus build in
  `verify` serializes behind/ahead of push-to-main `release` runs — give the
  wall-clock note a threshold, not just "record it." Critic separately notes
  this repo has **zero merge commits in its last 20** — it's direct-push-only
  — so S4's "actual PR run" AC requires the executor to explicitly open a
  scratch PR; state that plainly so the AC doesn't read as unachievable.
- **S5/S6 zombie risk.** Critic: `ARCHITECTURE.md`'s "What's deliberately not
  here" section lists `blog: false` and no-`HomepageStats` as **deliberate**
  decisions, not gaps — filing S5/S6 as unblocked execution work
  mischaracterizes them as ready when the real gate ("do we want to reverse
  that decision?") is unanswered. Fixed: both now depend on one new decision
  bead ("revisit the minimal-hero/no-blog posture?") rather than being filed
  independently-executable, and seeded at lower priority so they don't
  compete with S1–S4 for attention.
- **S5's render AC is unfalsifiable; its "52" is a drift source.** Fixed:
  require screenshots at 375px and 1280px in both light/dark theme as the
  artifact, and require the skill count be derived (e.g. from
  `skills/*/SKILL.md` at build/render time or a generated constant) rather
  than hardcoded, since `docs:check` only validates `website/docs/skills/**`
  and won't catch a stale literal.
- **Missing ownership, now added.** Critic: no step owned updating
  `FOLLOWUPS.md` itself (was only Verification step 9) — added as its own
  closing bead (**S7**). No step owned the manual deploy after S5/S6 merge if
  S2 resolves to CLI-only — folded into S7's scope as a documented decision
  point, not silently left.
- **Miscount fixed:** the Requirements Summary above says "five open items";
  `FOLLOWUPS.md` actually has six `- [ ]` bullets (2 user-blocked + 1 CI + 2
  nice-to-have + the CI-in-`release`-script item folded into S4's issue
  rather than dropped). Coverage (S1–S7) is 1:1 correct; only the prose count
  was wrong.

Both reviewers agreed **S4 is the only bead with unambiguous value and zero
human gate** — seeded to be workable standalone rather than implicitly
waiting on the epic's decision beads.

## Acceptance Criteria (overall)

1. Every item in `.sessions/2026-09-02-skills-docs-site/FOLLOWUPS.md` is
   either done, explicitly declined with a recorded reason, or converted to a
   tracked beads issue — nothing silently dropped.
2. `origin/main` and local `main` are in sync (or the divergence is a
   recorded, deliberate decision).
3. A new skill added without a deep-dive page, or an MDX-breaking prose
   pattern, fails CI on the PR rather than surfacing on the next manual
   deploy.
4. The live site's relationship to `git push` is unambiguous and documented:
   either auto-deploy is wired, or the CLI-only flow is written down where a
   future contributor will see it (`README.md` and/or `ARCHITECTURE.md`).
5. No step in this plan modifies `skills/*/SKILL.md` or `skills/*/metadata.json`
   content — this is infrastructure/docs work only.

## Implementation Steps

Each step below is written to become one beads child issue. `Blocked on`
distinguishes a **user decision** (an agent must stop and ask) from a
**dependency** (another step must land first).

---

### S1 — Push the 4 pending commits to `origin/main`

**Kind:** user-decision-blocked (approval to push), then trivial execution
**Depends on:** nothing
**Blocked on:** explicit user approval to push, plus two content decisions
below

Local `main` is 4 commits ahead of `origin/main`. Before pushing, the user
must confirm two things that this session cannot decide unilaterally, because
`catesandrew/skills` is a **public** repo:

- **a.** `6d454b8` publishes the entire `.sessions/2026-09-02-skills-docs-site/`
  dossier (including `BLOG.md`, `LESSONS.md`, and ADRs). The dossier is
  self-described as public-safe, but publishing internal session notes to a
  public repo is a standing editorial choice, not a mechanical one.
- **b.** `77f5a6e` (`.cbmignore`) and `e3f07f2` (`.beads/**` — config, README,
  5 git hooks, `metadata.json`, and 6 added `.gitignore` lines) publish local
  agent-tooling configuration. Confirm that is intended, and decide what to
  do with the still-untracked `.beads/PRIME.md` (commit it, ignore it, or
  leave it untracked).

Once approved: `git push origin main`.

**Acceptance criteria**
- `git log --oneline origin/main..HEAD` returns empty output.
- `git status --short --branch` shows `## main...origin/main` with no
  `ahead`/`behind` marker.
- The disposition of `.beads/PRIME.md` is explicit — committed, added to
  `.gitignore`, or consciously left untracked with that noted in the issue.
- No new commits were authored to "clean up" the four existing ones unless
  the user asked for that (push as-is, or stop and re-plan).

---

### S2 — Decide: Vercel GitHub auto-deploy, or stay CLI-only

**Kind:** user-decision only (no code)
**Depends on:** nothing
**Blocked on:** user decision

Choose one:

- **Auto-deploy:** connect the `catesandrew/skills` GitHub repo to the
  `skills-docs` Vercel project so pushes to `main` publish automatically.
  Trade-off: docs changes go live without a human gate, and every push to
  `main` (including non-website commits) triggers a build.
- **Stay CLI-only:** keep `vercel deploy --cwd website --prod` as the deploy
  ritual. Trade-off: the live site can silently lag `main` — already called
  out as a known risk in `FOLLOWUPS.md`.

Either way, the decision must be **written down**, not just made — a reader
of `main` should be able to tell how the site gets published.

**Acceptance criteria**
- A yes/no answer is recorded on the issue.
- If **no** (stay CLI-only): `README.md` (and/or
  `.sessions/2026-09-02-skills-docs-site/ARCHITECTURE.md`) states explicitly
  that the site is deployed manually and that `git push` does **not** update
  `skills.catesworks.dev`, including the exact deploy command. S3 is then
  closed as "declined", not left open.
- If **yes**: S3 is unblocked and proceeds.

---

### S3 — Wire Vercel GitHub-integration auto-deploy for `skills-docs`

**Kind:** execution, but requires an authenticated human Vercel session
**Depends on:** S1 (repo state settled on `origin/main` first — otherwise the
first auto-deploy builds a tree that doesn't match local), **and** S2 = yes
**Blocked on:** S2 decision; also needs Vercel dashboard access or an
authenticated `vercel` CLI (agent cannot self-authorize)

Connect the repo to the existing `skills-docs` Vercel project — dashboard, or
`vercel git connect` run from `website/`. Per `ARCHITECTURE.md`, the project
was originally linked with `--cwd website`, so Docusaurus root detection
already resolved correctly; verify the GitHub integration **inherits**
`website/` as the build root and set the Root Directory explicitly if it
does not.

Do **not** trigger a production deploy as a side effect of verification
without saying so — confirm on a preview deploy first where possible.

**Acceptance criteria**
- The `skills-docs` Vercel project shows `catesandrew/skills` as its
  connected Git repository, with production branch `main`.
- The project's Root Directory resolves to `website` (verified in project
  settings, not assumed).
- A push to `main` produces a Vercel deployment tied to that commit SHA, and
  `skills.catesworks.dev` serves it (`curl -o /dev/null -w "%{http_code}"`
  → `200` on `/`, `/docs/skills-catalog`, and one deep-dive page, matching
  the verification the original session used).
- `README.md` / `ARCHITECTURE.md`'s "no auto-deploy-on-push" statements are
  updated — `ARCHITECTURE.md`'s "What's deliberately not here" section
  currently asserts the opposite and would otherwise become wrong.

---

### S4 — Add doc-sync + website-build checks to the CI `verify` job

**Kind:** pure execution — **independent, can be done any time**
**Depends on:** nothing (does not need S1/S2/S3)
**Blocked on:** nothing

Add to the `verify` job in `.github/workflows/skills-release.yml`:

- `node bin/generate-skill-docs.mjs --check` (or `pnpm docs:check`) — catches
  a new skill missing a deep-dive page, or a stale `skills-catalog.md`.
- `pnpm --filter website build` — catches MDX-breaking prose before it
  reaches a manual deploy (exactly the class of break the original session hit
  twice: a bare `<100` read as a JSX tag, and a backtick-escaping bug in a
  single-backtick code span).

Place both **before** the existing `git diff --exit-code` step so an ordering
change doesn't mask a diff. The existing root
`pnpm install --frozen-lockfile` already installs `website` deps
(`pnpm-workspace.yaml` includes it), so no new install step is required.

Note the coverage boundary: `verify` runs only on `pull_request`
(`if: github.event_name == 'pull_request'`), so this protects PR merges but
not direct pushes to `main`. Whether to also add `docs:check` to the root
`release` script (which already chains the other `--check` scripts before
`changeset publish`) is a judgement call to record on the issue, not to do
silently.

**Acceptance criteria**
- `.github/workflows/skills-release.yml`'s `verify` job runs both new steps,
  ordered before `git diff --exit-code`.
- The change is validated by an actual PR run (not just local reasoning) —
  `verify` is `pull_request`-gated, so it cannot be exercised by pushing to
  `main`.
- Locally reproducible green baseline: `pnpm docs:check` exits 0 and
  `pnpm --filter website build` exits 0 on current `main`.
- Deliberately-red sanity check performed once (locally or on a scratch
  branch): a temporary MDX-breaking edit, or a `skills/<name>/` with no
  `website/docs/skills/<name>.md`, makes the job fail. Revert the probe.
- CI stays green afterward: `website/build/` and `website/.docusaurus/` are
  already gitignored, so the build must not cause `git diff --exit-code` to
  fail — confirm in the PR run.
- Added CI wall-clock is noted on the issue (a Docusaurus build is not free).

---

### S5 — Port `HomepageStats` / `HomepageFeatures` to the homepage

**Kind:** pure execution, nice-to-have
**Depends on:** nothing functionally. **Soft ordering:** its visible effect
depends on S2/S3 — if auto-deploy is not wired, merging this does not update
the live site until someone runs `vercel deploy --cwd website --prod`.
**Blocked on:** nothing (though "do we actually want a richer landing page?"
is a taste call the user may want to weigh in on before work starts)

`website/src/pages/index.tsx` currently renders only `HomepageHero`. Port the
two components from
`/Volumes/dev-ssd/repos/personal/next-starters/website/src/components/{HomepageFeatures,HomepageStats}/`,
adapting copy and numbers to **this** repo — 52 skills, this repo's three
real install channels (Claude Code plugin marketplace `cw@skills`, the
`skills` CLI, npm `@catesworks/skill-<name>`).

Hard constraint from `ARCHITECTURE.md` invariant 3: install instructions must
reflect what is actually installable — there is **no** per-skill plugin in
this repo, unlike a claim on one `next-starters` page that was deliberately
not copied. Any stat shown must be derived from the repo, not from
`next-starters`' numbers.

**Acceptance criteria**
- `website/src/components/HomepageFeatures/` and
  `website/src/components/HomepageStats/` exist and are rendered by
  `src/pages/index.tsx`.
- Every number and install command shown is true of this repo (skill count
  cross-checked against `skills/*/SKILL.md`; no per-skill-plugin claim).
- `pnpm --filter website typecheck` and `pnpm --filter website build` both
  pass.
- Renders correctly in both light and dark theme, and at mobile width.
- No `skills/**` files modified.

---

### S6 — Turn on the Docusaurus blog and publish the first post

**Kind:** pure execution, nice-to-have
**Depends on:** nothing functionally. **Soft ordering:** same live-site
caveat as S5. If both S5 and S6 are done, sequence them to avoid two people
editing `docusaurus.config.ts` / the navbar concurrently.
**Blocked on:** nothing, except the user may want to review the post's public
framing before it ships (see below)

Flip `blog: false` (`website/docusaurus.config.ts:42`) to a real blog config,
add the navbar entry, and adapt
`.sessions/2026-09-02-skills-docs-site/BLOG.md` (116 lines, already written as
a public-safe draft) into `website/blog/<date>-<slug>.md` with proper
frontmatter.

`BLOG.md`'s own header comment is a constraint, not a suggestion: keep the
private source repo generic ("a private dotfiles collection"), don't paste
personal machine paths, and strip any internal hostnames. The HTML comment
header itself must not survive into the published post.

**Acceptance criteria**
- `blog` is configured (not `false`) in `docusaurus.config.ts`, with a navbar
  link, and `website/blog/` contains the post with valid frontmatter
  (title, date, and either `authors` configured or the field omitted — a
  dangling author key breaks the build).
- The published post contains no absolute local paths (e.g. no
  `/Volumes/...`, no `~/.dotfiles/...` machine paths), no internal hostnames,
  and not the draft's HTML comment header.
- `pnpm --filter website build` passes with `onBrokenLinks: 'throw'` still in
  effect — enabling the blog adds new routes and is a common source of
  broken-link failures.
- The post is reviewed by the user before it goes live (it is public writing
  under their name).

---

## Dependency ordering (summary)

```
S1 (push, user-approval) ──┐
                           ├──► S3 (wire auto-deploy)
S2 (auto-deploy decision) ─┘        │
                                    └─► (makes S5/S6 go live on merge)

S4 (CI checks) ............... independent, start any time
S5 (homepage) ................ independent; live only after S3 or a manual deploy
S6 (blog) .................... independent; live only after S3 or a manual deploy
```

**User-decision-blocked:** S1 (push approval + two public-repo content
calls), S2 (auto-deploy yes/no), S3 (transitively — needs S2, plus human
Vercel access).

**Executable by an agent right now:** S4. **Executable, taste-gated:** S5, S6
(no technical blocker; the user may want to approve scope/copy first, and S6's
post needs a human read before publishing).

## Risks and Mitigations

- **Risk:** S1 publishes more than the user expected — `FOLLOWUPS.md` records
  only `f710d60` as pending, but there are now 4 commits including
  `.sessions/**` session notes and `.beads/**` tooling config, on a public
  repo. **Mitigation:** S1 explicitly enumerates all four commits and their
  contents and requires per-category confirmation before pushing; the plan
  does not treat "push pending commits" as mechanical.
- **Risk:** wiring auto-deploy (S3) before S1 means the first automatic build
  runs against a tree that doesn't match local `main`, making a failure hard
  to attribute. **Mitigation:** S3 hard-depends on S1.
- **Risk:** S3's GitHub integration doesn't inherit `website/` as the build
  root (the CLI link used `--cwd website`; the Git integration is a separate
  code path), so the first auto-deploy builds the repo root and fails.
  **Mitigation:** S3's acceptance criteria require reading the project's Root
  Directory setting explicitly rather than assuming inheritance.
- **Risk:** S4's new website build makes CI meaningfully slower on every PR,
  including PRs that touch no docs. **Mitigation:** measure and record the
  added wall-clock on the issue; if it's unacceptable, the follow-up option is
  a `paths`-filtered job — noted below, not done pre-emptively.
- **Risk:** S4 is written but never actually exercised, because `verify` only
  fires on `pull_request` and the change lands via a direct push to `main`.
  **Mitigation:** acceptance criteria require a real PR run **and** a
  deliberately-red probe that is then reverted.
- **Risk:** S5/S6 merge to `main`, everyone assumes the site updated, and it
  didn't (the exact watch-out `FOLLOWUPS.md` already flags). **Mitigation:**
  S2 forces the deploy model to be documented either way; S5/S6 each carry an
  explicit "live only after S3 or a manual deploy" note.
- **Risk:** S5 ports `next-starters`' copy verbatim and asserts install
  channels this repo doesn't have (per-skill plugin), violating
  `ARCHITECTURE.md` invariant 3. **Mitigation:** called out inline in S5 with
  an acceptance criterion on it.
- **Risk:** S6 publishes a draft that still reads as internal notes.
  **Mitigation:** `BLOG.md`'s own sanitization header is promoted to
  acceptance criteria, plus a required human review before publish.

## Verification Steps

1. `git log --oneline origin/main..HEAD` → empty (S1).
2. `git status --short --branch` → clean tree, no ahead/behind (S1).
3. `pnpm docs:check` → exits 0 locally (S4 baseline).
4. `pnpm --filter website build` → exits 0 locally (S4/S5/S6 baseline).
5. A PR against `main` shows the `verify` job running both
   `generate-skill-docs.mjs --check` and the website build, and passing (S4).
6. `curl -o /dev/null -w "%{http_code}" https://skills.catesworks.dev/` and
   `/docs/skills-catalog` and one deep-dive page → `200` each (S3, and after
   any manual deploy).
7. If S3 landed: the Vercel dashboard shows the latest `main` commit SHA as
   the current production deployment.
8. `git diff --stat` on each step's branch touches only the files that step
   claims (no `skills/**` changes in any of S3–S6).
9. `.sessions/2026-09-02-skills-docs-site/FOLLOWUPS.md` is updated so each
   closed item is checked off or annotated with its decision.

## Follow-ups (not part of this plan)

- If S4's website build proves too slow for every PR, split it into a
  `paths`-filtered job (`website/**`, `skills/**`, `bin/generate-skill-docs.mjs`)
  rather than dropping the check.
- Consider adding `node bin/generate-skill-docs.mjs --check` to the root
  `release` script, which already chains the other `--check` scripts before
  `changeset publish` — closes the gap that `verify` never runs on the
  Changesets Version PR (the same gap the workflow's own header comment
  documents for package generation).
- Decide whether `.sessions/**` should be a standing public convention in this
  repo or a one-off, and record it in `AGENTS.md` either way — S1 answers it
  once, but the next session will face the same question.
