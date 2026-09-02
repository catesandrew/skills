# Lessons — Skills docs site (2026-09-02)

## Backslash-escaping a backtick inside a single-backtick code span doesn't work in CommonMark/MDX

- **What happened:** `` `parent ? \`${parent.id}.${row.id}\` : row.id` `` in
  `data-table-builder.md` broke the Docusaurus build with
  `ReferenceError: parent is not defined`.
- **Why:** a single-backtick code span closes at the *next literal backtick*,
  full stop — a backslash before it is not an escape inside a code span.
  So the span actually closed right after `parent ? `, and everything after
  that (including `${parent.id}`) was parsed as normal markdown/MDX text,
  where `${...}` is an MDX JS expression referencing an undefined `parent`.
- **How to apply:** any inline code span whose content itself contains a
  backtick (e.g. a JS template literal) needs double-backtick fences
  (`` `` ... `` ``), not backslash-escaping.
- **Evidence:** `website/docs/skills/data-table-builder.md` line 43 (fixed
  this session).

## MDX treats a bare `<digit` outside code spans as an attempted JSX tag

- **What happened:** `"1–3 files, <100 lines"` in `jira-estimate.md` broke
  the build (`Unexpected character '1' ... expected a character that can
  start a name`); `LCP < 2.5s good` in `chrome-audit-performance.md`, right
  next to it, did not.
- **Why:** MDX only tries to start parsing a JSX tag when `<` is immediately
  followed by a valid tag-name-start character (letter, `$`, `_`, `/`, `!`)
  with no space. `<100` qualifies (digit right after `<`... actually a digit
  isn't a valid start either, which is exactly why it errors instead of
  silently parsing) — the point is `<1` has no space and gets tag-parsing
  attempted and rejected; `< 2` has a space and is never treated as a tag
  attempt at all.
- **How to apply:** any literal `<` immediately followed by a non-letter,
  non-space character in prose (not inside a code span) is a latent MDX
  break. Use `&lt;` or add a space, or wrap it in backticks.
- **Evidence:** `website/docs/skills/jira-estimate.md` (fixed this session).

## This repo's real per-skill history lives in a different repo's git log, not its own

- **What happened:** this repo's own git log is thin — one bulk
  `13fbfbc Initial import: 49 cross-agent skills migrated from dotfiles`
  commit covers 48 of 52 skills, with no per-skill rationale.
- **Why:** most skills were authored over months in a private dotfiles repo
  and only later migrated here in one sweep. `git log --follow` on the
  dotfiles side mostly came up empty too, because file paths were
  renamed/relocated several times across that repo's life (flat →
  `agent-skills/<name>` → `agent-skills/skills/<name>`), which plain
  `--follow` doesn't reliably track through non-rename-detected moves.
- **How to apply:** combine three git archaeology passes rather than relying
  on `--follow` alone: `git log --all -- '**/<name>'` (path match under any
  historical location), `git log --all --grep='<name>'` (message mentions),
  and `git log --all -S'<name>'` (pickaxe — content added/removed). Together
  these recovered real, specific provenance for nearly every skill.
- **Evidence:** all 52 `website/docs/skills/*.md` "Why It Exists" sections;
  see `data-table-builder.md` and `react-query-cache-determinism.md` for
  rich examples, `dithered-motif-site.md` for a confirmed-thin one.

## Honesty instructions + a cheap verification step beat fabrication-by-omission

- **What happened:** subagents given pre-supplied "likely commit" hypotheses
  (from an earlier broad scan) caught and corrected at least two wrong ones
  (`ui-engineer`, `zod-repair` didn't actually trace to the commit I
  suggested) and one false-positive candidate for the `pr-ado-*` skills,
  instead of just going along with the hint.
- **Why:** each batch was explicitly told not to fabricate rationale and
  given a one-line verification command (`git show --stat <hash>`) to check
  every hypothesis before writing it down.
- **How to apply:** when delegating research-heavy writing to parallel
  agents, a cheap, explicit verification step plus an explicit
  no-fabrication rule matters more than how "smart" the hint is — agents
  will use and correct a wrong hint if told to verify, but may quietly adopt
  it if not.
- **Evidence:** batch 5 and batch 8 SendMessage reports during this session.

## Linking a Vercel project from inside the target subdirectory avoids root-directory misdetection

- **What happened:** `vercel link --cwd website ...` auto-detected
  Docusaurus and built correctly with no manual "Root Directory" setting.
- **Why:** the CLI resolved the project root from the directory it was
  invoked in (`website/`), which already contains `docusaurus.config.ts` and
  its own `package.json` — nothing about the parent pnpm workspace root
  needed to be told to Vercel.
- **How to apply:** for a docs subdirectory in a monorepo, prefer
  `vercel link --cwd <subdir>` / `vercel deploy --cwd <subdir>` over linking
  from the repo root and setting Root Directory afterward.
- **Evidence:** this session's `skills-docs` Vercel project, contrasted with
  an earlier `mcp-agent-bridge-docs` deploy (per prior project memory) that
  needed an explicit `rootDirectory=website` + `framework=docusaurus-2`
  override when linked from the repo root.

---

Candidates to promote into long-term memory (if the project has a memory system):

- [ ] This repo's real skill-history archaeology lives in
      `~/.dotfiles/agent-skills/skills/<name>`, not this repo's own git log —
      check there first for any future "why does skill X exist" question.
