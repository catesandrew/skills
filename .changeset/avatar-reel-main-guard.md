---
"@catesworks/skill-avatar-reel": patch
---

Fix the CLI main-module guard in `heygen.mjs`, `cues.mjs` and `trim.mjs`: it compared a percent-encoded `import.meta.url` to a raw `argv[1]`, so on a path with a space (or a symlinked install) the scripts exited 0 with no output. Also make `env.mjs` report "not configured" when `op read` returns an empty value (the branch was unreachable dead code).
