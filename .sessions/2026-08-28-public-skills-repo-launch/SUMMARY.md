# Summary — Public skills repo launch (2026-08-28)

## Goal

Stand up a new public repo, `github.com/catesandrew/skills`, structured like
`next-starters` minus the Next.js templates, to hold general-purpose agent
skills — starting with a new `dithered-motif-site` skill and a migration of
the portable skills from `~/.dotfiles/agent-skills`.

## What was done

### `dithered-motif-site` skill (authored earlier this session, into `~/.agents/skills/`)

Pulled the image/video prompt patterns and canvas dither-engine algorithm off
a Skool classroom page (`chrome` MCP navigate + snapshot) and packaged them
as a new skill:

- `SKILL.md` — trigger description, pipeline overview, load-bearing gotchas
  (pinned auto-levels, invert-is-about-the-source, crop-before-scale,
  radial-ripple trap, blend-mode-only-on-light-grounds)
- `references/image-prompts.md`, `references/video-prompts.md` — Higgsfield
  `nano_banana_pro` / `seedance_2_0` prompt patterns
- `references/frame-extraction.md` — ffmpeg commands
- `references/dither-engine.md` — full algorithm spec
- `references/dither-engine.ts` — reference TypeScript implementation,
  verified with `npx tsc --noEmit`

### `catesandrew/skills` repo (`/Volumes/dev-ssd/repos/personal/skills`)

- Audited all 56 skill directories in `~/.dotfiles/agent-skills/skills` for
  public-repo safety: absolute machine paths, secrets/tokens, real emails,
  and employer/client-specific names. Found and excluded:
  - `repo-portfolio-deep-dive` — hardcoded to `/Volumes/dev-ssd/clients/...`
    and named personal client repos (tomahawk-salon, client-os, baro) in its
    `SKILL.md` and `evals/evals.json`.
  - `ado-development`, `ado-monitor`, `ado-new-ticket`,
    `ado-story-from-figma`, `ado-update-ticket`, `ado-update-tickets` —
    hardcoded to a specific employer's Azure DevOps org
    (`dev.azure.com/cudirect/Origence`) and area-path convention
    (`Origence\The Forge\Forge Command`).
  - `baseline-design` — a specific employer/client's ("CUDirect/Origence")
    internal Angular design system.
- Fixed one pre-existing naming inconsistency while migrating: renamed dir
  `spec-kit` → `spec-kit-skill` to match its own `SKILL.md` frontmatter
  `name:` field (dotfiles' own `AGENTS.md` quality bar requires this match).
- Scaffolded the repo: `.claude-plugin/marketplace.json` (single `skills`
  plugin listing all 49 skill paths, same shape as `next-starters`'
  `.claude-plugin/marketplace.json`), `README.md` (categorized skill
  catalog + install instructions for both the Claude Code plugin path and
  the `skills` CLI path), `AGENTS.md` (skill-authoring quality bar, explicit
  no-hardcoded-org/path rule since the repo is public), `LICENSE` (MIT,
  matching `next-starters`), `.gitignore`.
- Copied 48 vetted skills from `~/.dotfiles/agent-skills/skills` +
  `dithered-motif-site` into `skills/` (49 total). Source directories in
  `~/.dotfiles/agent-skills` were left untouched — user will clean those up
  themselves.
- Ran a final full-repo sweep (paths, secrets, org names, real emails)
  immediately before pushing — clean.
- `git init`, committed, then `gh repo create catesandrew/skills --public
  --source=. --remote=origin --push`.

## Verification

- `npx tsc --noEmit` on `dither-engine.ts` — no errors.
- Script-verified every one of the 49 skill directories has a matching
  entry in `README.md` (no skill silently undocumented).
- Grep sweep for `/Users/<name>`, `/Volumes/dev-ssd`, AWS/OpenAI/GitHub
  token patterns, `origence|cudirect|forge command|envmgr|ad-infrastructure|
  podzilla`, and non-placeholder emails across the assembled repo — zero
  hits before push.
- `gh repo view catesandrew/skills` confirmed the repo now exists and is
  public at `https://github.com/catesandrew/skills`; `git log --oneline`
  shows the single commit on `main` matching `origin/main`.
- Not verified: none of the 49 migrated `SKILL.md` files were re-read
  end-to-end for content correctness — the audit was for
  public-repo-safety (secrets/paths/org names), not a content/quality
  review of skills that were already in daily use.

## Commits

| SHA | Repo | Message | Pushed? |
|-----|------|---------|---------|
| `13fbfbc` | `catesandrew/skills` | Initial import: 49 cross-agent skills migrated from dotfiles | yes |

## Out of scope / deferred

- Cleaning up `~/.dotfiles`, `~/.dotfiles/agent-skills`, and
  `~/.agents/skills` — the user explicitly reserved this for themselves
  after migration.
- The 7 excluded employer/client-coupled skills were not genericized or
  ported in redacted form — they were simply left where they are.
- No `.claude-plugin` install/smoke-test was performed against the new
  marketplace (e.g. `/plugin marketplace add catesandrew/skills` was not
  actually run).
