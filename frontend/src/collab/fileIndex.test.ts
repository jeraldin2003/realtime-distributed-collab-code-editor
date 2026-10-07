import { describe, it, expect } from "vitest";
import * as Y from "yjs";
import {
  FILE_ID_REGEX,
  validateFileName,
  VALIDATION_MESSAGES,
  createFile,
  createFolder,
  renameFile,
  deleteFile,
  listFiles,
} from "./fileIndex.js";
import type { FileEntry } from "./useIndex.js";
import { MAX_FILES } from "../config.js";

const noFiles: FileEntry[] = [];

// ─── FILE_ID_REGEX ────────────────────────────────────────────────────────────

describe("FILE_ID_REGEX", () => {
  const valid = ["main", "a", "abc-123", "z".repeat(40), "0"];
  const invalid = ["", "A", "MAIN", "a".repeat(41), "ab/cd", "../x", "ab cd", "ab_cd"];

  for (const id of valid) {
    it(`accepts "${id}"`, () => expect(FILE_ID_REGEX.test(id)).toBe(true));
  }
  for (const id of invalid) {
    it(`rejects "${id}"`, () => expect(FILE_ID_REGEX.test(id)).toBe(false));
  }
});

// ─── validateFileName ─────────────────────────────────────────────────────────

describe("validateFileName", () => {
  it("returns null for a valid name", () => {
    expect(validateFileName("utils.ts", noFiles)).toBeNull();
  });

  it("returns 'empty' for blank name", () => {
    expect(validateFileName("", noFiles)).toBe("empty");
    expect(validateFileName("   ", noFiles)).toBe("empty");
  });

  it("returns 'too_long' when name exceeds 100 chars", () => {
    expect(validateFileName("a".repeat(101), noFiles)).toBe("too_long");
    expect(validateFileName("a".repeat(100), noFiles)).toBeNull();
  });

  it("returns 'invalid_chars' for names containing /", () => {
    expect(validateFileName("foo/bar.ts", noFiles)).toBe("invalid_chars");
  });

  it("returns 'invalid_chars' for names containing \\", () => {
    expect(validateFileName("foo\\bar.ts", noFiles)).toBe("invalid_chars");
  });

  it("returns 'duplicate_name' when name already exists (case-insensitive)", () => {
    const files: FileEntry[] = [
      { id: "main", name: "main.ts", type: "file", parentId: null },
    ];
    expect(validateFileName("main.ts", files)).toBe("duplicate_name");
    expect(validateFileName("MAIN.TS", files)).toBe("duplicate_name");
    expect(validateFileName("Main.ts", files)).toBe("duplicate_name");
  });

  it("returns 'max_files' when already at MAX_FILES limit", () => {
    const files: FileEntry[] = Array.from({ length: MAX_FILES }, (_, i) => ({
      id: `id-${i}`,
      name: `file${i}.ts`,
      type: "file" as const,
      parentId: null,
    }));
    expect(validateFileName("newfile.ts", files)).toBe("max_files");
  });

  it("has a human-readable message for every error code", () => {
    const codes: Array<keyof typeof VALIDATION_MESSAGES> = [
      "empty",
      "too_long",
      "invalid_chars",
      "duplicate_name",
      "max_files",
    ];
    for (const code of codes) {
      expect(typeof VALIDATION_MESSAGES[code]).toBe("string");
      expect(VALIDATION_MESSAGES[code].length).toBeGreaterThan(0);
    }
  });
});

// ─── createFile ───────────────────────────────────────────────────────────────

describe("createFile", () => {
  it("returns an id matching FILE_ID_REGEX", () => {
    const doc = new Y.Doc();
    const id = createFile(doc, { name: "hello.ts" });
    expect(id).toMatch(FILE_ID_REGEX);
  });

  it("creates an entry with trimmed name, parentId null, type file", () => {
    const doc = new Y.Doc();
    const id = createFile(doc, { name: "  hello.ts  " });
    const files = listFiles(doc);
    expect(files).toHaveLength(1);
    expect(files[0]).toMatchObject({ id, name: "hello.ts", parentId: null, type: "file" });
  });

  it("generates unique ids for two creates", () => {
    const doc = new Y.Doc();
    const id1 = createFile(doc, { name: "a.ts" });
    const id2 = createFile(doc, { name: "b.ts" });
    expect(id1).not.toBe(id2);
  });
});

// ─── listFiles ────────────────────────────────────────────────────────────────

describe("listFiles", () => {
  it("returns empty array for empty doc", () => {
    expect(listFiles(new Y.Doc())).toEqual([]);
  });

  it("sorts by name then id", () => {
    const doc = new Y.Doc();
    // Insert controlled entries via the map directly for predictable ids
    const map = doc.getMap("files") as Y.Map<Y.Map<unknown>>;
    doc.transact(() => {
      const e1 = new Y.Map<unknown>();
      e1.set("name", "b.ts"); e1.set("parentId", null); e1.set("type", "file");
      map.set("id-z", e1);
      const e2 = new Y.Map<unknown>();
      e2.set("name", "a.ts"); e2.set("parentId", null); e2.set("type", "file");
      map.set("id-m", e2);
      const e3 = new Y.Map<unknown>();
      e3.set("name", "a.ts"); e3.set("parentId", null); e3.set("type", "file");
      map.set("id-a", e3);
    });
    const files = listFiles(doc);
    expect(files.map((f) => [f.name, f.id])).toEqual([
      ["a.ts", "id-a"],
      ["a.ts", "id-m"],
      ["b.ts", "id-z"],
    ]);
  });
});

// ─── concurrent creates ───────────────────────────────────────────────────────

describe("concurrent creates merge correctly", () => {
  it("two docs each create a file, then merge — both see two files", () => {
    const doc1 = new Y.Doc();
    const doc2 = new Y.Doc();

    const id1 = createFile(doc1, { name: "alpha.ts" });
    const id2 = createFile(doc2, { name: "beta.ts" });

    Y.applyUpdate(doc2, Y.encodeStateAsUpdate(doc1));
    Y.applyUpdate(doc1, Y.encodeStateAsUpdate(doc2));

    const files1 = listFiles(doc1);
    const files2 = listFiles(doc2);

    expect(files1).toHaveLength(2);
    expect(files2).toHaveLength(2);
    expect(files1.map((f) => f.id).sort()).toEqual(files2.map((f) => f.id).sort());
    expect(files1.map((f) => f.id)).toContain(id1);
    expect(files1.map((f) => f.id)).toContain(id2);
  });

  it("same-name concurrent creates produce two separate entries (allowed)", () => {
    const doc1 = new Y.Doc();
    const doc2 = new Y.Doc();

    const id1 = createFile(doc1, { name: "same.ts" });
    const id2 = createFile(doc2, { name: "same.ts" });

    Y.applyUpdate(doc2, Y.encodeStateAsUpdate(doc1));
    Y.applyUpdate(doc1, Y.encodeStateAsUpdate(doc2));

    expect(listFiles(doc1)).toHaveLength(2);
    expect(id1).not.toBe(id2);
  });

  it("names are preserved correctly after merge", () => {
    const doc1 = new Y.Doc();
    const doc2 = new Y.Doc();

    const id1 = createFile(doc1, { name: "from-doc1.ts" });
    const id2 = createFile(doc2, { name: "from-doc2.ts" });

    Y.applyUpdate(doc2, Y.encodeStateAsUpdate(doc1));
    Y.applyUpdate(doc1, Y.encodeStateAsUpdate(doc2));

    const byId = Object.fromEntries(listFiles(doc1).map((f) => [f.id, f]));
    expect(byId[id1]?.name).toBe("from-doc1.ts");
    expect(byId[id2]?.name).toBe("from-doc2.ts");
  });
});

// ─── renameFile ───────────────────────────────────────────────────────────────

describe("renameFile", () => {
  it("renames an existing file entry", () => {
    const doc = new Y.Doc();
    const id = createFile(doc, { name: "initial.ts" });
    renameFile(doc, id, "renamed.ts");
    const files = listFiles(doc);
    expect(files[0].name).toBe("renamed.ts");
  });

  it("trims the new name", () => {
    const doc = new Y.Doc();
    const id = createFile(doc, { name: "initial.ts" });
    renameFile(doc, id, "  trimmed.ts  ");
    const files = listFiles(doc);
    expect(files[0].name).toBe("trimmed.ts");
  });

  it("no-ops if id does not exist", () => {
    const doc = new Y.Doc();
    createFile(doc, { name: "initial.ts" });
    renameFile(doc, "non-existent-id", "new.ts");
    const files = listFiles(doc);
    expect(files[0].name).toBe("initial.ts");
  });

  it("allows renaming to same name when excludeId is passed to validateFileName", () => {
    const files: FileEntry[] = [
      { id: "id-1", name: "current.ts", type: "file", parentId: null },
      { id: "id-2", name: "other.ts", type: "file", parentId: null },
    ];
    // Renaming id-1 to "current.ts" or "CURRENT.TS" should be allowed
    expect(validateFileName("current.ts", files, "id-1")).toBeNull();
    // Renaming id-1 to "other.ts" should collide
    expect(validateFileName("other.ts", files, "id-1")).toBe("duplicate_name");
  });
});

// ─── deleteFile ───────────────────────────────────────────────────────────────

describe("deleteFile", () => {
  it("removes an existing file from the index", () => {
    const doc = new Y.Doc();
    const id = createFile(doc, { name: "temp.ts" });
    expect(listFiles(doc)).toHaveLength(1);
    deleteFile(doc, id);
    expect(listFiles(doc)).toHaveLength(0);
  });

  it("no-ops if id does not exist", () => {
    const doc = new Y.Doc();
    createFile(doc, { name: "keep.ts" });
    deleteFile(doc, "non-existent-id");
    expect(listFiles(doc)).toHaveLength(1);
  });

  it("concurrent delete and edit in another doc merges correctly", () => {
    const doc1 = new Y.Doc();
    const id = createFile(doc1, { name: "file.ts" });
    const doc2 = new Y.Doc();
    Y.applyUpdate(doc2, Y.encodeStateAsUpdate(doc1));

    // doc1 deletes the file
    deleteFile(doc1, id);
    // doc2 creates a new file
    createFile(doc2, { name: "new.ts" });

    // merge
    Y.applyUpdate(doc2, Y.encodeStateAsUpdate(doc1));
    Y.applyUpdate(doc1, Y.encodeStateAsUpdate(doc2));

    expect(listFiles(doc1).map((f) => f.name)).toEqual(["new.ts"]);
    expect(listFiles(doc2).map((f) => f.name)).toEqual(["new.ts"]);
  });

  it("recursively deletes all descendants when deleting a folder", () => {
    const doc = new Y.Doc();
    const folder1 = createFolder(doc, { name: "src" });
    const subfolder = createFolder(doc, { name: "components", parentId: folder1 });
    createFile(doc, { name: "Button.tsx", parentId: subfolder });
    const fileInRoot = createFile(doc, { name: "index.ts" });

    expect(listFiles(doc)).toHaveLength(4);

    deleteFile(doc, folder1);

    const remaining = listFiles(doc);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(fileInRoot);
    expect(remaining[0].name).toBe("index.ts");
  });
});

// ─── Folders & nesting ────────────────────────────────────────────────────────

describe("Folders and depth limits", () => {
  it("enforces max depth 5", () => {
    const files: FileEntry[] = [];
    let currentParent: string | null = null;
    for (let depth = 0; depth < 5; depth++) {
      const id = `f-${depth}`;
      files.push({ id, name: `level-${depth}`, type: "folder", parentId: currentParent });
      currentParent = id;
    }

    // Depth 5 already reached for currentParent
    expect(validateFileName("too-deep.ts", files, undefined, currentParent)).toBe("max_depth");
    // Allowed in shallower folder
    expect(validateFileName("ok.ts", files, undefined, "f-2")).toBeNull();
  });

  it("checks uniqueness per folder (same name in different folders allowed)", () => {
    const files: FileEntry[] = [
      { id: "root-file", name: "index.ts", type: "file", parentId: null },
      { id: "folder-1", name: "utils", type: "folder", parentId: null },
      { id: "nested-file", name: "index.ts", type: "file", parentId: "folder-1" },
    ];

    // Same name in folder-1 collides
    expect(validateFileName("index.ts", files, undefined, "folder-1")).toBe("duplicate_name");
    // Same name in root collides
    expect(validateFileName("index.ts", files, undefined, null)).toBe("duplicate_name");
    // Creating "helper.ts" in folder-1 is fine
    expect(validateFileName("helper.ts", files, undefined, "folder-1")).toBeNull();
  });
});


