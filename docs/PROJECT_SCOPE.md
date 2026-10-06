# Project Scope

## In scope
**Phase 1 — live host, single file**
- One fixed shared file edited by up to `MAX_USERS` people at once
- Live text sync, live cursors/selections with names and colors
- Connection status, automatic reconnect, "Room is full" handling
- Server-enforced user cap

**Phase 2 — multiple files**
- A synced file list (index) for the whole project
- Open any file, edit it live with everyone on that file
- Create, rename, delete files; all synced live
- See which users are in which file
- Optional last step: folders

## Out of scope (do not build, do not scaffold)
- Running, compiling, or previewing code in any form
- Accounts, login, roles, invite links
- Persistence/database (state lives in server memory; restart resets to the starter project)
- Version history, search, chat, comments, import/export
- Language servers; Monaco's built-in highlighting is enough
- Deployment/infra work

## Principles
1. Local typing must feel instant; remote edits merge without moving the local cursor.
2. Everyone converges to identical text.
3. Server enforces rules; client is untrusted.
4. Smallest working thing first, verified, then the next.
