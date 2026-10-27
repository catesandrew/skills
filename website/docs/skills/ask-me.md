---
title: Ask Me
description: Turns the open questions and discrepancies from a session summary into multiple-choice prompts with recommendation ratings, explaining discrepancies first and reusing what is already in the conversation.
---

# ask-me

## Why It Exists

Long agent sessions often end a reply with a summary that lists discrepancies and open questions buried in prose. Answering them means re-reading the reply, copying items out, and typing free-form decisions, which is slow and easy to get wrong. `ask-me` is a one-word command ("/ask-me" or "ask me") that converts those loose ends into a structured decision pass, with a recommended option and a rating on each choice, so the user can unblock the work with a few clicks.

It was authored directly in this repo in commit `85847b0` ("feat: add ask-me skill"). It is a single-file skill with no references or scripts.

## What It Does

The skill performs no new analysis. It re-reads the latest summary (or the last reply that had open items), collects every open question and every discrepancy, and skips anything already answered later in the thread.

Discrepancies are explained first, and only if there are any. For each one it states what was expected, what was found, the evidence (file and line, command output, or a quote), the likely cause, and the impact if ignored. When the cause is unknown it says so plainly.

Questions are then asked through the harness's structured question tool (`AskUserQuestion` in Claude Code, at most four questions per call and two to four options each), batched in groups of four until all are asked. If the tool is unavailable, errors, or returns a skipped answer, the skill prints a numbered list and stops for the reply.

Each option has one short label with the recommended option first. Its description gives what the option means and its consequence, a rating from `★★★★★` (strongly recommend) down to `★☆☆☆☆` with a one-clause reason, and the main risk or trade-off. Ratings must differ where options genuinely differ; the top choice is tagged "(Recommended)", and if options are truly equal the skill says so instead of faking a spread.

After the answers, it restates the decisions in one short list and proceeds with the work they unblock, without re-asking answered items.

## How To Use It

Typically invoked as a bare "/ask-me" or "ask me" after a reply that ended with a summary, discrepancies, or open questions. An optional `${input:focus:}` narrows the pass to a topic or to a specific question or discrepancy number; empty means everything open.

```sh
skills add -g catesandrew/skills --skill skills/ask-me
```

```sh
npm install @catesworks/skill-ask-me
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 60 skills as a single bundled plugin named `cw`; there is no standalone per-skill plugin.

## Gotchas & Invariants

- Do not invent questions. If nothing is open, say so in one line.
- Do not ask about anything that can be verified from the code or by running a command; verify instead.
- Do not re-summarize the whole session; go straight to the discrepancies and questions.
- Never skip the discrepancy explanation because the user only said "ask me".
- Never put more than four questions in one `AskUserQuestion` call; the call is rejected, so batch instead.
- Ratings need a reason and must not be identical across options. Never rate everything five stars.
- Questions whose answer is free text (names, values) stay free text, with a default option only when one is sensible.
- Do not bundle two decisions into one question.
- A skipped, dismissed, or auto-resolved answer counts as no answer: fall back to a numbered list and wait.

## Related Skills

- [session-wrap](/docs/skills/session-wrap): wraps up a session into a durable write-up, including follow-ups that `ask-me` can turn into decisions.
- [reflect-instructions](/docs/skills/reflect-instructions): another conversation-driven skill that reviews a session to improve instructions.

---

_Sourced from: skills/ask-me/SKILL.md, skills/ask-me/metadata.json, public-repo commit `85847b0`_
