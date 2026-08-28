---
name: jira-estimate
description: Use when the user wants to estimate how long a Jira ticket would take for AI to implement, expressed as story points and AI time, based on codebase analysis and complexity scoring.
---

# Jira Estimate

Estimate AI implementation time for a Jira ticket using weighted complexity scoring across five factors.

## Inputs

| Variable | Description | Example |
|----------|-------------|---------|
| `${input:jiraBaseUrl}` | Base URL of your Jira instance | `https://jira.example.com` |
| `${input:ticketId}` | Ticket ID to estimate | `PROJ-123` |

## Story Point Scale

| Story Points | Human time | AI time |
|---|---|---|
| 1 | 1 day | 10–30 minutes |
| 2 | 3 days | 1–3 hours |
| 5 | 5 days | 4–8 hours |
| 8 | 8 days | 1–2 days |
| 13 | 13 days | 2–4 days |

AI is typically 10–50x faster for simple, well-defined tasks and 3–8x faster for complex tasks.

## Process

### 1. Fetch Ticket Details

Navigate to `${input:jiraBaseUrl}/browse/${input:ticketId}` and extract:
- Title / Summary
- Issue type (Bug / Task / Story)
- Description and Acceptance Criteria
- Labels, components, priority (optional)
- Linked issues / blockers (optional)

If sections are collapsed, expand them before extracting.

### 2. Analyze Codebase

Based on the ticket description, identify:
- Files likely to be modified (use Glob/Grep to find them)
- Existing patterns and architecture relevant to this change
- Dependencies that will need updates
- Tests requiring modification or creation

### 3. Complexity Scoring

Score each factor 1–5:

**Technical Complexity**
- 1: Simple data/config changes
- 2: Single-file logic with clear patterns
- 3: Multi-file changes following existing patterns
- 4: New feature requiring architectural decisions
- 5: Complex refactoring or system-wide changes

**Codebase Familiarity**
- 1: Well-documented, clear patterns, many examples
- 2: Good documentation, some examples
- 3: Moderate documentation, patterns exist
- 4: Limited documentation, needs exploration
- 5: Poor documentation, complex legacy code

**Change Scope**
- 1: 1–3 files, <100 lines
- 2: 4–10 files, 100–300 lines
- 3: 10–20 files, 300–600 lines
- 4: 20–50 files, 600–1000 lines
- 5: 50+ files, 1000+ lines

**Testing Requirements**
- 1: No new tests needed
- 2: Minor test updates
- 3: New unit tests for 2–3 components
- 4: Integration tests + unit tests
- 5: Full suite (unit + integration + e2e)

**Risk & Unknowns**
- 1: Clear requirements, known approach
- 2: Mostly clear, minor unknowns
- 3: Some ambiguity, needs exploration
- 4: Significant unknowns, multiple approaches
- 5: Highly ambiguous, research needed

### 4. Calculate Estimate

Weighted score (max 60):
- Technical Complexity × 3
- Codebase Familiarity × 2
- Change Scope × 3
- Testing Requirements × 2
- Risk & Unknowns × 2

| Score % | Story Points | AI Time |
|---------|---|---|
| ≤ 20% | 1 | 10–30 min |
| ≤ 35% | 2 | 1–3 hours |
| ≤ 55% | 5 | 4–8 hours |
| ≤ 75% | 8 | 1–2 days |
| > 75% | 13 | 2–4 days |

### 5. Report Format

```markdown
## AI Estimate: ${input:ticketId}

### Summary
- **Story Points**: X
- **Estimated AI Time**: Y
- **Confidence**: High / Medium / Low
- **Complexity Score**: X/60 (Y%)

### Ticket
- **Title**: ...
- **Type**: Bug / Feature / Task
- **Acceptance Criteria**: ...

### Codebase Analysis
- **Files to modify**: X identified
- **New files needed**: Y
- **Tests to update**: Z

### Complexity Breakdown
- Technical: X/5 — [reason]
- Familiarity: X/5 — [reason]
- Scope: X/5 — [reason]
- Testing: X/5 — [reason]
- Risk: X/5 — [reason]

### Implementation Approach
1. ...
2. ...

### Assumptions & Risks
- ...

### Recommendation
[Is this a good AI candidate? Any human oversight recommended?]
```

## Special Cases

- **Data-only changes** — Minimum 1 story point. AI is 10–50x faster; typically 10–30 minutes.
- **Research/spike tickets** — Add +2 story points, mark Low Confidence.
- **Bug fixes with unclear root cause** — Add +1 story point.

## Adding the Estimate Back to Jira

Add a comment to the ticket with the short estimate summary. Only update the Story Points field directly if it is editable and you can verify the change saved.

## Common Mistakes

- **Scoring before reading the ticket** — Complexity scores without reading the description are guesses. Always fetch the ticket first.
- **Ignoring the codebase** — Familiarity and Scope scores require actually searching the repo. Do not estimate blind.
- **Skipping the recommendation** — The most useful output is whether this is a good AI candidate. Always include it.
- **Overconfidence on ambiguous tickets** — If Acceptance Criteria are missing or vague, mark confidence as Low regardless of the score.
