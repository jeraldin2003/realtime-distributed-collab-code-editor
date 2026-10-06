# Distributed Realtime Collaborative Code Editor

A browser-based, real-time collaborative code editor powered by Yjs, Hocuspocus, and Monaco Editor. Multiple users connect simultaneously to edit code live with synchronized text, selections, and cursors.

## Prerequisites

- **Node.js**: LTS (v20+ recommended)
- **npm**: v10+

## Project Structure

```
.
├── frontend/    # React + Vite + TypeScript application running Monaco Editor
├── backend/     # Node.js + TypeScript server running Hocuspocus WebSocket & HTTP endpoints
├── docs/        # Architecture, roadmap, decisions, and step specifications
└── .agents/     # Agent skills and workflow playbooks
```

## Environment Variables

### Backend (`backend/.env`)
Copy `backend/.env.example` to `backend/.env`:
```env
PORT=1234
MAX_USERS=10
ALLOWED_ORIGIN=http://localhost:5173
```
- `PORT`: HTTP and WebSocket listening port (default `1234`).
- `MAX_USERS`: Maximum concurrent client connections allowed (default `10`).
- `ALLOWED_ORIGIN`: Allowed origin header for CORS on HTTP endpoints (`GET /health`, `GET /status`). Set to `*` for LAN access.

### Frontend (`frontend/.env`)
Copy `frontend/.env.example` to `frontend/.env`:
```env
VITE_WS_URL=ws://localhost:1234
VITE_HTTP_URL=http://localhost:1234
```
- `VITE_WS_URL`: WebSocket URL to the backend Hocuspocus server.
- `VITE_HTTP_URL`: HTTP URL to the backend server for `/status` and `/health`.

## Getting Started

### 1. Install Dependencies

In both folders:
```bash
# In backend/
cd backend
npm install

# In frontend/
cd ../frontend
npm install
```

### 2. Start the Backend

In a dedicated terminal:
```bash
cd backend
npm run dev
```
The server will start on port `1234` (or configured `PORT`).

### 3. Start the Frontend

In a separate terminal:
```bash
cd frontend
npm run dev
```
The Vite development server will start on `http://localhost:5173`.

---

## Testing & Verification

### Testing Multi-Tab Collaboration
1. Open `http://localhost:5173` in two or three separate browser tabs.
2. Each tab automatically receives a unique friendly identity (adjective + animal) and distinct color.
3. Type in any tab: text edits synchronize in real time across all open tabs.
4. Move cursor or select text: remote cursors and selection ranges display with user name labels.
5. Header indicates current online participants and active count `N / MAX online`.

### Testing User Cap (`MAX_USERS=2`)
1. In `backend/.env`, set `MAX_USERS=2` (or start with `MAX_USERS=2 npm run dev`).
2. Open two browser tabs: both connect normally and display `2 / 2 online`.
3. Open a third browser tab: the server rejects the connection and displays the **Room is full** screen with a **Try again** button.
4. Close one of the first two tabs, then click **Try again** in the third tab: the client immediately connects to the vacated slot.

### Testing Disconnect & Reconnect UX
1. Open two tabs and verify they are connected.
2. Stop the backend server: the header switches to **Disconnected (retrying…)** and an **Offline banner** appears informing users that edits will sync upon reconnection.
3. Edit text in Monaco while offline (edits remain responsive and unblocked).
4. Restart the backend server: both clients reconnect automatically, text edits merge cleanly, and the offline banner dismisses.

### Running Automated Checks

In `backend/`:
```bash
npm run typecheck  # TypeScript check (tsc --noEmit)
npm run lint       # ESLint check
npm test           # Vitest integration & unit tests
```

In `frontend/`:
```bash
npm run typecheck  # TypeScript check (tsc -b)
npm run lint       # ESLint check
npm test           # Vitest component & unit tests
```

---

## Known Limitations (Phase 1)
- **No Persistence**: Document state is kept in server memory; restarting the server resets the shared file to the initial starter code.
- **No Authentication**: Clients are assigned random identities stored in `sessionStorage` per tab.
- **No Code Execution**: Strictly an in-browser code editor; code execution, sandboxes, and terminal commands are intentionally out of scope.
