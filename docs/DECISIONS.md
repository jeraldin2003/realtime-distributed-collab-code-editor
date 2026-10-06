# Decisions

Format: `- [step] decision — reason`. Add one line per notable choice. Record exact dependency versions after P1-S0.

- [init] Yjs + Hocuspocus for sync — mature CRDT, awareness built in, connection hooks for the cap.
- [init] Monaco + y-monaco — VS Code engine with official Yjs binding.
- [init] Two independent folders, no shared package — matches owner's structure; backend owns constants.
- [init] No persistence, no auth in Phases 1–2 — keep scope small; seams only.
- [init] No code execution — product boundary.

- [P1-S0] Scaffolded backend with Node LTS, TypeScript strict, tsx dev runner, and Vitest.
- [P1-S0] Scaffolded frontend with Vite React + TypeScript template, Vitest + jsdom, and ESLint flat config.
- [P1-S1] Use Hocuspocus onRequest hook for GET /health endpoint with CORS headers; throw null to bypass default welcome message.
- [P1-S1] Enforce doc name in onConnect hook by throwing Error, triggering permission-denied response.

## Dependency versions (fill in at P1-S0)
### Backend
- `@eslint/js`: 10.0.1
- `@hocuspocus/provider`: 4.7.0
- `@hocuspocus/server`: 4.7.0
- `@types/node`: 26.6.4
- `@types/ws`: 8.18.2
- `eslint`: 10.12.0
- `tsx`: 4.23.15
- `typescript`: 6.0.3
- `typescript-eslint`: 8.71.1
- `vitest`: 5.0.3
- `ws`: 8.22.0
- `yjs`: 13.6.33

### Frontend
- `react`: 19.3.0
- `react-dom`: 19.3.0
- `@types/react`: 19.3.0
- `@types/react-dom`: 19.3.0
- `@vitejs/plugin-react`: 6.1.2
- `vite`: 8.3.3
- `vitest`: 5.0.3
- `jsdom`: 30.1.2
- `@testing-library/react`: 16.3.3
- `@testing-library/jest-dom`: 7.0.1
- `eslint`: 10.12.0
- `@eslint/js`: 10.0.1
- `eslint-plugin-react-hooks`: 7.1.1
- `eslint-plugin-react-refresh`: 0.5.7
- `typescript`: 6.0.3
- `typescript-eslint`: 8.71.1
- [P1-S3] `HocuspocusProvider` with inline `url` string (not `HocuspocusProviderWebsocket`) — P1 only needs one connection; shared WS is for P2.
- [P1-S3] Status tracked via `onStatus` callback into React state (not `provider.status` which is on the separate `HocuspocusProviderWebsocket`).
- [P1-S3] `providerRef` object used in `useCollab` to avoid TDZ when mock calls `onStatus` synchronously from the constructor.
- [P1-S3] `Editor` renders only when `collab` is non-null to guarantee `ytext`/`awareness` are stable before `MonacoBinding` is created.
- [P1-S3] New frontend packages: `yjs` 13.6.33, `@hocuspocus/provider` 4.7.0, `y-monaco` 0.1.6.
- [hotfix] `monaco-editor` pinned to `0.55.1` (exact) — v0.56+ changed the ESM exports map, breaking deep imports like `monaco-editor/esm/vs/editor/editor.worker` under Vite 8 / Rolldown. Do NOT upgrade `monaco-editor` without verifying deep-import compatibility with the installed Vite version.
