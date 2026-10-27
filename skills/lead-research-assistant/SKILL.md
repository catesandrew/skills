---
name: lead-research-assistant
description: Use when the user wants to find, qualify or prioritize sales leads, target accounts or partnership prospects for a product or service, with fit scores and outreach strategies. Triggers on "find leads", "lead research", "target accounts", "ideal customer profile", "prospect list", "who should I sell to".
---

# lead-research-assistant

Finds companies that fit a product or service, scores them, and gives a concrete outreach approach for each. Works from a plain description, or from the repository the user is in.

## 1. Understand the product

- In a code directory, read the repo (README, package manifest, main source) to learn what is being built before asking anything.
- Otherwise use the user's description. Ask at most one or two clarifying questions, only about the value proposition or the problem it solves.
- State back in two lines: what it is, and who it helps.

## 2. Define the ideal customer profile (ICP)

Fix these before searching. Infer what you can, and ask only for what you cannot:

- Industry and sector
- Company size range
- Location
- Pain points the product solves
- Technology stack or requirements

If the user gave an ICP, use it as given and do not widen it.

## 3. Research and identify leads

Use web search. Look for signals of need, not just category matches:

- Job postings that name the problem or the tools
- Technology stack evidence (careers pages, public repos, engineering blogs)
- Recent news: funding, expansion, a new policy, a launch
- Complementary or adjacent products, for partnership leads
- Budget indicators: funding stage, headcount growth

## 4. Score and prioritize

Give every lead a fit score from 1 to 10 and say why. Weigh:

- Alignment with the ICP
- Signals of immediate need
- Budget availability
- Competitive landscape
- Timing

## 5. Output format

Default to 10 leads unless the user asks for another number.

```markdown
# Lead Research Results

## Summary
- Total leads found: [X]
- High priority (8-10): [X]
- Medium priority (5-7): [X]
- Average fit score: [X]

---

## Lead 1: [Company Name]

**Website**: [URL]
**Priority Score**: [X/10]
**Industry**: [Industry]
**Size**: [Employee count or revenue range]

**Why They're a Good Fit**:
[2-3 specific reasons based on their business]

**Target Decision Maker**: [Role/Title]
**LinkedIn**: [URL if found]

**Value Proposition for Them**:
[Specific benefit for this company]

**Outreach Strategy**:
[Personalized approach: specific pain points, recent company news, relevant context]

**Conversation Starters**:
- [Specific point 1]
- [Specific point 2]

---

[Repeat for each lead]
```

## 6. Offer next steps

Offer one or two of: a CSV for CRM import, personalized outreach drafts, a timing-based order, deeper research on the top leads.

## Inputs

| Param | Description | Default |
|---|---|---|
| `${input:product}` | What the user is selling or building | the current repository |
| `${input:industry}` | Target industry or sector | inferred from the product |
| `${input:company_size}` | Company size range | not restricted |
| `${input:location}` | Geography | not restricted |
| `${input:lead_count}` | How many leads to return | 10 |

## Examples

**Developer tool** (adapted from an example in Lenny's Newsletter). "I'm building a tool that masks sensitive data in AI coding assistant queries. Find potential leads." Returns companies that use AI coding assistants, handle sensitive data (fintech, healthcare, legal), and show evidence of coding-agent use, each with the decision-maker role to target.

**Local consulting.** "I run a consulting practice for remote team productivity. Find me 10 companies in the Bay Area that recently went remote." Returns companies with recent remote job listings or remote-first announcements, each with an outreach approach.

## Common Mistakes

- Inventing companies, contacts, LinkedIn URLs or news. Every lead must come from a search result. If a field was not found, write "not found" rather than guessing.
- Presenting an unverified signal as fact. Say where it came from, such as a job posting, and note anything you could not confirm.
- Returning generic "good fit" reasons. Each reason must name something specific to that company.
- Widening the ICP to reach the requested count. Return fewer leads and say so.
- Collecting personal details beyond the target role and a public professional profile link. Do not gather private contact details.
- Scoring without explanation. A bare "8/10" is not actionable.
- Skipping the product step when run from a repo. The code is the best source for the value proposition.

## Related use cases

- Drafting personalized outreach emails for the leads found
- Building a CRM-ready CSV of qualified prospects
- Researching one specific company in depth
- Analyzing a competitor's customer base
- Identifying partnership opportunities
