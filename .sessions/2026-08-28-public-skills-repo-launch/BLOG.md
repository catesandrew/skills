<!--
PUBLIC blog post draft. ⚠ SANITIZE before publishing:
  - Remove client names, internal repo/package names, hostnames, ticket ids, secrets.
  - Generalize the setting ("a multi-tenant SaaS", "an internal infra monorepo").
  - When in doubt, leave it out. Ask the user before publishing anywhere.
  Keep it a story about the PROBLEM and the TECHNIQUE, not the proprietary system.
-->

# Splitting a personal skills library by coupling, not by folder

*A "generic vs. coupled" test is a better boundary for a public agent-skills
repo than "which project was I in when I wrote it."*

## The problem

Skills for AI coding agents accumulate the way utility scripts do: some
start project-specific and never leave, some are generic from day one, and a
lot start generic and quietly pick up project-specific assumptions over
time. After a while you end up with a pile that's a mix of both, with no
clean line between "safe to publish" and "not."

That's a fine state for a private collection. It stops being fine the moment
you want a public repo of them — because now every skill has to earn its
place by being genuinely reusable, not just genuinely useful to you.

## What I tried

Rather than deciding membership by "which repo did this come from," I
applied one test per skill: is it coupled to a specific machine, employer,
or client — hardcoded paths, an internal org's issue-tracker URL and naming
convention, a specific company's internal design system — or is it actually
generic?

The mechanical part is easy: grep for absolute home-directory paths, secret
and token patterns, and anything that looks like a credential. That catches
machine-coupling and outright leaks.

The part that's easy to skip is organization-name coupling, because it's
prose, not a pattern. A skill can be perfectly well-written, use only
placeholder inputs like `${input:orgUrl}`, and still have a *sibling* skill
in the same family that hardcodes a specific company's internal ticket
routing convention right into its instructions. The only way to catch that
reliably was to extract every skill's title and description and actually
read them, rather than trusting that "no machine paths" meant "safe to
publish."

```
# cheap and necessary, but not sufficient on its own
grep -rlE '/Users/[a-zA-Z]+|/home/[a-zA-Z]+' skills/
grep -rilE 'AKIA[0-9A-Z]{16}|sk-[a-zA-Z0-9]{20,}' skills/

# the part that actually catches org-name coupling
# — read every skill's description, not just grep for it
```

That second pass is what turned up a handful of skills — an issue-tracker
integration and an internal design-system guide — that were fine, well-made,
and absolutely not portable, because they were written for one specific
employer's tooling. Those stayed in the private collection.

## What I learned

- **A regex sweep for secrets and paths is necessary but not sufficient.**
  Organization and client names don't follow a pattern; they only surface by
  reading, or by explicitly listing every org name you might have written
  down somewhere and grepping for that list.
- **The right boundary for a shared/public library is "is this coupled,"
  not "where did I write this."** Two skills in the same source collection
  can have completely different answers to that question.
- **Fixing small consistency issues (a directory name that didn't match its
  own metadata) is cheap during a migration and easy to silently carry
  forward if you don't check for it.** A migration is a good forcing
  function to run that check.

## Takeaways

- Before publishing any personal tooling collection, run two passes: a
  mechanical one for secrets/paths, and a *read* pass for organization or
  client names — they need different techniques to catch.
- Decide what belongs in a shared/public collection by a coupling test
  applied per-item, not by which folder it currently lives in.
- Treat a migration as free consistency-checking time — scripted checks
  (does every item's metadata agree with its own location?) are cheap to run
  once and easy to skip forever after.

---

<!-- Suggested tags: developer-tools, ai-agents, open-source · Est. reading time: 4 min -->
