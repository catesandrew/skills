# Operations Surface Markers

Emit the Operations Surface section only when one of these fires. Never
duplicate Deploy Shape's CI-pipeline-file coverage here.

| Marker | Signal |
|---|---|
| `.changeset/` directory | Release tooling (Changesets) |
| `release-please-config.json` | Release tooling (release-please) |
| `semantic-release` in `dependencies`/`devDependencies` | Release tooling (semantic-release) |
| `@opentelemetry/*` in dependencies | Observability (OpenTelemetry) |
| `@sentry/*` in dependencies | Observability (Sentry) |
| a `datadog`-prefixed dependency | Observability (Datadog) |
| `prom-client` in dependencies | Observability (Prometheus client) |

No marker fires → omit the section silently. Do not write a "no
operations surface found" line — that is noise, not evidence.
