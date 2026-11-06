# Summary — 2026-11-05

## skills (`7a28120`)

- Source: `cursor/plugins` → `cursor-team-kit/skills/{fix-merge-conflicts,review-and-ship,thermo-nuclear-code-quality-review,verify-this}`. Upstream license: `cursor-team-kit/LICENSE` (MIT).
- `skills/<name>/SKILL.md` + `metadata.json` (category `delivery-workflow`, `source` URL) for each.
- `description` rewritten to "Use when..." form (repo rule).
- `skills/verify-this/SKILL.md`: `control-cli`/`control-ui` replaced with generic tools; `/tmp/verify-this` → `${input:artifactDir:/tmp/verify-this}`.
- `thermo-nuclear-code-quality-review`: body verbatim; keeps `disable-model-invocation: true`.
- Generated: `.claude-plugin/marketplace.json` (73 skills), `packages/skill-*/package.json` (4 new), `pnpm-lock.yaml`, `website/docs/skills-catalog.md`.
- Hand-written: 4 README table rows, 4 `.changeset/*-new-skill.md`, 4 `website/docs/skills/*.md` deep-dive pages.
- Not pulled: `thermos/` plugin skills (`thermo-nuclear-review`, a subagent variant of the quality review), `cursor-team-kit/agents/`.

## Verification

- `node bin/check-skills.mjs` — OK, 73 skills.
- `pnpm docs:check` — OK.
- `pnpm build` / `pnpm test` not run (`node_modules` absent).
