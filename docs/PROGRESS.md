# Progress

The agent updates this file at the end of every step. It is the memory between sessions.

**Current step:** P2-S3
**Last completed step:** P2-S2
**Repo state:** Phase 2 in progress; index sync, file list sidebar, and cap on index doc done

## Step status
| ID | Status | Commit | Notes |
|---|---|---|---|
| P1-S0 | done | 47207c4 | Scaffolded backend and frontend |
| P1-S1 | done | c18ff33 | Hocuspocus backend host with sync and health tests |
| P1-S2 | done | e600dd9 | Frontend shell: App, Header, Editor with Monaco, config.ts, worker setup |
| P1-S3 | done | 88e2a81 | Live sync: useCollab hook, MonacoBinding, status in Header |
| P1-S4 | done | 45995c7 | Server-side starter seed in onLoadDocument |
| P1-S5 | done | dbda5e0 | Presence with names, colors, and remote cursors |
| P1-S6 | done | 678f109 | Server-enforced user cap with room-full UI |
| P1-S7 | done | 77a4fd8 | Connection status and reconnect UX |
| P1-S8 | done | 9f9c13e | Phase 1 hardening, stress test, and docs (tag phase-1-complete) |
| P2-S1 | done | 3789c1a | Backend file model: docNames, fileIndex, server doc-name validation |
| P2-S2 | done | e5f5a26 | Index sync, file list sidebar, cap moved to project:index |
| P2-S3 | todo | | |
| P2-S4 | todo | | |
| P2-S5 | todo | | |
| P2-S6 | todo | | |
| P2-S7 | optional | | |
| P2-S8 | todo | | |

## Blockers
(none)

## Notes for next session
- P2-S2 added: `useIndex.ts` (shared HocuspocusProviderWebsocket + index provider, file list, room-full, retry), `useCollab.ts` now accepts `websocketProvider` param and no longer manages cap/room-full logic, `FileList.tsx`, `Sidebar.tsx`.
- App.tsx wires `useIndex` → `useCollab(websocketProvider)`; presence and status come from index provider; sidebar always shows; active file hardcoded to "main".
- Cap is now counted on `project:index` connections only. `file:<id>` connections not counted.
- TDZ fix in useCollab.ts: providerRef pattern (same as P1-S3) needed because onStatus is called synchronously during HocuspocusProvider construction in tests.
