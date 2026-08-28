---
name: graph-react-render-tree
description: Use when you need an optimized, readable Mermaid render tree for a Next.js or React page — groups by folder, deduplicates nodes, annotates render-prop and compound-component edges, and identifies leaf nodes to mock in tests.
---

# graph-react-render-tree

Build a readable component dependency graph optimized for comprehension, not completeness. Groups nodes by folder boundary, deduplicates, and annotates non-obvious edges. Use this when `graph-react-deps` produces a graph that's too large to navigate.

## Inputs

| Variable | Description | Example |
|----------|-------------|---------|
| `${input:startFile}` | Absolute path to the page entry file | `/repo/src/app/checkout/page.tsx` |
| `${input:tsconfigFile}` | Absolute path to tsconfig (for path alias resolution) | `/repo/tsconfig.base.json` |
| `${input:repoRoot}` | Absolute path to repo root (optional) | `/repo` |
| `${input:depthLimit}` | Max recursion depth (optional, default: 5) | `4` |
| `${input:stopPackages}` | Import prefixes to stop at (optional) | `@repo/ui,@acme/design-system` |
| `${input:stopFolders}` | Folder substrings to treat as terminals (optional) | `/packages/ui/,/shared/components/` |

## Traversal Rules

1. **Resolve imports** via tsconfig `paths` + relative imports.
2. **Follow components that are:**
   - Directly rendered in JSX
   - Returned from a local wrapper component
   - Part of a compound component pattern (`Foo.Bar`)
3. **Stop traversal when:**
   - Import matches `${input:stopPackages}` prefix or is in `node_modules`
   - Import path contains a substring from `${input:stopFolders}`
   - Depth exceeds `${input:depthLimit}`
4. **Include stopped nodes as terminals** — label them with their package/folder name.
5. **Deduplicate** — if a component appears in multiple places, use one node with multiple incoming edges.

## Graph Requirements

### Subgraph grouping
Group nodes into labeled subgraphs by folder boundary:
- **Route segment** — the page file itself
- **Local feature folder(s)** — components colocated with the page
- **Shared package(s)** — design system / shared component packages

### Edge annotation
Annotate edges when the relationship is non-obvious:
- `--render-prop-->` — component passed as a function prop
- `--as-prop-->` — component passed as an `as` prop
- `--compound-->` — `Parent.Child` compound pattern
- `--wrapper-->` — component returned from a local wrapper

### Output format
```
flowchart TD
  subgraph route ["app/checkout"]
    A["page.tsx"]
  end

  subgraph feature ["features/checkout"]
    B["CheckoutForm"]
    C["OrderSummary"]
  end

  subgraph shared ["@repo/ui"]
    D["Button (terminal)"]
    E["Modal (terminal)"]
  end

  A --> B
  A --> C
  B --render-prop--> D
  C --> E
```

## Deliverables

### 1. Mermaid diagram
With subgraphs and annotated edges.

### 2. Fan-out list (sorted descending)
Components ranked by number of direct children they render:
```
CheckoutForm: 6 children
OrderSummary: 3 children
...
```

### 3. Leaf / terminal nodes
Design system and shared components that appear as terminals — these are the ones to mock in unit tests:
```
@repo/ui: Button, Modal, TextInput, Select
@acme/icons: CheckIcon, ArrowIcon
```

### 4. Unresolved imports
Any imports that could not be resolved, with paths and reason.

## Notes
- This graph trades completeness for readability. If you need every component, use `graph-react-deps` with a high depth limit.
- Subgraph names should reflect the domain/feature, not just the folder path.
- For very large graphs, consider splitting into two diagrams: one for server components, one for client components.

## Common Mistakes
- **Too many subgraphs** — aim for 3–5 subgraphs; more creates visual noise.
- **Not deduplicating** — the same shared component appearing 12 times pollutes the graph; always deduplicate.
- **Missing compound components** — `Table.Row`, `Form.Field` etc. are easy to miss when only scanning JSX tags.
