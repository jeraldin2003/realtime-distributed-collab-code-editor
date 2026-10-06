# Decisions

Format: `- [step] decision — reason`. Add one line per notable choice. Record exact dependency versions after P1-S0.

- [init] Yjs + Hocuspocus for sync — mature CRDT, awareness built in, connection hooks for the cap.
- [init] Monaco + y-monaco — VS Code engine with official Yjs binding.
- [init] Two independent folders, no shared package — matches owner's structure; backend owns constants.
- [init] No persistence, no auth in Phases 1–2 — keep scope small; seams only.
- [init] No code execution — product boundary.

- [P1-S0] Scaffolded backend with Node LTS, TypeScript strict, tsx dev runner, and Vitest.
- [P1-S0] Scaffolded frontend with Vite React + TypeScript template, Vitest + jsdom, and ESLint flat config.

## Dependency versions (fill in at P1-S0)
### Backend
- `@eslint/js`: 10.0.1
- `@types/node`: 26.6.4
- `eslint`: 10.12.0
- `tsx`: 4.23.15
- `typescript`: 6.0.3
- `typescript-eslint`: 8.71.1
- `vitest`: 5.0.3

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
