import { describe, it, expect } from "vitest";
import { resolveActiveFileOnFilesChange } from "./fileResolution.js";
import type { FileEntry } from "./useIndex.js";

describe("resolveActiveFileOnFilesChange", () => {
  const sampleFiles: FileEntry[] = [
    { id: "file-1", name: "a.ts", type: "file", parentId: null },
    { id: "file-2", name: "b.ts", type: "file", parentId: null },
  ];

  it("keeps active file if it still exists in the files list", () => {
    const result = resolveActiveFileOnFilesChange("file-2", sampleFiles);
    expect(result).toEqual({
      nextFileId: "file-2",
      wasDeleted: false,
    });
  });

  it("detects deleted file and switches to the first remaining file", () => {
    const remainingFiles = [sampleFiles[1]]; // only file-2 remains
    const result = resolveActiveFileOnFilesChange("file-1", remainingFiles);
    expect(result).toEqual({
      nextFileId: "file-2",
      wasDeleted: true,
    });
  });

  it("detects deleted file and sets nextFileId to null when no files remain", () => {
    const result = resolveActiveFileOnFilesChange("file-1", []);
    expect(result).toEqual({
      nextFileId: null,
      wasDeleted: true,
    });
  });

  it("handles null activeFileId gracefully", () => {
    const result = resolveActiveFileOnFilesChange(null, sampleFiles);
    expect(result).toEqual({
      nextFileId: "file-1",
      wasDeleted: false,
    });

    const resultEmpty = resolveActiveFileOnFilesChange(null, []);
    expect(resultEmpty).toEqual({
      nextFileId: null,
      wasDeleted: false,
    });
  });
});
