---
name: file-model
description: Phase 2 design for multiple files: file index doc, per-file docs, id-based keys, validation, deleted-while-open handling. Read for every P2 step.
---

# File model (Phase 2)

Source of truth for shapes and names: `docs/ARCHITECTURE.md`. Do not change it without user approval.

## Structure
- `project:index` doc: `Y.Map "files"`, `fileId → Y.Map { name, parentId, type }`.
- `file:<id>` docs: `Y.Text "content"`.
- Files are identified by **id**. Renames change only `name`, so edits never conflict with renames.
- Ids: lowercase `[a-z0-9-]`, 1–40 chars, generated uniquely (random suffix). Default file id is `main`.

## Rules
- Validate names on the client: trimmed, 1–100 chars, no `/` or `\`, unique among siblings, total files ≤ 50.
- Concurrent creates with the same name may produce two entries. This is allowed. Sort by name then id so the list is stable on every client.
- The frontend has its own copy of the minimal index helpers (no shared package); keep behavior identical to `backend/src/fileIndex.ts` and cover both with tests, including concurrent merges between two `Y.Doc`s.
- Only the active file has a live provider on the client.
- The server rejects unknown doc names, and does not validate index mutations (known limitation).

## Deleted-while-open (P2-S5)
- Detect by observing the index: if the active id disappears → destroy file provider and binding, show a notice, select the first remaining file, or the empty state if none.
- Orphan file docs remain in server memory; acceptable for now.

## Defaults
- On a fresh server: index has `main` → `main.ts`; `file:main` has the starter snippet.
- No persistence: a restart resets to this default project.

## Pitfalls
- Using names or paths as keys.
- Opening providers for every file in the list (only the active one gets one).
- Counting file-doc connections toward `MAX_USERS`.
- Forgetting the empty-project state.
