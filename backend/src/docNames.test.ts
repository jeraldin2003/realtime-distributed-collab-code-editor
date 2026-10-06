import { describe, it, expect } from "vitest";
import { INDEX_DOC, FILE_ID_REGEX, fileDocName, parseDocName } from "./docNames.js";

describe("INDEX_DOC", () => {
  it("equals 'project:index'", () => {
    expect(INDEX_DOC).toBe("project:index");
  });
});

describe("fileDocName", () => {
  it("prefixes id with 'file:'", () => {
    expect(fileDocName("main")).toBe("file:main");
    expect(fileDocName("abc-123")).toBe("file:abc-123");
  });
});

describe("FILE_ID_REGEX", () => {
  const valid = ["main", "a", "abc-123", "z".repeat(40), "0", "a0b1-c2"];
  const invalid = [
    "",           // empty
    "A",          // uppercase
    "MAIN",       // uppercase
    "a".repeat(41), // too long
    "ab/cd",      // slash
    "../x",       // path traversal
    "ab cd",      // space
    "ab_cd",      // underscore
    "ab.cd",      // dot
  ];

  for (const id of valid) {
    it(`accepts valid id: "${id}"`, () => {
      expect(FILE_ID_REGEX.test(id)).toBe(true);
    });
  }

  for (const id of invalid) {
    it(`rejects invalid id: "${id}"`, () => {
      expect(FILE_ID_REGEX.test(id)).toBe(false);
    });
  }
});

describe("parseDocName", () => {
  it("parses project:index → {kind:'index'}", () => {
    expect(parseDocName("project:index")).toEqual({ kind: "index" });
  });

  it("parses file:main → {kind:'file', id:'main'}", () => {
    expect(parseDocName("file:main")).toEqual({ kind: "file", id: "main" });
  });

  it("parses file:abc-123 → {kind:'file', id:'abc-123'}", () => {
    expect(parseDocName("file:abc-123")).toEqual({ kind: "file", id: "abc-123" });
  });

  it("parses file with 40-char id", () => {
    const id = "a".repeat(40);
    expect(parseDocName(`file:${id}`)).toEqual({ kind: "file", id });
  });

  // Invalid names
  const invalidNames = [
    "foo",            // no prefix
    "file:",          // empty id
    "file:../x",      // path traversal
    "file:UPPER",     // uppercase
    "file:ab cd",     // space
    "file:ab/cd",     // slash
    "file:" + "a".repeat(41), // id too long
    "project:other",  // not the index
    "",               // empty string
    "FILE:main",      // wrong case prefix
  ];

  for (const name of invalidNames) {
    it(`returns null for invalid name: "${name}"`, () => {
      expect(parseDocName(name)).toBeNull();
    });
  }
});
