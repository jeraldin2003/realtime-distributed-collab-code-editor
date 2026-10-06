---
name: grounding
description: Rules to prevent hallucinated APIs, wrong versions, and phantom files. Mandatory before using any library for the first time and whenever unsure how something works.
---

# Grounding (anti-hallucination)

## The rule
Never write code against an API you have not verified in **this repo's installed version**. Names, options, hook signatures, and defaults differ between versions and between memory and reality.

## Before first use of any package
1. Install it, then read what's actually installed: `node_modules/<pkg>/package.json` (version), the README, and the type definitions (`.d.ts`). Search the types for the exact names you plan to use (`grep -rn "onConnect" node_modules/@hocuspocus/server/dist --include=*.d.ts`).
2. If types/README don't answer it, search the official docs for **the installed version**, or read the package's source in `node_modules`.
3. Write a tiny smoke test or script that calls the API and shows it works (a Vitest test is ideal). Build on it only after it passes.
4. If you still cannot verify, say `UNVERIFIED: <what>` in your plan and ask the user. Do not guess.

## Version-sensitive areas in this project (always verify)
- **Hocuspocus server:** how to construct and start the server, how to share an HTTP port with WebSocket, hook names and signatures (connection, authenticate, load document, disconnect), how to reject a connection and what the client sees.
- **Hocuspocus provider:** constructor options, status values, events for rejected/closed connections, how to share one websocket across multiple providers, how to destroy cleanly.
- **y-monaco:** `MonacoBinding` constructor arguments and how remote cursor CSS classes are named.
- **Monaco in Vite:** worker setup differs by package choice and Vite version.
- **Awareness API:** getting states, setting local state, change events.

## Repo-state grounding
- Before editing a file, read it. Never assume a file or function exists; list the directory or grep first.
- Before importing a local module, confirm the export exists.
- Don't reference docs, scripts, or env vars that aren't in the repo. If a step says one should exist, check that it does.
- After every change, run typecheck. A type error you "think is fine" is a bug.

## Errors
- Read the full error and fix the cause. Don't paper over with `any`, `@ts-ignore`, or deleting code.
- If two different fixes fail, stop guessing: reduce to a minimal reproduction, or ask.

## Reporting
List in your report any API you used that you verified only by types and not by running. Say which tests exercise it.
