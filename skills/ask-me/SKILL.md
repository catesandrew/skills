---
name: ask-me
description: Use when a prior reply in the session ended with a summary, discrepancies, or open questions and the user wants the open questions turned into multiple-choice prompts with recommendation ratings, and any discrepancies explained. Typically invoked as a bare "/ask-me" or "ask me" with no other text.
---

# Ask Me

Convert the open questions and discrepancies from your most recent reply (or the last one that had them) into a structured decision pass. No new analysis: reuse what is already in the conversation.

## Inputs

- `${input:focus:}` — optional. Narrows scope to a topic, or a question/discrepancy number. Empty = everything open.

## Workflow

1. **Collect.** Re-read the latest summary. List every open question and every discrepancy. Skip items already answered later in the thread.
2. **Explain discrepancies first** (only if any). For each: what was expected, what was found, evidence (file:line, command output, quote), likely cause, and impact if ignored. Say plainly when cause is unknown.
3. **Ask questions** with the harness's structured question tool (`AskUserQuestion` in Claude Code; max 4 questions per call, 2-4 options each). If unavailable, or it errors or returns skipped, print a numbered list and stop for the reply. Batch in groups of 4 until all are asked.
4. **Option format.** One short label per option. Put your recommended option first. Put in each description:
   - what it means and its consequence
   - rating: `★★★★★` to `★☆☆☆☆` (5 = strongly recommend), with a one-clause reason
   - the main risk or trade-off
5. **Rating rules.** Ratings must differ where options genuinely differ. Never rate everything 5. Tag the top choice "(Recommended)". If options are truly equal, say so instead of faking a spread.
6. **After answers:** restate decisions in one short list, then proceed with the work they unblock. Do not re-ask answered items.

## Constraints

- Do not invent questions. If nothing is open, say so in one line.
- Do not ask about things you can verify from the code or by running a command; verify instead.
- Questions the user must answer in free text (names, values) stay free text; offer a default option only if one is sensible.
- Do not bundle two decisions into one question.

## Common Mistakes

- Re-summarizing the whole session instead of going straight to the discrepancies/questions.
- Ratings with no reason, or identical ratings on every option.
- Skipping the discrepancy explanation because the user only said "ask me".
- Asking more than 4 questions in one tool call (it will be rejected); batch instead.
