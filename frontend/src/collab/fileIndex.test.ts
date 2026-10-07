import { describe, it, expect } from "vitest";
import * as Y from "yjs";
import {
  FILE_ID_REGEX,
  validateFileName,
  VALIDATION_MESSAGES,
  createFile,
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
