# Importing four agent skills without importing their assumptions

I keep a public library of agent skills. This week I pulled four from another team's open-source plugin set: merge-conflict resolution, a pre-ship review, a deliberately harsh code-quality review, and a claim-verification skill.

Copying the files took a minute. Fitting them in took the rest of the session.

**Descriptions are the trigger.** The originals described what the skill does. Agent harnesses match on when to use it, so each one became a "Use when..." sentence listing the situations that should fire it.

**Check for host assumptions.** The verification skill named two tools that exist only in the original host. I swapped in generic equivalents (terminal transcripts, a browser DevTools MCP, Playwright) and made the artifact directory a parameter.

**Respect the license, visibly.** The source was MIT. Each skill's metadata links back to the original, and the docs say "adapted".

**Generated files are part of the change.** A new skill touches a marketplace manifest, per-skill package files, a catalog page, and a docs deep-dive. The repo's checks failed until all were in sync, which is exactly what they are for.
