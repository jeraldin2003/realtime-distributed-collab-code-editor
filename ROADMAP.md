# Roadmap

Spec for each step: `docs/steps/<ID>.md`. Build in order. One step per task.

## Phase 1 — Live host, single file
| ID | Step | Outcome |
|---|---|---|
| P1-S0 | Scaffold | Two empty-but-runnable projects, scripts, tooling, git |
| P1-S1 | Backend host | Hocuspocus server up; two test clients converge |
| P1-S2 | Frontend shell | Monaco renders locally with header; no networking |
| P1-S3 | Connect and sync | Two browser tabs edit the same file live |
| P1-S4 | Starter seed | Server seeds starter code exactly once |
| P1-S5 | Presence | Names, colors, remote cursors, user count |
| P1-S6 | User cap | Server-enforced `MAX_USERS`, `/status`, "Room is full" UI |
| P1-S7 | Connection UX | Status indicator, reconnect, no ghost cursors |
| P1-S8 | Phase 1 hardening | Full test pass, README, tag `phase-1-complete` |

## Phase 2 — Multiple files
| ID | Step | Outcome |
|---|---|---|
| P2-S1 | Backend file model | Doc naming, file-index helpers, validation, tests (no UI) |
| P2-S2 | Index sync and file list | Frontend shows synced file list; cap moves to index doc |
| P2-S3 | Switch files | Click a file; editor rebinds to that file's doc |
| P2-S4 | Create file | New files sync to everyone |
| P2-S5 | Rename and delete | Safe rename/delete, including "deleted while open" |
| P2-S6 | Presence per file | See who is in which file |
| P2-S7 | Folders (optional) | Nested folders; skip unless user asks |
| P2-S8 | Phase 2 hardening | Full test pass, README, tag `phase-2-complete` |
