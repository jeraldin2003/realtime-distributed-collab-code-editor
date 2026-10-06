# Distributed Realtime Collaborative Code Editor

A browser-based, real-time collaborative code editor powered by Yjs, Hocuspocus, and Monaco Editor. Multiple users can connect simultaneously to edit code live with synchronized text, selections, and cursors.

## Project Structure

- `frontend/`: React + Vite + TypeScript application running Monaco Editor (`http://localhost:5173`).
- `backend/`: Node.js + TypeScript server running Hocuspocus WebSocket server and HTTP endpoints (`http://localhost:1234`).
- `docs/`: Architecture, roadmap, decisions, and step specifications.
- `.agents/`: Agent skills and workflow playbooks.

## Running the Application

### 1. Backend

In a dedicated terminal:

```bash
cd backend
npm install
cp .env.example .env # optional override
npm run dev
```

The backend server starts on port `1234`.

Available scripts in `backend/`:
- `npm run dev`: Start dev server with file watching via `tsx`.
- `npm run build`: Compile TypeScript to `dist/`.
- `npm run typecheck`: Run TypeScript compiler checks without emitting code.
- `npm run lint`: Run ESLint on `src/`.
- `npm test`: Run backend tests with Vitest.

### 2. Frontend

In another dedicated terminal:

```bash
cd frontend
npm install
cp .env.example .env # optional override
npm run dev
```

The frontend Vite dev server will start at `http://localhost:5173`.

Available scripts in `frontend/`:
- `npm run dev`: Start Vite development server.
- `npm run build`: Compile and build production bundle into `dist/`.
- `npm run typecheck`: Check types using `tsc -b`.
- `npm run lint`: Run ESLint across project files.
- `npm test`: Run frontend unit/component tests with Vitest.
