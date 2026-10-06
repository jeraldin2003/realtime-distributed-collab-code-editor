---
inclusion: manual
---

# Build one roadmap step

The user gives a step ID (e.g. P2-S1). Do exactly this:

1. Read docs/PROGRESS.md, docs/ARCHITECTURE.md and docs/steps/<ID>.md.
2. Read .agents/skills/step-workflow/SKILL.md and .agents/skills/grounding/SKILL.md, plus any other skill in .agents/skills/ the step touches (see the skill index in AGENTS.md).
3. Confirm the step is the next todo and its dependency is done. If not, stop and say so.
4. Post a short plan (files, libraries to verify, assumptions, what you will NOT do).
5. Verify library APIs before using them (grounding skill), then build in small slices.
6. Run typecheck, lint and tests in backend/ and frontend/, then the step's manual verification.
7. Commit, update docs/PROGRESS.md and docs/DECISIONS.md, stop any dev servers.
8. Send the step report. Do NOT start the next step.

Mark a criterion done only if you actually observed it. Otherwise write "not verified: <why>".