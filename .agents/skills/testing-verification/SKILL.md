---
name: testing-verification
description: Which checks to run, how to write sync and cap tests, and how to verify real-time behavior honestly before reporting a step done.
---

# Testing and verification

## Required checks (both folders)
```
npm run typecheck
npm run lint
npm test
```
All three must pass before committing. Run them in `backend/` and in `frontend/`.

## Test principles
- Backend integration tests start the server on a **random port**, connect real provider clients, and clean up in `afterEach`. They never depend on a running dev server.
- Wait for sync using events or short polling with a timeout, not fixed sleeps.
- Unit-test pure logic separately: `connectionLimiter`, `docNames`, `fileIndex`, frontend index helpers.
- Convergence tests: apply concurrent edits from two clients, wait, assert identical text.
- Each test must be able to fail. Don't write tests that pass trivially.

## Manual verification
Use 2–3 browser tabs and walk through the step's acceptance list. Also check:
- Browser console: no errors or warnings about Monaco workers or Yjs.
- No duplicated or lost characters during simultaneous typing.
- Refresh rejoins cleanly; ghost cursors disappear within a few seconds.
- Stop and restart the backend to test reconnect (from P1-S7).

If you cannot run a browser, say so explicitly in the report: list criteria covered only by automated tests and the ones left unverified.

## Process hygiene
- Stop every dev server you started before finishing.
- Don't leave watch-mode test runners running.
- Check that ports 1234 and 5173 are free at the end.

## Reporting
Summarize real command results (pass/fail, counts). Never claim a result you did not observe.
