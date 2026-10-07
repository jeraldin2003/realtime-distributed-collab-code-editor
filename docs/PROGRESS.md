# Progress

The agent updates this file at the end of every step. It is the memory between sessions.

**Current step:** P2-S5
**Last completed step:** P2-S4
**Repo state:** Phase 2 in progress; file creation with live sync done

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
| P2-S3 | done | d475a5f | Switch files, rebind editor, language detection |
| P2-S4 | done | bb35cb8 | Create files with live sync; NewFileInput, fileIndex helpers |
| P2-S5 | todo | | |
| P2-S6 | todo | | |
| P2-S7 | optional | | |
| P2-S8 | todo | | |

## Blockers
(none)

## Notes for next session
- P2-S4 added: `fileIndex.ts` (frontend mirror of backend: createFile, validateFileName, FILE_ID_REGEX, listFiles), `fileIndex.test.ts`, `NewFileInput.tsx`, updated Sidebar with "+" button and inline input, App wires onCreateFile → createFile(ydoc) → setActiveFileId.
- useIndex now exposes `ydoc: Y.Doc` so App can call createFile directly.
- `identity` must NOT be in useFileDoc deps — still true from P2-S3.
- Concurrent same-name creates produce two entries (both visible, sorted by name then id) — noted in DECISIONS.md.
