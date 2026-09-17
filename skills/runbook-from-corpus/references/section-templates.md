# Section Templates

## 1. Quick-reference incident page

```
# <Platform> — Quick Reference

One sentence: what this platform does.

## Critical journeys
| Journey | Entry point | Spine (units in order) | Corpus citation |

## First N things to check
1. ...

## Reachability / health-check probes
| Unit | Probe | Convention source | Confidence |
(Use whatever convention the corpus documents per unit — never assume a
uniform path. Mark unconfirmed/inferred probes explicitly.)

## Do-not-touch list
(Pulled directly from the corpus's Tech Debt & Flags sections.)
```

## Document header template

```
---
owner: <from CODEOWNERS-equivalent, or "[U] — needs owner">
last_verified: <date>
verified_scope: "corpus docs checked; no live system/dashboard/cluster access used"
re_verify_trigger: "corpus dependency-graph or per-unit doc changes; next scheduled review"
source_of_truth: "the corpus wins on any conflict; this runbook cross-references, it does not duplicate"
status: draft — pending review of every [U] marker
schema_confidence: <omit unless the Precondition's fallback path was used, then "[U]">
---
```

## Hazard card template

```
### Hazard: <name>

**Danger:** <what breaks and why>
**Corpus citation:** <path under ${input:corpusPath}, e.g. services/api.md#tech-debt-flags>
  (that citation may itself legitimately quote a source file:line — expected)
**Blast radius:** <scope of impact>
**Safe alternative:** <if the corpus documents one, otherwise "[U] — not documented">
```
