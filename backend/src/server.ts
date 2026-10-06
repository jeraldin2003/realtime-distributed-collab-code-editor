import { Server } from "@hocuspocus/server";
import { DOC_NAME, ALLOWED_ORIGIN } from "./config.js";

export interface CreateServerOptions {
  port?: number;
  quiet?: boolean;
}

export async function createServer(options: CreateServerOptions = {}) {
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
    },
    async onConnect(data) {
      const { documentName, socketId } = data;
      if (documentName !== DOC_NAME) {
        console.warn(`[reject] doc="${documentName}" client="${socketId.slice(0, 8)}" reason="invalid doc name"`);
        throw new Error(`Unauthorized document: ${documentName}`);
      }
      console.log(`[connect] doc="${documentName}" client="${socketId.slice(0, 8)}"`);
    },
    async onDisconnect(data) {
      const { documentName, socketId } = data;
      console.log(`[disconnect] doc="${documentName}" client="${socketId.slice(0, 8)}"`);
    },
  });

  await server.listen(options.port);

  return {
    server,
    port: (server.address as { port: number }).port,
    async stop() {
      await server.destroy();
    },
  };
}
