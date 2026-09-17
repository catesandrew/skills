# Per-Repo / Per-Package Stack Detection

| Marker | Stack signal |
|---|---|
| `*.csproj` / `*.sln` | .NET — read `<TargetFramework>` |
| `package.json` | Node/TS — read `main`/`scripts`/deps |
| `go.mod` | Go |
| `pyproject.toml` / `requirements.txt` / `Pipfile` | Python — check FastAPI/Django/Flask in deps |
| `Gemfile` | Ruby/Rails |
| `pom.xml` / `build.gradle` | JVM |
| `Cargo.toml` (no `[workspace]`) | Rust |
| `mix.exs` | Elixir |
| no source, only a README stub | likely empty/placeholder — say so plainly |

Adapt the concrete grep patterns to whatever stack this table found for
the specific repo or workspace member under analysis. Don't port
stack-specific assumptions (a .NET DI container convention, a Node bundler
convention, etc.) onto a repo using a different stack just because a
prior unit in this same corpus run used them.
