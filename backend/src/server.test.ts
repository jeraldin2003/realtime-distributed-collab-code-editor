import { describe, it, expect, afterEach } from "vitest";
import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { createServer } from "./server.js";
import { DOC_NAME, TEXT_KEY, ALLOWED_ORIGIN, STARTER } from "./config.js";

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

  it("serves GET /status with active users and maxUsers", async () => {
    const { port, stop } = await createServer({ port: 0, maxUsers: 5 });
    stopServer = stop;

    const res = await fetch(`http://127.0.0.1:${port}/status`);
    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBe(ALLOWED_ORIGIN);
    const data = await res.json();
    expect(data).toEqual({ users: 0, maxUsers: 5 });
  });

  it("enforces MAX_USERS cap: rejects client over limit and accepts after disconnect", async () => {
    const { port, stop } = await createServer({ port: 0, maxUsers: 1 });
    stopServer = stop;

    const doc1 = new Y.Doc();
    const provider1 = new HocuspocusProvider({
      url: `ws://127.0.0.1:${port}`,
      name: DOC_NAME,
      document: doc1,
    });
    activeProviders.push(provider1);
    await new Promise<void>((resolve) => provider1.on("synced", () => resolve()));

    // Verify /status reflects 1 user
    const res1 = await fetch(`http://127.0.0.1:${port}/status`);
    const data1 = await res1.json();
    expect(data1).toEqual({ users: 1, maxUsers: 1 });

    // Second client should be rejected because room is full
    const doc2 = new Y.Doc();
    const provider2 = new HocuspocusProvider({
      url: `ws://127.0.0.1:${port}`,
      name: DOC_NAME,
      document: doc2,
    });
    activeProviders.push(provider2);

    const authFailed = await new Promise<boolean>((resolve) => {
      provider2.on("authenticationFailed", () => resolve(true));
      setTimeout(() => resolve(false), 2000);
    });
    expect(authFailed).toBe(true);

    // Disconnect provider1
    provider1.destroy();
    // Allow disconnect event loop to register removal
    await new Promise((r) => setTimeout(r, 100));

    // A third client should now be accepted
    const doc3 = new Y.Doc();
    const provider3 = new HocuspocusProvider({
      url: `ws://127.0.0.1:${port}`,
      name: DOC_NAME,
      document: doc3,
    });
    activeProviders.push(provider3);

    const synced = await new Promise<boolean>((resolve) => {
      provider3.on("synced", () => resolve(true));
      setTimeout(() => resolve(false), 2000);
    });
    expect(synced).toBe(true);
  });

  it("seeds STARTER snippet when document is first created and empty", async () => {
    const { port, stop } = await createServer({ port: 0 });
    stopServer = stop;

    const doc = new Y.Doc();
    const provider = new HocuspocusProvider({
      url: `ws://127.0.0.1:${port}`,
      name: DOC_NAME,
      document: doc,
    });
    activeProviders.push(provider);

    await new Promise<void>((resolve) => provider.on("synced", () => resolve()));
    expect(doc.getText(TEXT_KEY).toString()).toBe(STARTER);
  });

  it("seeds STARTER exactly once across three clients connecting in sequence", async () => {
    const { port, stop } = await createServer({ port: 0 });
    stopServer = stop;

    const doc1 = new Y.Doc();
    const provider1 = new HocuspocusProvider({
      url: `ws://127.0.0.1:${port}`,
      name: DOC_NAME,
      document: doc1,
    });
    activeProviders.push(provider1);
    await new Promise<void>((resolve) => provider1.on("synced", () => resolve()));
    expect(doc1.getText(TEXT_KEY).toString()).toBe(STARTER);

    const doc2 = new Y.Doc();
    const provider2 = new HocuspocusProvider({
      url: `ws://127.0.0.1:${port}`,
      name: DOC_NAME,
      document: doc2,
    });
    activeProviders.push(provider2);
    await new Promise<void>((resolve) => provider2.on("synced", () => resolve()));
    expect(doc2.getText(TEXT_KEY).toString()).toBe(STARTER);

    const doc3 = new Y.Doc();
    const provider3 = new HocuspocusProvider({
      url: `ws://127.0.0.1:${port}`,
      name: DOC_NAME,
      document: doc3,
    });
    activeProviders.push(provider3);
    await new Promise<void>((resolve) => provider3.on("synced", () => resolve()));
    expect(doc3.getText(TEXT_KEY).toString()).toBe(STARTER);

    // Verify all docs still match STARTER exactly once
    expect(doc1.getText(TEXT_KEY).toString()).toBe(STARTER);
    expect(doc2.getText(TEXT_KEY).toString()).toBe(STARTER);
    expect(doc3.getText(TEXT_KEY).toString()).toBe(STARTER);
  });

  it("does not re-seed when a client disconnects and reconnects", async () => {
    const { port, stop } = await createServer({ port: 0 });
    stopServer = stop;

    const doc = new Y.Doc();
    const provider1 = new HocuspocusProvider({
      url: `ws://127.0.0.1:${port}`,
      name: DOC_NAME,
      document: doc,
    });
    activeProviders.push(provider1);
    await new Promise<void>((resolve) => provider1.on("synced", () => resolve()));
    expect(doc.getText(TEXT_KEY).toString()).toBe(STARTER);

    // Disconnect provider (simulating tab close/refresh or network drop)
    provider1.destroy();

    // Client reconnects with same document
    const provider2 = new HocuspocusProvider({
      url: `ws://127.0.0.1:${port}`,
      name: DOC_NAME,
      document: doc,
    });
    activeProviders.push(provider2);
    await new Promise<void>((resolve) => provider2.on("synced", () => resolve()));

    expect(doc.getText(TEXT_KEY).toString()).toBe(STARTER);
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

    // Initial content is STARTER; concurrent edits appended to text
    const initLen = STARTER.length;
    ytext1.insert(initLen, "Alice");
    ytext2.insert(initLen, "Bob");

    // Wait for changes to propagate and converge
    await new Promise<void>((resolve) => {
      const checkConvergence = () => {
        if (
          ytext1.toString().length === initLen + 8 &&
          ytext1.toString() === ytext2.toString()
        ) {
          resolve();
        }
      };
      doc1.on("update", checkConvergence);
      doc2.on("update", checkConvergence);
      checkConvergence();
    });

    expect(ytext1.toString()).toEqual(ytext2.toString());
    expect([STARTER + "AliceBob", STARTER + "BobAlice"]).toContain(ytext1.toString());
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
