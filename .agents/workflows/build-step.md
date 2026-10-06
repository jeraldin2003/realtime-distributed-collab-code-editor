---
description: Build exactly one roadmap step (e.g. P1-S3) following the repo's rules, then verify, commit, and report
---

Argument: the step ID, e.g. `P1-S3`.

1. Read `AGENTS.md`, `docs/PROGRESS.md`, `docs/ARCHITECTURE.md`, and `docs/steps/<ID>.md`.
2. Confirm this is the next `todo` step and that its dependency is `done`. If not, stop and explain.
3. Read `.agents/skills/step-workflow/SKILL.md` and `.agents/skills/grounding/SKILL.md`, plus any other skill the step touches (see the skill index in `AGENTS.md`).
4. Post a short plan: files, libraries to verify, assumptions, and what you will not do.
5. Verify every library API you will use per the grounding skill, then build in small slices.
6. Run typecheck, lint, and tests in both `backend/` and `frontend/`, then do the step's manual verification.
7. Commit, update `docs/PROGRESS.md` and `docs/DECISIONS.md`, stop all dev servers.
8. Send the step report from `step-workflow`. Do not start the next step.
