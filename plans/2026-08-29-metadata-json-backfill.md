# Plan: Backfill `metadata.json` for 50 skills missing it

**Status:** pending approval
**Mode:** Direct (detailed request, one scope decision resolved via AskUserQuestion)
**Repo:** `catesandrew/skills` (`/Volumes/dev-ssd/repos/personal/skills`)

## Requirements Summary

Only 2 of 52 skills in this repo (`commit-message`, `tsdoc`) currently have a
`skills/<name>/metadata.json`. The `skill-channel-rollout` scaffold added to
this repo (pnpm workspace + Changesets + `bin/generate-skill-package-json.mjs`
+ `bin/generate-marketplace.mjs`) hard-requires `metadata.json` per skill —
without it, package generation skips the skill and marketplace generation
fails outright. This plan adds `metadata.json` to the other 50 skills,
matching the schema and conventions already used by this repo's 2 existing
files and by the sibling `next-starters` repo (the pipeline's origin).

**Blocking finding surfaced before this plan was drafted:** both existing
`metadata.json` files have `"organization": "CU Direct"` — an employer name
leaked from the original private-dotfiles migration, violating this repo's
own AGENTS.md bar ("no hardcoded employer/client names... this repo is
public") and feeding directly into `generate-marketplace.mjs`'s
`manifest.owner.name` output. User confirmed via `AskUserQuestion`: use
`"organization": "Personal"` everywhere (matches `next-starters`' own
convention exactly), and fix the 2 existing files as part of this work.

## Schema (established by the 2 existing files + next-starters)

```json
{
  "version": "1.0.0",
  "organization": "Personal",
  "date": "August 2026",
  "abstract": "<1-3 sentence declarative description of what the skill does>",
  "references": ["references/<file>", "..."]
}
```

- `version`: `"1.0.0"` for every new file (first version; matches the 2
  existing files).
- `organization`: `"Personal"` for all 52 skills (new 50 + fix on the 2
  existing).
- `date`: `"August 2026"` for all 50 new files — verified via
  `git log --diff-filter=A --date=format:'%B %Y'` per skill; every one of the
  50 was first added to this repo in August 2026 (no earlier history to
  preserve).
- `abstract`: authored per skill from that skill's own `SKILL.md`
  description/body — declarative style matching the existing two (e.g.
  tsdoc's "Adds inline TSDoc to staged TypeScript code with deeper
  documentation..."), not the frontmatter's "Use when..." trigger phrasing.
  Not a mechanical copy of the frontmatter `description` — condensed and
  reworded to describe the capability, matching house style.
- `references`: **only present for the 11 skills that have a `references/`
  directory**, listing every file in it as an explicit `references/<path>`
  entry (matches what `bin/validate-skill-package.mjs` will check against the
  packed tarball). Omitted entirely for the other 39 skills — an absent key
  is treated as `[]` by every consuming script.

## Skills receiving `references` arrays (11 of 50)

| Skill | Files |
|---|---|
| `design-critique-loop` | `references/screenshot-harness.md` |
| `dithered-motif-site` | `references/image-prompts.md`, `references/dither-engine.ts`, `references/video-prompts.md`, `references/frame-extraction.md`, `references/dither-engine.md` |
| `microservice-docs` | 12 files under `references/` (MERMAID-EXAMPLES.md, ARCHITECTURE-TEMPLATES.md, DOCUMENTATION-INDEX-TEMPLATE.md, LANGUAGE-EXAMPLES.md, API-CONTRACT-TEMPLATE.md, DATA-MODEL-TEMPLATES.md, OPENAPI-SPEC-TEMPLATE.md, INFRASTRUCTURE-TEMPLATES.md, DEPENDENCY-TEMPLATES.md, DATA-LINEAGE-TEMPLATES.md, PROJECT-OVERVIEW-TEMPLATE.md, SEQUENCE-DIAGRAM-TEMPLATES.md) |
| `react-hooks-closures` | `references/patterns.md` |
| `react-query-patterns` | `references/render-performance.md`, `references/typescript.md`, `references/query-keys.md` |
| `react-use-state` | `references/use-reducer-patterns.md` |
| `scroll-video-site` | `references/scroll-video-engine.tsx`, `references/scroll-video-engine.md` |
| `session-wrap` | `references/ARCHITECTURE.md`, `references/SUMMARY.md`, `references/BLOG.md`, `references/LESSONS.md`, `references/handoff-README.md`, `references/FOLLOWUPS.md`, `references/adr-template.md` |
| `tanstack-table-patterns` | `references/shadcn-integration.md`, `references/editable-tables.md` |
| `typescript-type-safety` | `references/patterns.md` |

The remaining 39 (`agent-browser`, `ai-governance`, `audit-a11y-code`,
`audit-react-component`, `chrome-audit-bundles`, `chrome-audit-console`,
`chrome-audit-css`, `chrome-audit-network`, `chrome-audit-performance`,
`chrome-debug-screenshot`, `chrome-diff-screenshot`, `chrome-dump-storage`,
`chrome-inspect-a11y`, `chrome-inspect-element`, `chrome-run-flow`,
`data-table-builder`, `excel-like-table-navigation`, `frontend-quality-loop`,
`frontend-scaffold`, `generate-angular-storybook`, `graph-react-deps`,
`graph-react-render-tree`, `jira-estimate`,
`nextjs-react-query-cache-coordination`, `nuqs-url-state`,
`point-cloud-assembly-scene`, `pr-ado-code-review`, `pr-ado-open`,
`pr-gh-code-review`, `pr-gh-open`, `procfile-manager`,
`react-component-patterns`, `react-query-cache-determinism`,
`react-ref-callbacks`, `reflect-instructions`, `spec-kit-skill`, `swagger`,
`ui-engineer`, `zod-repair`, `zustand-patterns`) get no `references` key.

## Related finding — not in scope, flagged for a separate decision

The 2 existing files' `references` arrays point at **external URLs**
(`https://www.conventionalcommits.org/...`, `https://tsdoc.org`, ...), not
package-relative files. `bin/validate-skill-package.mjs` checks every
`references` entry against the *packed tarball's file list* — an external
URL will never be in that list, so `commit-message` and `tsdoc` will fail
`--check`/`--all` validation the first time the pipeline actually runs,
independent of this plan. Fixing this (drop the field, or convert to a
`references/EXTERNAL.md` doc file) is a separate, small decision this plan
does not make unasked — flagged here so it isn't mistaken for scope creep
if/when validation is run and fails on exactly these two.

## Acceptance Criteria

1. All 52 `skills/*/metadata.json` files exist and are valid JSON.
2. Every file's `organization` field is exactly `"Personal"` (including the 2
   existing files, changed from `"CU Direct"`).
3. Every new file's `version` is `"1.0.0"`, `date` is `"August 2026"`.
4. Every `abstract` is non-empty, declarative (not "Use when..." phrasing),
   and accurately describes that skill's actual content (spot-checkable
   against its `SKILL.md`).
5. Exactly the 11 skills listed above have a `references` array, and each
   array's entries exactly match that skill's `references/` directory
   listing (no extra, no missing, no `skills/<name>/` prefix, no directory
   entries) — verified by running
   `node <skill-channel-rollout>/references/check-reference-normalization.mjs --dir skills`
   and confirming zero `no metadata.json` anomalies remain (the 2
   external-URL anomalies on `commit-message`/`tsdoc` are expected to
   persist — see "Related finding" above, out of scope here).
6. `git diff --stat` after this work touches only `skills/*/metadata.json`
   files — no `SKILL.md` or other content files modified.

## Implementation Steps

1. For each of the 50 skills, read `skills/<name>/SKILL.md` and author a
   1-3 sentence `abstract` in declarative style.
2. Write `skills/<name>/metadata.json` per the schema above — `references`
   key included only for the 11 skills listed, enumerating their actual
   `references/` files exactly.
3. Update `skills/commit-message/metadata.json` and
   `skills/tsdoc/metadata.json`: change `"organization": "CU Direct"` to
   `"organization": "Personal"`. No other field changes.
4. Run `node <skill-channel-rollout-skill-path>/references/check-reference-normalization.mjs --dir skills`
   and confirm all 50 "no metadata.json" anomalies are gone.
5. Update `AGENTS.md`/`README.md` only if either currently documents the
   metadata.json convention incorrectly (spot-check; likely no change
   needed — neither currently asserts an organization value).

## Risks and Mitigations

- **Risk:** an authored `abstract` drifts from what the skill actually does
  (hallucinated capability). **Mitigation:** each abstract is grounded in a
  direct read of that skill's own `SKILL.md`, not inferred from the
  directory name alone; acceptance criterion 4 requires spot-checkability.
- **Risk:** a `references` array entry typo'd relative to the real file
  (e.g. wrong extension, missing file). **Mitigation:** the `find
  <skill>/references -type f` listing captured during planning (this
  document) is copied verbatim into each file's `references` array, not
  retyped from memory.
- **Risk:** scope creep into fixing the external-URL `references` issue on
  `commit-message`/`tsdoc`. **Mitigation:** explicitly called out as related
  but out of scope; only the `organization` field changes on those two
  files.

## Verification Steps

1. `python3 -c "import json,glob; [json.load(open(f)) for f in glob.glob('skills/*/metadata.json')]"` — all 52 parse as valid JSON.
2. `grep -L '"organization": "Personal"' skills/*/metadata.json` — empty output (every file has the correct organization).
3. `node <skill-channel-rollout>/references/check-reference-normalization.mjs --dir skills` — zero `no metadata.json` anomalies; only the 2 known external-URL anomalies remain.
4. `git diff --stat` — only `skills/*/metadata.json` paths touched.

## Follow-ups (not part of this plan)

- Decide how to handle `commit-message`/`tsdoc`'s external-URL `references`
  entries before actually running `bin/validate-skill-package.mjs --all`.
- Once all 52 have valid `metadata.json`, `bin/generate-skill-package-json.mjs`
  and `bin/generate-marketplace.mjs` become runnable end-to-end for the
  first time — still a separate, explicit step (this plan only adds the
  metadata, per the `skill-channel-rollout` skill's own no-execution
  boundary already in effect this session).
