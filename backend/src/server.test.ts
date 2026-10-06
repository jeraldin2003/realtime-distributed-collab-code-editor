import { describe, it, expect, afterEach } from "vitest";
import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { createServer } from "./server.js";
import { DOC_NAME, TEXT_KEY, ALLOWED_ORIGIN, STARTER, INDEX_DOC } from "./config.js";

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

    // Cap is counted on project:index connections (P2-S2)
    const doc1 = new Y.Doc();
    const provider1 = new HocuspocusProvider({
      url: `ws://127.0.0.1:${port}`,
      name: INDEX_DOC,
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
      name: INDEX_DOC,
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
      name: INDEX_DOC,
      document: doc3,
    });
    activeProviders.push(provider3);

    const synced = await new Promise<boolean>((resolve) => {
      provider3.on("synced", () => resolve(true));
      setTimeout(() => resolve(false), 2000);
    });
    expect(synced).toBe(true);
  });

  it("file:<id> connections do not count toward the user cap", async () => {
    // With maxUsers=1 and one index user connected, additional file:<id>
    // connections from the same socket should still be accepted.
    const { port, stop } = await createServer({ port: 0, maxUsers: 1 });
    stopServer = stop;

    // Connect to index — occupies the single slot
    const indexDoc = new Y.Doc();
    const indexProvider = new HocuspocusProvider({
      url: `ws://127.0.0.1:${port}`,
      name: INDEX_DOC,
      document: indexDoc,
    });
    activeProviders.push(indexProvider);
    await new Promise<void>((resolve) => indexProvider.on("synced", () => resolve()));

    const res = await fetch(`http://127.0.0.1:${port}/status`);
    const data = await res.json();
    expect(data).toEqual({ users: 1, maxUsers: 1 });

    // Now connect to file:main — should be accepted even though index is full
    const fileDoc = new Y.Doc();
    const fileProvider = new HocuspocusProvider({
      url: `ws://127.0.0.1:${port}`,
      name: DOC_NAME,
      document: fileDoc,
    });
    activeProviders.push(fileProvider);

    const fileSynced = await new Promise<boolean>((resolve) => {
      fileProvider.on("synced", () => resolve(true));
      setTimeout(() => resolve(false), 2000);
    });
    expect(fileSynced).toBe(true);

    // Count should still be 1 (file connection not counted)
    const res2 = await fetch(`http://127.0.0.1:${port}/status`);
    const data2 = await res2.json();
    expect(data2).toEqual({ users: 1, maxUsers: 1 });
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

  it("converges offline edits after client reconnects", async () => {
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

    await Promise.all([
      new Promise<void>((resolve) => provider1.on("synced", () => resolve())),
      new Promise<void>((resolve) => provider2.on("synced", () => resolve())),
    ]);

    const ytext1 = doc1.getText(TEXT_KEY);
    const ytext2 = doc2.getText(TEXT_KEY);
    const initLen = STARTER.length;

    // Client 1 disconnects (simulating network offline / tab refresh)
    provider1.destroy();

    // While client 1 is offline, both clients type concurrently
    ytext1.insert(initLen, "\n// Client 1 offline edit");
    ytext2.insert(initLen, "\n// Client 2 online edit");

    // Client 1 reconnects with the same document
    const provider1Reconnected = new HocuspocusProvider({
      url: `ws://127.0.0.1:${port}`,
      name: DOC_NAME,
      document: doc1,
    });
    activeProviders.push(provider1Reconnected);

    // Wait for reconnection to sync
    await new Promise<void>((resolve) =>
      provider1Reconnected.on("synced", () => resolve())
    );

    // Wait for both to converge
    await new Promise<void>((resolve) => {
      const check = () => {
        if (
          ytext1.toString() === ytext2.toString() &&
          ytext1.toString().includes("Client 1 offline edit") &&
          ytext1.toString().includes("Client 2 online edit")
        ) {
          resolve();
        }
      };
      doc1.on("update", check);
      doc2.on("update", check);
      check();
    });

    expect(ytext1.toString()).toEqual(ytext2.toString());
  });

  it("stress test: MAX_USERS clients connect, make concurrent edits, and all converge", async () => {
    const maxUsers = 5;
    const { port, stop } = await createServer({ port: 0, maxUsers });
    stopServer = stop;

    const docs: Y.Doc[] = [];
    const providers: HocuspocusProvider[] = [];

    for (let i = 0; i < maxUsers; i++) {
      const doc = new Y.Doc();
      docs.push(doc);
      const provider = new HocuspocusProvider({
        url: `ws://127.0.0.1:${port}`,
        name: DOC_NAME,
        document: doc,
      });
      providers.push(provider);
      activeProviders.push(provider);
    }

    // Wait until all clients are synced
    await Promise.all(
      providers.map(
        (p) => new Promise<void>((resolve) => p.on("synced", () => resolve()))
      )
    );

    // Each client makes multiple edits concurrently at different positions
    const editCount = 3;
    for (let round = 0; round < editCount; round++) {
      for (let i = 0; i < maxUsers; i++) {
        const text = docs[i].getText(TEXT_KEY);
        text.insert(text.length, `\n// [Client-${i}] round-${round}`);
      }
    }

    // Wait for all documents to converge to the same content
    const expectedPrefix = STARTER;
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(
          new Error(
            `Stress test convergence timeout. Lengths: ${docs.map((d) => d.getText(TEXT_KEY).toString().length).join(", ")}`
          )
        );
      }, 5000);

      const checkAllConverged = () => {
        const first = docs[0].getText(TEXT_KEY).toString();
        const allMatch = docs.every(
          (d) => d.getText(TEXT_KEY).toString() === first
        );
        // Ensure all rounds from all clients are included
        const totalEditsPresent = docs.every((d) => {
          const content = d.getText(TEXT_KEY).toString();
          return Array.from({ length: maxUsers }).every((_, u) =>
            content.includes(`// [Client-${u}] round-${editCount - 1}`)
          );
        });

        if (allMatch && totalEditsPresent) {
          clearTimeout(timeout);
          resolve();
        }
      };

      docs.forEach((d) => d.on("update", checkAllConverged));
      checkAllConverged();
    });

    const finalContent = docs[0].getText(TEXT_KEY).toString();
    expect(finalContent.startsWith(expectedPrefix)).toBe(true);
    for (let i = 1; i < maxUsers; i++) {
      expect(docs[i].getText(TEXT_KEY).toString()).toBe(finalContent);
    }
  });

  it("rejects connection when requesting an unrecognised doc name", async () => {
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

  // --- P2-S1 integration tests ---

  it("rejects bad doc names: plain word and path-traversal id", async () => {
    const { port, stop } = await createServer({ port: 0 });
    stopServer = stop;

    for (const badName of ["foo", "file:../x", "file:UPPER", "project:other"]) {
      const doc = new Y.Doc();
      const provider = new HocuspocusProvider({
        url: `ws://127.0.0.1:${port}`,
        name: badName,
        document: doc,
      });
      activeProviders.push(provider);

      const authFailed = await new Promise<boolean>((resolve) => {
        provider.on("authenticationFailed", () => resolve(true));
        setTimeout(() => resolve(false), 2000);
      });
      expect(authFailed, `expected reject for "${badName}"`).toBe(true);
    }
  });

  it("accepts project:index and seeds one file entry 'main'", async () => {
    const { port, stop } = await createServer({ port: 0 });
    stopServer = stop;

    const doc = new Y.Doc();
    const provider = new HocuspocusProvider({
      url: `ws://127.0.0.1:${port}`,
      name: "project:index",
      document: doc,
    });
    activeProviders.push(provider);

    await new Promise<void>((resolve) => provider.on("synced", () => resolve()));

    const filesMap = doc.getMap("files") as Y.Map<Y.Map<unknown>>;
    expect(filesMap.size).toBe(1);
    expect(filesMap.has("main")).toBe(true);
    const mainEntry = filesMap.get("main");
    expect(mainEntry?.get("name")).toBe("main.ts");
    expect(mainEntry?.get("type")).toBe("file");
  });

  it("accepts file:main and it still contains the starter snippet", async () => {
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

  it("accepts file:<other-id> as a valid empty doc", async () => {
    const { port, stop } = await createServer({ port: 0 });
    stopServer = stop;

    const doc = new Y.Doc();
    const provider = new HocuspocusProvider({
      url: `ws://127.0.0.1:${port}`,
      name: "file:abc-123",
      document: doc,
    });
    activeProviders.push(provider);

    const synced = await new Promise<boolean>((resolve) => {
      provider.on("synced", () => resolve(true));
      setTimeout(() => resolve(false), 2000);
    });
    // Should connect and sync (empty doc, no starter seeded)
    expect(synced).toBe(true);
    // Content doc starts empty
    expect(doc.getText(TEXT_KEY).toString()).toBe("");
  });
});
