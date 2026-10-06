import { Server } from "@hocuspocus/server";
import { ALLOWED_ORIGIN, TEXT_KEY, STARTER, MAX_USERS } from "./config.js";
import { ConnectionLimiter } from "./connectionLimiter.js";
import { parseDocName } from "./docNames.js";
import { ensureDefaultIndex } from "./fileIndex.js";

export interface CreateServerOptions {
  port?: number;
  quiet?: boolean;
  maxUsers?: number;
}

export async function createServer(options: CreateServerOptions = {}) {
  const seededDocuments = new Set<string>();
  const maxUsers = options.maxUsers ?? MAX_USERS;
  const limiter = new ConnectionLimiter(maxUsers);

  const server = new Server({
    port: options.port ?? 1234,
    quiet: options.quiet ?? true,
    async onRequest({ request, response }) {
      const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

      // Set CORS headers for ALLOWED_ORIGIN
      response.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
      response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
      response.setHeader("Access-Control-Allow-Headers", "Content-Type");

      if (request.method === "OPTIONS") {
        response.writeHead(204);
        response.end();
        throw null; // Prevent default Welcome message
      }

      if (url.pathname === "/health" && request.method === "GET") {
        response.writeHead(200, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ ok: true }));
        throw null; // Prevent default Welcome message
      }

      if (url.pathname === "/status" && request.method === "GET") {
        response.writeHead(200, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ users: limiter.count(), maxUsers: limiter.getMaxUsers() }));
        throw null; // Prevent default Welcome message
      }
    },
    async onLoadDocument(data) {
      const parsed = parseDocName(data.documentName);

      if (parsed?.kind === "index") {
        // Seed the project:index with the default project (main → main.ts) if empty.
        // ensureDefaultIndex is idempotent: no-op if already seeded.
        ensureDefaultIndex(data.document);
      } else if (parsed?.kind === "file" && parsed.id === "main") {
        // Seed file:main with the starter snippet, exactly once.
        if (!seededDocuments.has(data.documentName)) {
          const ytext = data.document.getText(TEXT_KEY);
          if (ytext.length === 0) {
            ytext.insert(0, STARTER);
            seededDocuments.add(data.documentName);
          }
        }
      }
      // Other file:<id> docs start empty — no seeding needed.

      return data.document;
    },
    async onConnect(data) {
      const { documentName, socketId } = data;
      const parsed = parseDocName(documentName);

      if (!parsed) {
        // Unknown doc name — reject immediately.
        console.warn(
          `[reject] doc="${documentName}" client="${socketId.slice(0, 8)}" reason="invalid doc name"`
        );
        throw new Error(`Unauthorized document: ${documentName}`);
      }

      // Cap applies only to project:index connections (one per browser tab = one user).
      // Connections to file:<id> docs are never counted. (P2-S2)
      if (parsed.kind === "index") {
        if (!limiter.tryAdd(socketId)) {
          console.warn(
            `[reject] doc="${documentName}" client="${socketId.slice(0, 8)}" reason="room full" count=${limiter.count()}/${limiter.getMaxUsers()}`
          );
          throw new Error("room-full");
        }
        console.log(
          `[connect] doc="${documentName}" client="${socketId.slice(0, 8)}" count=${limiter.count()}/${limiter.getMaxUsers()}`
        );
      } else {
        console.log(`[connect] doc="${documentName}" client="${socketId.slice(0, 8)}"`);
      }
    },
    async onDisconnect(data) {
      const { documentName, socketId } = data;
      const parsed = parseDocName(documentName);

      // Only remove from limiter if it was a counted connection (project:index).
      if (parsed?.kind === "index") {
        limiter.remove(socketId);
        console.log(
          `[disconnect] doc="${documentName}" client="${socketId.slice(0, 8)}" count=${limiter.count()}/${limiter.getMaxUsers()}`
        );
      } else {
        console.log(`[disconnect] doc="${documentName}" client="${socketId.slice(0, 8)}"`);
      }
    },
  });

  await server.listen(options.port);

  return {
    server,
    port: (server.address as { port: number }).port,
    limiter,
    async stop() {
      await server.destroy();
    },
  };
}
