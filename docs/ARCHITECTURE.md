# Architecture (target design; change only with user approval)

## Processes and ports
- `backend`: one Node process. WebSocket (Hocuspocus) **and** HTTP on port `1234` (env `PORT`).
- `frontend`: Vite dev server on `5173`. Reads `VITE_WS_URL` (default `ws://localhost:1234`) and `VITE_HTTP_URL` (default `http://localhost:1234`).
- Backend env: `PORT` (1234), `MAX_USERS` (10), `ALLOWED_ORIGIN` (default `http://localhost:5173`, used for CORS on HTTP endpoints).

## HTTP endpoints (backend)
- `GET /health` → `{ "ok": true }` (from P1-S1)
- `GET /status` → `{ "users": number, "maxUsers": number }` (from P1-S6)
Both send CORS headers for `ALLOWED_ORIGIN`.

## Document names
| Name | Meaning | Phase |
|---|---|---|
| `file:main` | The one shared file (fixed id `main`) | P1 onward |
| `project:index` | The file index for the project | P2 onward |
| `file:<id>` | Content of the file with that id | P2 onward |

The backend **rejects any other document name**. `<id>` matches `^[a-z0-9-]{1,40}$`.

## Yjs shapes
- Every `file:<id>` doc: `Y.Text` under key `"content"`.
- `project:index` doc: `Y.Map` under key `"files"`: `fileId -> Y.Map { name: string, parentId: string|null, type: "file"|"folder" }`.
- Files are keyed by **id**, never by path/name, so renames never conflict with edits.
- Default project (seeded by the server on first load of the index): one file `{ id: "main", name: "main.ts" }`. Its content is seeded with the starter snippet from `backend/src/config.ts`.

## Awareness
Every provider sets `{ user: { name: string, color: string } }`. From P2-S6 the index provider also sets `activeFileId`.

## Connection cap
- P1: counted per connection to `file:main`.
- P2 (from P2-S2): counted per connection to `project:index`. Every client always holds exactly one index connection, so this equals "users". Connections to `file:<id>` docs are never counted.
- Logic lives in a pure module `backend/src/connectionLimiter.ts` with unit tests. Enforced in the Hocuspocus connection hook; verify the hook name and signature against the installed version.

## Limits (Phase 2)
`MAX_FILES = 50`, file name 1–100 chars, no `/` or `\`. Enforced client-side. The server does not validate index mutations in Phases 1–2 (trusted clients, known limitation).

## Flow (Phase 2)
```
browser ── ws ──> Hocuspocus ── doc: project:index   (file list + presence)
   │                         └─ doc: file:<activeId>  (text of the open file)
   └── http ──> GET /status
```
One browser keeps one WebSocket. Use a shared websocket for multiple providers (verify the provider API in the installed version).
