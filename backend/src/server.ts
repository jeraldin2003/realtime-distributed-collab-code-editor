import { Server } from "@hocuspocus/server";
import { DOC_NAME, ALLOWED_ORIGIN, TEXT_KEY, STARTER, MAX_USERS } from "./config.js";
import { ConnectionLimiter } from "./connectionLimiter.js";

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
      if (data.documentName === DOC_NAME && !seededDocuments.has(data.documentName)) {
        const ytext = data.document.getText(TEXT_KEY);
        if (ytext.length === 0) {
          ytext.insert(0, STARTER);
          seededDocuments.add(data.documentName);
        }
      }
      return data.document;
    },
    async onConnect(data) {
      const { documentName, socketId } = data;
      if (documentName !== DOC_NAME) {
        console.warn(`[reject] doc="${documentName}" client="${socketId.slice(0, 8)}" reason="invalid doc name"`);
        throw new Error(`Unauthorized document: ${documentName}`);
      }

      if (!limiter.tryAdd(socketId)) {
        console.warn(
          `[reject] doc="${documentName}" client="${socketId.slice(0, 8)}" reason="room full" count=${limiter.count()}/${limiter.getMaxUsers()}`
        );
        throw new Error("room-full");
      }

      console.log(
        `[connect] doc="${documentName}" client="${socketId.slice(0, 8)}" count=${limiter.count()}/${limiter.getMaxUsers()}`
      );
    },
    async onDisconnect(data) {
      const { documentName, socketId } = data;
      limiter.remove(socketId);
      console.log(
        `[disconnect] doc="${documentName}" client="${socketId.slice(0, 8)}" count=${limiter.count()}/${limiter.getMaxUsers()}`
      );
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
