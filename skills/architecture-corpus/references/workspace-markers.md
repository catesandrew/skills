# Workspace & Monorepo Markers

| Marker | Workspace signal |
|---|---|
| `pnpm-workspace.yaml` | pnpm workspace — read the `packages:` glob list |
| `turbo.json` | Turborepo (usually paired with a pnpm/npm/yarn workspace) |
| `nx.json` | Nx monorepo |
| `lerna.json` | Lerna-managed workspace |
| root `Cargo.toml` with a `[workspace]` table | Cargo workspace |
| `go.work` | Go workspace |
| `package.json` with a top-level `"workspaces"` array (npm/yarn) | npm/yarn workspaces |

A marker alone is not sufficient — apply the two-level guard from Step 1
of `SKILL.md` before treating a repo as a workspace or a member as a real
doc unit:

1. **Repo level**: marker present **and** at least one non-empty
   `apps/*`/`packages/*` (or the marker's own configured glob) member
   directory exists. No qualifying member → fall back to whole-repo
   treatment.
2. **Member level**: an empty or scaffold-only member (e.g. a directory
   with only a `package.json` and no source) is flagged the same way an
   empty whole-repo would be in Step 0 — noted, not silently skipped.
