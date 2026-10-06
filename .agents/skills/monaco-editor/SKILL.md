---
name: monaco-editor
description: Rules for integrating Monaco with Yjs (y-monaco), per-user cursor styling, file switching, and editor setup in React/Vite.
---

# Monaco editor playbook

Verify APIs per the `grounding` skill.

## Setup
- Choose one integration (`@monaco-editor/react` or direct `monaco-editor`), record it in `docs/DECISIONS.md`, and stay consistent.
- Vite needs worker configuration for Monaco. After setup, check the browser console for worker errors and confirm highlighting works.
- Options: dark theme, `minimap` off, `automaticLayout` on, not read-only.
- When bound to Yjs, never pass the text as a controlled `value`; the binding owns the content.

## Binding (`y-monaco`)
- Create the binding after both the editor/model and the provider's awareness exist.
- Destroy the binding on unmount and before the provider.
- One model, one binding. On file switch (P2-S3): destroy the old binding, then bind to the new `ytext`/model. Avoid showing the previous file's text during the switch.
- Language comes from the file name's extension (map in `frontend/src/languages.ts`; default plaintext).

## Remote cursors
- Per-client CSS generated from awareness `{name, color}`: cursor line, name label, translucent selection.
- Remove CSS for users who left.
- Labels small and unobtrusive.

## UI shell
- Header: app name, active file name, connection status, `N / MAX` users.
- P2: left sidebar with file list; editor fills the rest.
- Full-screen "Room is full" state replaces the editor, with a "Try again" button.
- Plain CSS only. No UI libraries.

## Pitfalls
- Setting the editor value manually fights the binding.
- Missing `automaticLayout` → editor renders at 0 height.
- Stale cursor styles for departed users.
- Binding left attached to a model from a previous file.
