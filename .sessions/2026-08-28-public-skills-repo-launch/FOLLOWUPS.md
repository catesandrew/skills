# Follow-ups — Public skills repo launch (2026-08-28)

## Blocked on the user (decisions / approvals / access)

- None. The migration this session is complete and pushed.

## Blocked on work (do next)

- None required. Optional continuations below.

## Nice-to-have / later

- [ ] Decide whether any of the 7 excluded employer-coupled skills
      (`ado-development`, `ado-monitor`, `ado-new-ticket`,
      `ado-story-from-figma`, `ado-update-ticket`, `ado-update-tickets`,
      `baseline-design`) have a genuinely portable core worth distilling
      into a generic version for this repo — c.f. how
      `SKILLS-AUDIT-2026-08.md` in `~/.dotfiles/agent-skills` handled a
      similar envmgr-vs-dotfiles drift by distilling 3 new generic skills
      out of large repo-specific ones, rather than porting as-is.
- [ ] Smoke-test the plugin install path end-to-end from a different repo:
      `/plugin marketplace add catesandrew/skills` then
      `/plugin install skills@skills`.
- [ ] Consider adding a repo topic/description update on GitHub and a
      short "why this repo exists" note if it'll be shared publicly beyond
      personal use.

## Known risks / watch-outs

- The repo is public — any future skill added here needs the same
  org-name/path/secret sweep this session used (see `LESSONS.md`). Don't
  assume "it came from a personal dotfiles repo" means it's already clean.

## Done this session (for reference)

- [x] Authored `dithered-motif-site` skill (`~/.agents/skills/dithered-motif-site/`)
- [x] Created `catesandrew/skills` repo, public, at
      `/Volumes/dev-ssd/repos/personal/skills`
- [x] Migrated 49 skills, wrote `README.md`/`AGENTS.md`/`LICENSE`/
      `.claude-plugin/marketplace.json`
- [x] Committed and pushed to `main` (`13fbfbc`)
