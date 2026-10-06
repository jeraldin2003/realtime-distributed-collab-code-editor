---
name: step-workflow
description: How to plan, build, commit, and report a single roadmap step (P1-S0 to P2-S8). Use at the start and end of every task in this repo.
---

# Step workflow

## Before building
1. Open `docs/PROGRESS.md`. Confirm the requested step is the next `todo` step and its dependency is `done`. If not, stop and tell the user.
2. Read the step spec in `docs/steps/` fully, and `docs/ARCHITECTURE.md`.
3. Post a plan, max ~10 lines:
   - Files you will create or change
   - Libraries you will use (and that you will verify them per `grounding`)
   - Assumptions
   - What you will NOT do (copy the step's "Do NOT")

## While building
- Work in small slices: after each slice the app still starts and checks still pass.
- One concern per commit-sized change. No drive-by refactors.
- Start dev servers in the background only when needed and **always stop them** before finishing. Never leave ports occupied.
- If a fix fails 3 times, stop. Revert uncommitted changes to the last good state (`git stash` or `git checkout`), log the problem in `docs/PROGRESS.md` under Blockers, and report to the user.
- If the user gives instructions that conflict with the step spec, follow the user and note it in `docs/DECISIONS.md`.

## Finishing
1. Run the checks in both folders: `npm run typecheck`, `npm run lint`, `npm test`. Then do the step's manual verification.
2. `git add -A && git commit -m "<step commit message>"`.
3. Update `docs/PROGRESS.md`: step status `done` with the short commit hash, set "Current step" to the next one, write "Notes for next session" if anything is non-obvious.
4. Append notable choices to `docs/DECISIONS.md`.
5. Reply with this report, then stop:

```
## <STEP ID> report
**Built:** 3–6 bullets
**Run it:** exact commands
**Acceptance:** each criterion ✅ / ❌ (explain any ❌)
**Checks:** typecheck / lint / test per folder, pass or fail with counts
**Verified manually:** what you actually did, or "not verified: <why>"
**Decisions & assumptions:** short list
**Unverified or risky:** anything you could not confirm
**Next step:** <ID> (not started)
```

## Honesty rules
- Never say "done" or "passing" without having run the command in this session.
- If you cannot run a browser, say so; list which criteria are only covered by automated tests.
- Do not weaken tests, loosen types, or disable lint rules to get green. Fix the cause or report it.
