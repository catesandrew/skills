# Lessons

- `bin/generate-skill-package-json.mjs` refuses to create a package without `--scope`; use `--scope @catesworks`. It also refreshes every package, which bumped `packages/skill-app-hardening-audit/package.json` to 1.1.0 to match its metadata. Reverted as out of scope.
- `pnpm docs:check` fails until each skill has a `website/docs/skills/<name>.md` page and the catalog is regenerated with `node bin/generate-skill-docs.mjs`. Do both, in that order, after adding skills.
- Upstream skills use plain-verb descriptions ("Resolve merge conflicts..."). The repo bar needs "Use when..." triggering conditions.
- Upstream skills can reference host-specific tools (`control-cli`, `control-ui`). Grep for them before importing.
- Some session hooks in this environment block piping output into head or tail, and block `Read` on some paths. Use plain commands or Bash `cat`.
