import { describe, it, expect, afterEach } from "vitest";
import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { createServer } from "./server.js";
import { DOC_NAME, TEXT_KEY, ALLOWED_ORIGIN } from "./config.js";

describe("backend server", () => {
  let stopServer: (() => Promise<void>) | null = null;
  const activeProviders: HocuspocusProvider[] = [];

  afterEach(async () => {
    while (activeProviders.length > 0) {
      const provider = activeProviders.pop();
      provider?.destroy();
    }
    if (stopServer) {
      await stopServer();
      stopServer = null;
    }
  });

  it("serves GET /health with CORS headers", async () => {
    const { port, stop } = await createServer({ port: 0 });
    stopServer = stop;

    const res = await fetch(`http://127.0.0.1:${port}/health`);
    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBe(ALLOWED_ORIGIN);
    const data = await res.json();
    expect(data).toEqual({ ok: true });
  });

  it("converges concurrent text edits from two provider clients on DOC_NAME", async () => {
    const { port, stop } = await createServer({ port: 0 });
    stopServer = stop;

    const doc1 = new Y.Doc();
    const doc2 = new Y.Doc();

    const provider1 = new HocuspocusProvider({
      url: `ws://127.0.0.1:${port}`,
      name: DOC_NAME,
      document: doc1,
    });
    activeProviders.push(provider1);

    const provider2 = new HocuspocusProvider({
      url: `ws://127.0.0.1:${port}`,
      name: DOC_NAME,
      document: doc2,
    });
    activeProviders.push(provider2);

    // Wait until both clients are synced initially
    await Promise.all([
      new Promise<void>((resolve) => provider1.on("synced", () => resolve())),
      new Promise<void>((resolve) => provider2.on("synced", () => resolve())),
    ]);

    const ytext1 = doc1.getText(TEXT_KEY);
    const ytext2 = doc2.getText(TEXT_KEY);

    // Concurrent edits at index 0 from both clients
    ytext1.insert(0, "Alice");
    ytext2.insert(0, "Bob");

    // Wait for changes to propagate and converge
    await new Promise<void>((resolve) => {
      const checkConvergence = () => {
        if (ytext1.toString().length === 8 && ytext1.toString() === ytext2.toString()) {
          resolve();
        }
      };
      doc1.on("update", checkConvergence);
      doc2.on("update", checkConvergence);
      checkConvergence();
    });

    expect(ytext1.toString()).toEqual(ytext2.toString());
    expect(["AliceBob", "BobAlice"]).toContain(ytext1.toString());
  });

  it("rejects connection when requesting a document other than DOC_NAME", async () => {
    const { port, stop } = await createServer({ port: 0 });
    stopServer = stop;

    const invalidDoc = new Y.Doc();
    const provider = new HocuspocusProvider({
      url: `ws://127.0.0.1:${port}`,
      name: "forbidden:doc",
      document: invalidDoc,
    });
    activeProviders.push(provider);

    const authFailed = await new Promise<boolean>((resolve) => {
      provider.on("authenticationFailed", () => resolve(true));
      setTimeout(() => resolve(false), 2000);
    });

    expect(authFailed).toBe(true);
  });
});
