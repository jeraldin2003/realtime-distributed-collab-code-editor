import { describe, it, expect } from "vitest";
import * as Y from "yjs";
import {
  ensureDefaultIndex,
  createFile,
  createFolder,
  renameFile,
  deleteFile,
  listFiles,
} from "./fileIndex.js";
import { DEFAULT_FILE_ID, DEFAULT_FILE_NAME, FILE_INDEX_KEY } from "./config.js";

function freshDoc(): Y.Doc {
  return new Y.Doc();
}

describe("ensureDefaultIndex", () => {
  it("seeds main → main.ts when index is empty", () => {
    const doc = freshDoc();
    ensureDefaultIndex(doc);
    const files = listFiles(doc);
    expect(files).toHaveLength(1);
    expect(files[0]).toMatchObject({
      id: DEFAULT_FILE_ID,
      name: DEFAULT_FILE_NAME,
      parentId: null,
      type: "file",
    });
  });

  it("is idempotent: calling twice does not duplicate entries", () => {
    const doc = freshDoc();
    ensureDefaultIndex(doc);
    ensureDefaultIndex(doc);
    expect(listFiles(doc)).toHaveLength(1);
  });

  it("does nothing when the index already has entries", () => {
    const doc = freshDoc();
    createFile(doc, { name: "existing.ts" });
    ensureDefaultIndex(doc);
    // still just the one existing file
    expect(listFiles(doc)).toHaveLength(1);
  });
});

describe("createFile", () => {
  it("returns a non-empty string id matching FILE_ID_REGEX", () => {
    const doc = freshDoc();
    const id = createFile(doc, { name: "hello.ts" });
    expect(id).toMatch(/^[a-z0-9-]{1,40}$/);
  });

  it("creates an entry in the index with the given name", () => {
    const doc = freshDoc();
    const id = createFile(doc, { name: "hello.ts" });
    const files = listFiles(doc);
    expect(files).toHaveLength(1);
    expect(files[0]).toMatchObject({ id, name: "hello.ts", parentId: null, type: "file" });
  });

  it("sets parentId when provided", () => {
    const doc = freshDoc();
    const id = createFile(doc, { name: "child.ts", parentId: "parent-id" });
    const files = listFiles(doc);
    expect(files[0]).toMatchObject({ id, parentId: "parent-id" });
  });

  it("generates unique ids for two files", () => {
    const doc = freshDoc();
    const id1 = createFile(doc, { name: "a.ts" });
    const id2 = createFile(doc, { name: "b.ts" });
    expect(id1).not.toBe(id2);
    expect(listFiles(doc)).toHaveLength(2);
  });
});

describe("renameFile", () => {
  it("renames an existing file entry", () => {
    const doc = freshDoc();
    const id = createFile(doc, { name: "old.ts" });
    renameFile(doc, id, "new.ts");
    const files = listFiles(doc);
    expect(files[0]).toMatchObject({ id, name: "new.ts" });
  });

  it("is a no-op for a non-existent id", () => {
    const doc = freshDoc();
    expect(() => renameFile(doc, "does-not-exist", "x.ts")).not.toThrow();
    expect(listFiles(doc)).toHaveLength(0);
  });
});

describe("createFolder", () => {
  it("creates a folder entry in the index with type folder", () => {
    const doc = freshDoc();
    const id = createFolder(doc, { name: "src" });
    const files = listFiles(doc);
    expect(files).toHaveLength(1);
    expect(files[0]).toMatchObject({ id, name: "src", parentId: null, type: "folder" });
  });

  it("sets parentId when provided", () => {
    const doc = freshDoc();
    const parentId = createFolder(doc, { name: "root" });
    const id = createFolder(doc, { name: "nested", parentId });
    const files = listFiles(doc);
    expect(files).toHaveLength(2);
    expect(files.find((f) => f.id === id)).toMatchObject({ parentId });
  });
});

describe("deleteFile", () => {
  it("removes an existing file entry", () => {
    const doc = freshDoc();
    const id = createFile(doc, { name: "to-delete.ts" });
    deleteFile(doc, id);
    expect(listFiles(doc)).toHaveLength(0);
  });

  it("is a no-op for a non-existent id", () => {
    const doc = freshDoc();
    expect(() => deleteFile(doc, "ghost-id")).not.toThrow();
  });

  it("only removes the targeted file when multiple exist", () => {
    const doc = freshDoc();
    const id1 = createFile(doc, { name: "keep.ts" });
    const id2 = createFile(doc, { name: "remove.ts" });
    deleteFile(doc, id2);
    const files = listFiles(doc);
    expect(files).toHaveLength(1);
    expect(files[0].id).toBe(id1);
  });

  it("recursively removes all descendant files and subfolders when a folder is deleted", () => {
    const doc = freshDoc();
    const rootFolder = createFolder(doc, { name: "src" });
    const subFolder = createFolder(doc, { name: "components", parentId: rootFolder });
    createFile(doc, { name: "App.tsx", parentId: rootFolder });
    createFile(doc, { name: "Button.tsx", parentId: subFolder });
    const otherFile = createFile(doc, { name: "package.json", parentId: null });

    expect(listFiles(doc)).toHaveLength(5);
    deleteFile(doc, rootFolder);

    const remaining = listFiles(doc);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(otherFile);
  });
});

describe("listFiles", () => {
  it("returns an empty array for an empty index", () => {
    expect(listFiles(freshDoc())).toEqual([]);
  });

  it("sorts by name then id for stable ordering", () => {
    const doc = freshDoc();
    // Manually insert entries with controlled ids to verify sort order
    const map = doc.getMap(FILE_INDEX_KEY) as Y.Map<Y.Map<unknown>>;

    doc.transact(() => {
      const e1 = new Y.Map<unknown>();
      e1.set("name", "b.ts"); e1.set("parentId", null); e1.set("type", "file");
      map.set("id-z", e1);

      const e2 = new Y.Map<unknown>();
      e2.set("name", "a.ts"); e2.set("parentId", null); e2.set("type", "file");
      map.set("id-m", e2);

      const e3 = new Y.Map<unknown>();
      e3.set("name", "a.ts"); e3.set("parentId", null); e3.set("type", "file");
      map.set("id-a", e3); // same name as e2 but earlier id
    });

    const files = listFiles(doc);
    expect(files.map((f) => [f.name, f.id])).toEqual([
      ["a.ts", "id-a"],
      ["a.ts", "id-m"],
      ["b.ts", "id-z"],
    ]);
  });
});

describe("concurrent creates merge correctly", () => {
  it("merges two Y.Docs that each created a file independently", () => {
    const doc1 = freshDoc();
    const doc2 = freshDoc();

    // Each client creates a file in its own doc (no server, direct merge)
    const id1 = createFile(doc1, { name: "alpha.ts" });
    const id2 = createFile(doc2, { name: "beta.ts" });

    // Merge doc1 → doc2 then doc2 → doc1
    Y.applyUpdate(doc2, Y.encodeStateAsUpdate(doc1));
    Y.applyUpdate(doc1, Y.encodeStateAsUpdate(doc2));

    const files1 = listFiles(doc1);
    const files2 = listFiles(doc2);

    // Both docs should have two files after merge
    expect(files1).toHaveLength(2);
    expect(files2).toHaveLength(2);

    // Both docs should have identical sorted file lists
    expect(files1.map((f) => f.id).sort()).toEqual(files2.map((f) => f.id).sort());

    // Both original files are present
    const ids1 = files1.map((f) => f.id);
    expect(ids1).toContain(id1);
    expect(ids1).toContain(id2);
  });

  it("preserves correct names after concurrent creates on two docs", () => {
    const doc1 = freshDoc();
    const doc2 = freshDoc();

    const id1 = createFile(doc1, { name: "file-from-doc1.ts" });
    const id2 = createFile(doc2, { name: "file-from-doc2.ts" });

    Y.applyUpdate(doc2, Y.encodeStateAsUpdate(doc1));
    Y.applyUpdate(doc1, Y.encodeStateAsUpdate(doc2));

    const files1 = listFiles(doc1);
    const byId = Object.fromEntries(files1.map((f) => [f.id, f]));
    expect(byId[id1]?.name).toBe("file-from-doc1.ts");
    expect(byId[id2]?.name).toBe("file-from-doc2.ts");
  });

  it("same-name concurrent creates produce two separate entries", () => {
    const doc1 = freshDoc();
    const doc2 = freshDoc();

    const id1 = createFile(doc1, { name: "same.ts" });
    const id2 = createFile(doc2, { name: "same.ts" });

    Y.applyUpdate(doc2, Y.encodeStateAsUpdate(doc1));
    Y.applyUpdate(doc1, Y.encodeStateAsUpdate(doc2));

    // Two entries with identical names are preserved (allowed per file-model SKILL)
    expect(listFiles(doc1)).toHaveLength(2);
    expect(id1).not.toBe(id2);
  });
});
