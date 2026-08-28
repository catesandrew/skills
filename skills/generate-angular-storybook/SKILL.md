---
name: generate-angular-storybook
description: Use when you need to generate Angular Storybook harness component, CSF3 stories file, and MDX documentation for an Angular component — auto-derives paths and names from a single component file path.
---

# generate-angular-storybook

Generate three files for an Angular component's Storybook integration: a harness component, a CSF3 stories file, and MDX documentation. Provide just the component path and the generator derives everything else.

## Inputs

| Variable | Description | Example |
|----------|-------------|---------|
| `${input:componentPath}` | Absolute or relative path to the component file (fast mode: derives all other inputs) | `src/app/components/user-card/user-card.component.ts` |
| `${input:component}` | Component class name in PascalCase (optional, derived if omitted) | `UserCard` |
| `${input:selector}` | Component selector (optional, derived if omitted) | `app-user-card` |
| `${input:baseDir}` | Base directory for output (optional, derived if omitted) | `src/app/components/user-card` |
| `${input:description}` | Component description and purpose | `Displays a user's avatar, name, and role with action buttons` |
| `${input:api}` | Inputs, outputs, slots, services, dependencies | `@Input() user: User; @Output() onEdit: EventEmitter` |
| `${input:states}` | Variants, states, and edge cases to cover | `default, loading, error, admin-only actions, mobile` |
| `${input:data}` | Example data or fixtures (optional) | `{ id: 1, name: "Jane Smith", role: "admin" }` |

## Auto-derivation Rules (when `componentPath` is provided)

```
baseDir    = directory containing the component file
kebabName  = filename without .component.ts (or .ts fallback)
component  = kebabName → PascalCase  (e.g. user-card → UserCard)
selector   = app-<kebabName>  (unless provided)
harnessPath = ${baseDir}/stories/${kebabName}.harness.component.ts
storiesPath = ${baseDir}/stories/${kebabName}.component.stories.ts
mdxPath     = ${baseDir}/stories/${kebabName}.component.mdx
title       = path segments from src/ → PascalCase component name  (e.g. "Components/UserCard")
```

## Files to generate (three, in this order)

### 1. Harness Component — `${kebabName}.harness.component.ts`
- Wraps the component for Storybook demos.
- Import all required Angular modules and providers using `applicationConfig`.
- Fully typed inputs/outputs; sensible defaults for all `@Input()` props.
- Template that showcases typical and advanced usage side-by-side.
- Use `@Component({ standalone: true })` pattern when appropriate.

### 2. Stories File — `${kebabName}.component.stories.ts`
- Default export: `{ component, title, tags: ['autodocs'], args, argTypes, excludeStories }`.
- Include at minimum these named stories: `Default`, `Variants`, `Interactive`, `EdgeCases`, `Accessibility`, `Loading`, `Error`.
- CSF3 style: each story is `export const Name: Story = { args: {...} }`.
- Use `fn()` from `@storybook/test` for `@Output()` event handlers.
- Rich, realistic example data — no `lorem ipsum`, no `foo/bar`.
- TSDoc on complex stories explaining the scenario being demonstrated.

### 3. MDX Docs — `${kebabName}.component.mdx`
Structure:
```
<Meta of={StoriesFile} />          ← import aliased as StoriesFile
# ComponentName
Short description.
## Usage
<Canvas of={StoriesFile.Default} />
## Variants
<Canvas of={StoriesFile.Variants} />
## API Reference
<ArgTypes of={StoriesFile} />
## Accessibility
Notes on keyboard nav, ARIA roles, focus management.
## All Stories
<Stories />
```

## Global Requirements
- Demonstrate **every** `@Input()` and `@Output()` with interactive controls.
- Use realistic scenarios, edge cases, loading/error/empty states.
- TypeScript-first with strict types throughout.
- **No name collisions:** when importing CSF files into MDX, alias them (e.g. `import * as StoriesFile from './user-card.component.stories'`). Keep Storybook block imports (`Canvas`, `Stories`, `ArgTypes`, `Meta`) un-shadowed.
- **Storybook blocks for Angular v9+** (`@storybook/addon-docs/blocks`): prefer `<Canvas of={StoriesFile.SomeStory} />`; do not nest `<Story>` inside `<Canvas>`.
- **Required accessibility IDs:** if the component wraps form controls, ensure `id` bindings are passed through harness/templates to satisfy dev-mode checks.

## Response Format
Return exactly three fenced code blocks in order: harness → stories → MDX.
Begin each block with a comment containing the auto-derived file path:
```ts
// File: src/app/components/user-card/stories/user-card.harness.component.ts
```
No narration outside the code blocks.

## Quality Bar
- Stories double as documentation and a testing playground.
- Interactions must surface in the Actions panel.
- No `Story1` or generic names — every story name describes the scenario.
- All stories pass Storybook's accessibility addon checks.
