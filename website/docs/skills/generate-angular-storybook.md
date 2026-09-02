---
title: Generate Angular Storybook
description: Generates an Angular component's Storybook integration — a harness component, a CSF3 stories file, and MDX documentation — deriving file paths, names, and selectors from a single component file path.
---

# generate-angular-storybook

## Why It Exists

This skill did not start life as a skill. It was migrated from a Codex custom prompt, `home/.codex/prompts/generate-angular-storybook.prompt.md` (71 lines), into `agent-skills/generate-angular-storybook/SKILL.md` (91 lines) in commit `44d082a3` ("chore: add skills for prompts", 2026-04-17), part of a bulk conversion that turned a batch of `.codex/prompts/*.prompt.md` files into the new agent-skills format alongside several `chrome-*` and `audit-*` skills. The commit message itself is generic, but the `--stat` diff is unambiguous: the old prompt file was deleted in the same commit that added this skill's file, confirming a direct content migration rather than a from-scratch skill. It was relocated (no content change) from `agent-skills/generate-angular-storybook/` to `agent-skills/skills/generate-angular-storybook/` in `856e34fa`.

## What It Does

Given just `${input:componentPath}` (e.g. `src/app/components/user-card/user-card.component.ts`), the skill auto-derives everything else it needs: the base directory, a kebab-case name, a PascalCase component name, an `app-<kebabName>` selector, and three output paths under a `stories/` subfolder — a harness component, a CSF3 stories file, and an MDX doc — plus a Storybook `title` built from the path segments under `src/`.

It generates exactly three files, always in this order. The **harness component** wraps the target for Storybook demos, importing required Angular modules/providers via `applicationConfig`, giving every `@Input()` a sensible default, and showcasing typical and advanced usage side-by-side. The **CSF3 stories file** exports a default object (`component`, `title`, `tags: ['autodocs']`, `args`, `argTypes`) and at minimum seven named stories — `Default`, `Variants`, `Interactive`, `EdgeCases`, `Accessibility`, `Loading`, `Error` — using `fn()` from `@storybook/test` for output handlers and realistic (never `lorem ipsum` or `foo/bar`) example data. The **MDX doc** follows a fixed structure (`Meta`, Usage, Variants, API Reference via `ArgTypes`, an Accessibility notes section, and an `All Stories` block), importing the stories file aliased as `StoriesFile` to avoid name collisions with Storybook's own blocks.

The response format is strict: exactly three fenced code blocks, harness → stories → MDX, each opening with a `// File: <path>` comment, and no narration outside the code blocks.

## How To Use It

Triggers on: "generate Angular Storybook harness component, CSF3 stories file, and MDX documentation for an Angular component", auto-deriving paths and names from a single component file path.

```sh
skills add -g catesandrew/skills --skill skills/generate-angular-storybook
```

```sh
npm install @catesworks/skill-generate-angular-storybook
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 52 skills as a single bundled plugin named `cw` — there is no standalone per-skill plugin.

## Gotchas & Invariants

- Every `@Input()` and `@Output()` must be demonstrated with interactive controls — no partial API coverage.
- No name collisions: when importing the CSF file into MDX, alias it (e.g. `import * as StoriesFile from './user-card.component.stories'`); keep Storybook's own blocks (`Canvas`, `Stories`, `ArgTypes`, `Meta`) un-shadowed.
- Use Storybook Angular v9+ blocks (`<Canvas of={StoriesFile.SomeStory} />`); do not nest `<Story>` inside `<Canvas>`.
- If the component wraps form controls, `id` bindings must pass through the harness/templates to satisfy dev-mode accessibility checks.
- No generic story names like `Story1` — every story name must describe the scenario it demonstrates.
- All stories must pass Storybook's accessibility addon checks.
- Output is strictly three code blocks in order with no narration outside them.

## Related Skills

- [graph-react-deps](/docs/skills/graph-react-deps) — a sibling skill from the same migration batch (commit `44d082a3`), though scoped to React/Next.js rather than Angular.

---

_Sourced from: skills/generate-angular-storybook/SKILL.md, skills/generate-angular-storybook/metadata.json, ~/.dotfiles git history (commit `44d082a3`)_
