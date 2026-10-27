---
title: Lead Research Assistant
description: Finds and scores sales leads, target accounts or partnership prospects for a product or service. Reads the repository or a description, fixes an ideal customer profile, searches for signals of need, and returns a ranked list with a decision-maker role and an outreach strategy for each company.
---

# lead-research-assistant

## Why It Exists

Lead lists made by asking a model for "ten companies that need my product" tend to be generic, and sometimes invented. This skill makes the research step explicit: pin down what the product does and who it helps, set the ideal customer profile before searching, look for evidence of need, and score each lead with a stated reason.

## What It Does

It works in six steps:

1. **Understand the product.** From the current repository if there is one, otherwise from the user's description, with at most one or two clarifying questions.
2. **Define the ideal customer profile.** Industry, company size, location, pain points, and technology requirements.
3. **Research leads.** Web search for signals of need: job postings, technology stack evidence, recent news, funding and growth, complementary products.
4. **Score each lead** from 1 to 10 with an explanation.
5. **Output a fixed format.** A summary (total, high and medium priority counts, average score), then per lead: website, score, industry, size, why it fits, a target decision-maker role, a LinkedIn link if found, a value proposition, an outreach strategy and conversation starters.
6. **Offer next steps**, such as a CRM-ready CSV or outreach drafts.

## How To Use It

Triggers on: "find leads", "lead research", "target accounts", "ideal customer profile", "prospect list", "who should I sell to".

```sh
skills add -g catesandrew/skills --skill skills/lead-research-assistant
```

```sh
npm install @catesworks/skill-lead-research-assistant
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

Inputs: `product`, `industry`, `company_size`, `location` and `lead_count`. The default is 10 leads for the current repository.

## Gotchas & Invariants

- Every lead must come from a search result. A field that was not found is reported as "not found", never guessed.
- The ideal customer profile is not widened to hit the requested count. Fewer leads is a valid answer.
- Each "why they fit" reason must name something specific to that company.
- The skill collects only the target role and a public professional profile link, not private contact details.
- Web search is needed for the research step.

## Related Skills

- [high-ticket-site-generator](/docs/skills/high-ticket-site-generator): a conversion-focused site generator, useful once you know who the leads are.

---

_Sourced from: skills/lead-research-assistant/SKILL.md, skills/lead-research-assistant/metadata.json_
