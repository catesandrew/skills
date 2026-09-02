# Follow-ups — Skills docs site (2026-09-02)

## Blocked on the user (decisions / approvals / access)

- [ ] Push commit `f710d60` (`website/.gitignore`) to `origin/main` — this
      session was only asked to commit, not push. Push when ready:
      `git push origin main`. (The two earlier commits, `565c818` and
      `e152ad2`, are already pushed.)
- [ ] Decide whether to wire GitHub-integration auto-deploy for the
      `skills-docs` Vercel project (so future doc edits go live automatically
      on push to `main`) or keep the current CLI-only deploy flow
      (`vercel deploy --cwd website --prod`, run manually after doc changes).

## Blocked on work (do next)

- [ ] If auto-deploy is wanted: connect the `catesandrew/skills` GitHub repo
      to the `skills-docs` Vercel project (dashboard, or `vercel git connect`
      from `website/`); verify it inherits `website/` as the build root, set
      it explicitly if not.
- [ ] Add a CI check that runs `node bin/generate-skill-docs.mjs --check`
      (and ideally `pnpm --filter website build`) so a new skill without a
      deep-dive page, or a stray MDX-breaking character, fails CI instead of
      only surfacing on the next manual deploy.

## Nice-to-have / later

- [ ] Port `next-starters`' `HomepageStats`/`HomepageFeatures` homepage
      sections if a richer landing page is wanted — this session kept the
      homepage to a minimal hero for scope reasons.
- [ ] Turn on the Docusaurus blog (`blog: false` currently) and write a
      first post — `BLOG.md` in this dossier is a ready draft to adapt.

## Known risks / watch-outs

- Any new MDX-breaking prose pattern (a bare `<` immediately followed by a
  digit/symbol outside a code span, or a backtick-containing code span using
  single-backtick fences) will silently break `pnpm build` until someone
  runs it — there's no CI running the website build automatically yet.
- The live site is not tied to `git push` — someone could push new doc
  changes assuming they're live when `skills.catesworks.dev` is still
  serving the last manual `vercel deploy --prod`.

## Done this session (for reference)

- [x] `website/` Docusaurus site scaffolded, typechecked, built clean (`565c818`)
- [x] 52 deep-dive pages + generated catalog, grounded in real archaeology (`565c818`)
- [x] Deployed to Vercel; live at `skills.catesworks.dev` (CLI deploy, not tied to a commit)
- [x] `README.md` linked to the live docs site (`e152ad2`)
- [x] `website/.gitignore` committed (`f710d60`, pending push)
