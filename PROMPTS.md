# Prompts to give the agent

Open the repo root in Antigravity (the folder containing `AGENTS.md`, `frontend/`, `backend/`).

## First message (once)
```
Read AGENTS.md, docs/PROJECT_SCOPE.md, docs/ROADMAP.md and docs/ARCHITECTURE.md.
Summarize the project, the two phases, and the rules you will follow in under 15 lines.
Do not write any code yet.
```
Check that the summary mentions: no code execution, one step at a time, verify library APIs, no persistence/auth.

## Each step
```
/build-step P1-S0
```
If the slash command is not available, use:
```
Build step P1-S0 following AGENTS.md and docs/steps/P1-S0.md. Follow the operating loop. Stop after the step report.
```
Replace the ID with the next step in `docs/ROADMAP.md` only after you have reviewed the report and tried the result yourself.

## When something goes wrong
- Agent skipped ahead:
  `Stop. Revert anything outside <ID>. Re-read AGENTS.md hard constraint 2 and continue only with <ID>.`
- Agent used an API that may not exist:
  `Which installed version are you using, and where did you verify <API>? Follow .agents/skills/grounding/SKILL.md and show the evidence.`
- Agent says done without proof:
  `Run typecheck, lint and tests in both folders now and paste the results.`
- Agent is stuck in a loop:
  `Stop. Revert to the last commit, write the blocker in docs/PROGRESS.md, and tell me what you tried.`
- Resuming in a new session:
  `Read docs/PROGRESS.md and tell me the current step and any blockers. Do not build yet.`

## Review checklist after each step
1. Report lists every acceptance criterion with ✅/❌.
2. `git log` shows one commit for the step.
3. `docs/PROGRESS.md` updated.
4. You tried the feature yourself with 2 browser tabs.
