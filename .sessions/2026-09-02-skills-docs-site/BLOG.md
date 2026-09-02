<!--
PUBLIC blog post draft. This session touched only a public, personal repo
(no client work), so there's little to strip — but keep the private source
repo generic ("a private dotfiles collection") rather than naming a personal
machine path, and don't paste raw internal hostnames if any slip in.
-->

# Don't fabricate your changelog: documenting 52 AI skills without inventing their history

*When your project's own git log is too thin to explain why something
exists, the fix isn't to make something up — it's to look one repo over.*

## The problem

I maintain a public collection of "Agent Skills" — reusable playbooks that
tell an AI coding assistant how to do a specific job well, from auditing
accessibility to building a data table to writing a commit message. A
sibling project of mine had already gone through the exercise of turning a
skill collection into real documentation: a generated catalog table, plus a
hand-written deep-dive page per skill covering what it does, how to use it,
its gotchas, and — critically — *why it exists*, sourced from that project's
own commit history.

I wanted the same treatment here. The catch: this repo's own git log was
almost useless for that last part. Nearly all 52 skills landed in a single
bulk "initial import" commit, with zero individual rationale. Ask git blame
"why does this skill exist," and the honest answer was "because it got
copied here on this one day, from somewhere else."

The tempting shortcut was obvious: write a plausible-sounding two-sentence
origin story per skill and move on. Nobody reading a docs page for a
commit-message-generator skill is going to fact-check its founding myth.
But shipping fabricated history on a public site — even low-stakes,
even "it's probably close enough" — is still shipping something untrue.

## What I tried

Before inventing anything, I asked a simpler question: does this repo's
history actually not exist, or does it just not exist *here*? Most of these
skills weren't born in this repo. They were migrated in from a private
collection I'd been building for a long time, one skill at a time, before I
decided a generic subset was worth publishing separately.

That private collection's git log was a different story — real, incremental
commits, one skill (or a small related batch) at a time, going back months.
The problem was that the file paths inside it had been reorganized several
times: flat layout, then grouped, then renamed again. `git log --follow`,
which is supposed to survive a file being moved, kept coming up empty,
because a "move" that's implemented as delete-old-file-then-add-new-file in
a different commit doesn't always get detected as a rename.

The fix was to stop relying on one tool and combine three cheap, different
searches per skill:

```sh
# 1. path match under any historical location the file has ever lived at
git log --all --oneline -- '**/<skill-name>'

# 2. commit messages that mention the skill by name, even if the file moved
git log --all --oneline --grep='<skill-name>'

# 3. "pickaxe" — commits that added or removed the literal string, content-based
git log --all --oneline -S'<skill-name>' -- <scoped-path>
```

None of these alone was reliable. Together, across nearly every skill, at
least one of them landed on a real commit with a real, often specific
rationale — a skill ported and generalized from a client codebase, a skill
that started life as a different tool's prompt file and got converted, a
skill that wraps a specific named third-party CLI. A few skills genuinely
had nothing — no trace anywhere, in either repo. For those, the resulting
docs page just says so, plainly, instead of padding the section to match
the length of its neighbors.

To cover 52 skills in reasonable time, I split the work across several
parallel research-and-write passes, each covering a handful of skills. The
one instruction that mattered more than anything else: *verify before you
write it down, and say so plainly if you can't verify it.* Given a couple of
pre-supplied guesses about which commit a skill probably came from, more
than one pass came back having caught and corrected a wrong guess, because
checking `git show --stat <hash>` against the guess was cheap and the
instruction to actually do it was explicit.

## What I learned

- **"No history" is often "no history *here*."** Before writing "no
  provenance available," check whether the thing you're documenting was ever
  developed somewhere else first, under a name or path your current search
  wouldn't have caught.
- **`git log --follow` is not a complete answer for renamed files.**
  Combining a path search, a message-grep, and a pickaxe search catches
  history that any one of them misses alone, especially across a file that's
  moved more than once.
- **Give researchers (human or AI) a cheap way to verify a guess, and tell
  them to use it.** A pre-supplied hypothesis is useful as a starting point
  and dangerous as an assumption; the difference is whether checking it is
  built into the instructions.
- **Stating "this is thin" is a legitimate, useful answer.** A documentation
  page that says "no distinguishing history exists beyond this bulk commit"
  is more trustworthy than one that always finds a story, because the reader
  can tell the difference between researched and decorated.

## Takeaways

- When your own project's history looks empty, check whether the *real*
  history moved somewhere else before you conclude it's gone.
- `--follow` alone under-covers renamed files; pair it with a message-grep
  and a pickaxe search.
- Build verification into research instructions, not just into review —
  it's cheaper to catch a wrong guess while writing than after publishing.
- Honest gaps beat uniform-looking fabrication, every time, on anything
  someone else might rely on.

---

<!-- Suggested tags: git, documentation, AI agents, developer tooling · Est. reading time: 5 min -->
