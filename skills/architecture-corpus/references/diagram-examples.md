# Dependency Diagram Conventions

## Mermaid legend (edge types)

```
A -->|sync| B     %% synchronous call (HTTP, RPC, direct import)
A -.->|async| B   %% queue/topic/webhook/event-bus
A ==>|build| B    %% build-time or provisioning dependency
```

## Clustering

Cluster by role first (frontends / aggregation-composers / core domain /
platform-shared / infra / tooling), then, within a workspace repo that
has multiple packages, sub-cluster by **filesystem boundary (the repo)**
vs. **build/publish boundary (each package)** — a subgraph per repo,
nodes inside it per package, so a reader can tell "these ship together"
from "these are independently deployable."

```mermaid
graph LR
  subgraph repo-a [repo-a (workspace)]
    pkg1[packages/api]
    pkg2[packages/worker]
  end
  frontend[frontend-app] -->|sync| pkg1
  pkg1 -.->|async| pkg2
```

## `diagrams/dependency-graph.mmd` format

One edge per line, using the same three operators as the legend above, a
comment header documenting the legend, e.g.:

```
%% legend: --> sync, -.-> async, ==> build-time
frontend-app --> repo-a/packages/api
repo-a/packages/api -.-> repo-a/packages/worker
repo-a/packages/worker ==> shared-infra
```

A dense graph (dozens of nodes, hundreds of edges) should not be
force-fit into one rendered node-link diagram in the aggregate
`README.md` — the `.mmd` source is for downstream parsing/chunking; keep
it clean rather than trying to make it visually complete.
