---
name: realtime-sync
description: Rules for Yjs, Hocuspocus server and provider, awareness/presence, user cap, and reconnection. Read before touching any sync, server, or presence code.
---

# Realtime sync playbook

Verify all library APIs per the `grounding` skill. This file states design rules, not API signatures.

## Document model
- One `Y.Doc` per Hocuspocus document name (see `docs/ARCHITECTURE.md`).
- Text lives in a `Y.Text` under key `"content"`. Mutate text only through the editor binding or Yjs insert/delete, never by replacing the whole string.
- Never write custom merge logic.

## Server
- Config from env: `PORT`, `MAX_USERS`, `ALLOWED_ORIGIN`.
- Reject unknown document names in the connection hook.
- Seed documents on the server only, only when empty, only once (idempotent).
- **User cap:** logic is a pure module (`connectionLimiter.ts`) with unit tests; the hook just calls it. Release slots on disconnect and on failed connections; removal must tolerate duplicates.
  - P1: count connections to `file:main`.
  - P2: count connections to `project:index` only.
- Log events: connect, reject, disconnect with doc name, short id, current count. Never content.
- Tests must use random ports and clean up servers/clients in `afterEach`.

## Client
- Create providers in hooks (`useCollab`, `useIndex`, `useFileDoc`) and destroy them in effect cleanup. Guard against React StrictMode double-mount.
- A destroyed provider must not keep timers or sockets alive. After switching files 20 times there must be exactly one live file provider.
- Expose `status` and handle "room full" from the index provider (P2) or the single provider (P1). Don't auto-retry quickly when full; offer a manual "Try again" button.
- Read URLs from `VITE_WS_URL` and `VITE_HTTP_URL`.

## Awareness
- Local state: `{ user: { name, color } }`; from P2-S6 the index provider adds `activeFileId`.
- Identity (name, color) persisted in `sessionStorage`.
- The user count in the header derives from index/primary awareness states.

## Reconnection
- Rely on the provider's built-in reconnect. Offline edits stay in the `Y.Doc` and merge on reconnect.
- UI reflects status (see P1-S7).

## Pitfalls
- Two providers/bindings for one doc → duplicated characters, ghost cursors.
- Seeding on the client → text repeats for every new client.
- Counting per document instead of per user in P2 → cap breaks when users open files.
- Forgetting to destroy provider, doc, or binding on unmount or file switch.
