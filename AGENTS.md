# AGENTS.md — Collaborative Code Editor

Read this file at the start of every task. It is the source of truth for how to work.

## Product
A browser-based, real-time collaborative code editor. People open a URL, edit code together, and see each other's edits and cursors live. **No code execution, ever.**

- **Phase 1:** a basic live host. Users connect and edit **one shared file** with live changes.
- **Phase 2:** **multiple files** inside the same system (file list, create, rename, delete, switch).

Each phase is split into small numbered steps (`P1-S0` … `P2-S8`). Full list: `docs/ROADMAP.md`. Each step has its own spec in `docs/steps/`.

## Operating loop (every task)
1. Read `docs/PROGRESS.md` to find the current step. Work on **exactly one step** — the one the user names.
2. Read that step's spec in `docs/steps/`, plus `docs/ARCHITECTURE.md`.
3. Read `.agents/skills/step-workflow/SKILL.md` and `.agents/skills/grounding/SKILL.md`, then any other skill the step touches.
4. Post a short plan (files, assumptions, what you will NOT do), then build.
5. Verify with the step's **Verify** section. Run typecheck, lint, and tests in both folders.
6. Commit, update `docs/PROGRESS.md`, and send the step report. Then **stop**. Do not start the next step.

## Hard constraints
1. No code execution, sandbox, terminal, or eval of user code.
2. One step at a time. Never build ahead, never skip a step, never "while I'm here" extra features.
3. Never invent library APIs. Follow `.agents/skills/grounding/SKILL.md` before using any package for the first time.
4. Server is authoritative for limits (user cap, doc-name rules). The client is untrusted.
5. Use Yjs for merging. No hand-written CRDT/OT.
6. Keep the app runnable after every step. Never leave the repo in a broken state; if you cannot finish, revert to the last commit and report.
7. Ask before adding dependencies not named in the step spec, changing the stack, or changing `docs/ARCHITECTURE.md`.
8. No secrets in code. Config through env vars with `.env.example` files.

## Stack
- TypeScript (strict) everywhere
- `frontend/`: React + Vite, Monaco Editor, `y-monaco`, `yjs`, `@hocuspocus/provider`
- `backend/`: Node.js LTS, `@hocuspocus/server`, `yjs`
- Tests: Vitest. Dev runner for backend: `tsx`.
- Versions: use latest stable at scaffold time (P1-S0), record exact versions in `docs/DECISIONS.md`, then **never upgrade without asking**.

## Layout
```
/
├─ AGENTS.md
├─ docs/            ROADMAP, PROGRESS, ARCHITECTURE, DECISIONS, steps/, PROMPTS
├─ .agents/         skills/ and workflows/
├─ frontend/        independent npm project (port 5173)
└─ backend/         independent npm project (WebSocket + HTTP on port 1234)
```
No shared package, no npm workspaces. The backend owns shared constants in `backend/src/config.ts`; the frontend mirrors the few it needs in `frontend/src/config.ts` with the comment `// keep in sync with backend/src/config.ts`.

## Stop-and-ask triggers
Stop and ask the user (do not guess) when:
- A library API cannot be verified from installed code or official docs.
- A step's acceptance criteria conflict with each other or with `ARCHITECTURE.md`.
- The same error persists after 3 fix attempts.
- You need to touch files outside the step's "Files" list in a meaningful way.

## Conventions
- Small modules, one responsibility. No file over ~250 lines without reason.
- Explicit types at module boundaries. No `any` without a comment saying why.
- Never log document content. Server logs connection events only (event, doc name, short id, count).
- Comments explain *why*. No dead code. TODOs must carry a step tag: `// TODO(P2-S5): ...`.

## Skill index (`.agents/skills/`)
| Skill | Read when |
|---|---|
| `step-workflow` | Every task: plan, commit, report format |
| `grounding` | Every task: how to avoid inventing APIs; mandatory before first use of any package |
| `realtime-sync` | Touching Yjs, Hocuspocus, awareness, cap, reconnect |
| `monaco-editor` | Touching Monaco, y-monaco, cursors, editor UI |
| `file-model` | Any Phase 2 step (file index, per-file docs, tree) |
| `testing-verification` | Writing tests or verifying any step |


## Tool notes (Kiro)
- Skills and workflows live in .agents/. They are not auto-loaded: read the files by path as the operating loop says.
- Do not create Kiro specs (requirements/design/tasks). docs/steps/ is the plan.
- Never read a whole .d.ts file; grep -n -A10 on the symbol. Check docs/API_NOTES.md first.
- Dependencies are pinned. Never run npm update or install @latest for existing packages.
- One step per task. Stop after the step report. Never continue to the next step on your own.