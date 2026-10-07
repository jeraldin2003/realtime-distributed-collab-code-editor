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
- [P1-S6] In header `N / MAX online`, N is derived from awareness presence (client-perceived peers) while MAX is fetched from `/status`. Rejection in Hocuspocus triggers `authenticationFailed` with `permission-denied`, which disconnects the provider and presents `RoomFull` with a manual `Try again` button.

- [P2-S1] `parseDocName` is the single gate for doc name validation in `onConnect`; validates against `FILE_ID_REGEX = /^[a-z0-9-]{1,40}$/` per ARCHITECTURE.md.
- [P2-S1] File ids generated with `crypto.randomUUID()` (Node 14.17+ built-in, no new dep); UUID format `[0-9a-f-]` already satisfies FILE_ID_REGEX.
- [P2-S1] `ensureDefaultIndex` is idempotent and called in `onLoadDocument` for `project:index`; seeding `file:main` retains the existing Set-guard.
- [P2-S1] Cap stays on `file:main` connections only; moves to `project:index` in P2-S2.
- [P2-S1] `listFiles` sorts by name then id for stable, deterministic order across clients (concurrent same-name creates produce two entries, allowed per spec).
- [P2-S2] One `HocuspocusProviderWebsocket` created in `useIndex`, passed to `useCollab` as `websocketProvider`; one browser tab = one socket.
- [P2-S2] When `websocketProvider` is supplied to `HocuspocusProvider`, `manageSocket=false` — provider.destroy() detaches but does NOT close the socket; socket is closed by `useIndex` cleanup.
- [P2-S2] `useCollab` now accepts `websocketProvider` as a prop and re-creates on change; room-full/retry moved entirely to `useIndex`.
- [P2-S2] `providerRef` pattern reused in `useCollab` to avoid TDZ when mock calls `onStatus` synchronously during construction (same root cause as P1-S3).
- [P2-S2] Presence (`usePresence`) reads from index provider awareness; file provider awareness unused for presence in this step.
- [P2-S2] Active file is hardcoded to "main" in App.tsx for P2-S2; switching wired in P2-S3.
- [P2-S3] `useFileDoc` supersedes `useCollab` in App; `useCollab` is retained but unused.
- [P2-S3] `Editor` uses two `useEffect`s: one creates Monaco once (`[]` deps), one rebinds MonacoBinding on `[ytext, awareness, language]` — avoids remounting the DOM on file switch (no flicker).
- [P2-S3] `monaco.editor.setModelLanguage(model, languageId)` verified in `standaloneEditor.js` ESM source.
- [P2-S3] `identity` must NOT be in `useFileDoc` deps — `getOrCreateIdentity()` returns a new object on every App render, causing an infinite effect loop. Suppressed with `eslint-disable-next-line react-hooks/exhaustive-deps`.
- [P2-S3] `getLanguageForFile` defaults to `"plaintext"` for unknown/absent extensions.
- [P2-S4] Frontend `fileIndex.ts` is a mirror of `backend/src/fileIndex.ts`; no shared package — both covered by tests including concurrent merge.
- [P2-S4] Concurrent same-name creates from two users are allowed to produce two entries (IDs differ); list sorts by name then id so both are visible. Validation only blocks same-name creation by a single user at the time of input.
- [P2-S4] `useIndex` now exposes `ydoc: Y.Doc` so App can call `createFile(ydoc, {name})` directly without a separate hook.
- [P2-S4] `validateFileName` does a case-insensitive duplicate check against current `files[]` at confirm time; App adds a second guard after `createFile` returns to handle any race.
- [P2-S4] `NewFileInput` auto-cancels on blur if input is empty; confirms on Enter or blur with non-empty valid name.
- [P2-S5] Inline rename uses same validation as create via `validateFileName(name, files, excludeId)` where `excludeId` prevents colliding with itself on case or unchanged name.
- [P2-S5] Inline delete confirm replaces the file item row temporarily until confirmed or cancelled; avoids browser `window.confirm`.
- [P2-S5] When active file is deleted, `resolveActiveFileOnFilesChange` switches to first remaining file or null (empty state) and shows a dismissal notice banner.
- [P2-S5] Orphaned file docs stay in server memory when deleted (known limitation per ARCHITECTURE.md). Empty state lets user recover by creating a new file.
