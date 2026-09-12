# Open Questions

## Public repo launch follow-ups - 2026-09-06

- [ ] Is `.claude-plugin/plugin.json` required for a marketplace entry using
      `source: "./"` with `strict: false`? — Determines whether the plugin
      loads at all; unanswered it is the most likely cause of a smoke-test C2/C3
      failure. (Plan Step 1 resolves this.)
- [ ] Who runs the plugin-install smoke test, and when? — Step 3 cannot be
      automated; the whole smoke-test lane stalls until a human runs it in a
      separate Claude Code session on an unrelated repo.
- [ ] Distill anything from the 7 excluded employer-coupled skills, and if so
      what? — The judgment call the launch dossier explicitly reserved for a
      human. Options: nothing / `ado-*` core only / `baseline-design`
      methodology only / both. (Plan Step 6.)
- [ ] If the `ado-*` group is distilled, should it become 6 near-duplicate
      skills or 1 parameterized work-item skill? — Six 50-line wrappers over
      one shared reference would add catalog noise; consolidation changes the
      whole shape of Step 7.
- [ ] Is a de-branded `baseline-design` a real skill or an empty shell? — Its
      logos, licensed icon font, and product token values cannot ship publicly,
      and `ui-engineer` / `frontend-quality-loop` may already cover the residue.
- [ ] Should the npm / `skills` CLI channel (`packages/skill-*`) get its own
      smoke test? — Deliberately out of scope here, but it is equally unproven.

## Skills docs-site follow-ups (2026-09-06-skills-docs-site-followups) - 2026-09-06

- [ ] Approve pushing the 4 pending commits to `origin/main`? — S1 is blocked
      on this; nothing downstream (auto-deploy) can proceed until repo state
      is settled.
- [ ] Is publishing `.sessions/2026-09-02-skills-docs-site/**` (commit
      `6d454b8`) to a public repo intended? — It ships internal session notes,
      lessons, ADRs, and a blog draft under the user's name.
- [ ] Is publishing `.cbmignore` (`77f5a6e`) and `.beads/**` (`e3f07f2`,
      incl. 5 git hooks + config) to a public repo intended? — Exposes local
      agent-tooling setup; also sets a precedent for the repo.
- [ ] What happens to the untracked `.beads/PRIME.md`: commit, gitignore, or
      leave untracked? — Currently dangling in `git status`.
- [ ] Wire Vercel GitHub auto-deploy for `skills-docs`, or stay CLI-only? —
      S2; determines whether merging docs changes publishes them, and whether
      S3 happens at all.
- [ ] Do we actually want the richer homepage (`HomepageStats` /
      `HomepageFeatures`)? — S5 is a taste call, not a technical need; the
      current minimal hero was a deliberate scope decision.
- [ ] Human review of the adapted blog post before it publishes? — S6 puts
      public writing under the user's name; the draft's own header demands
      sanitization.
- [ ] Should `node bin/generate-skill-docs.mjs --check` also be added to the
      root `release` script? — `verify` never runs on the Changesets Version
      PR, so CI alone leaves a gap (deferred as a follow-up, not decided).
