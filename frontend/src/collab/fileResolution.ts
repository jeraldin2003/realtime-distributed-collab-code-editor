import type { FileEntry } from "./useIndex.js";

export interface DeletedResolution {
  /** The new file id to switch to, or null if no files remain. */
  nextFileId: string | null;
  /** True if the active file was deleted from the file list. */
  wasDeleted: boolean;
}

/**
 * Pure function to resolve active file status when files list changes.
 * If the active file is deleted, selects the first remaining file (if any).
 * If the active file is still present, retains it with wasDeleted = false.
 */
export function resolveActiveFileOnFilesChange(
  activeFileId: string | null,
  files: FileEntry[]
): DeletedResolution {
  if (!activeFileId) {
    return {
      nextFileId: files.length > 0 ? files[0].id : null,
      wasDeleted: false,
    };
  }

  const exists = files.some((f) => f.id === activeFileId);
  if (exists) {
    return {
      nextFileId: activeFileId,
      wasDeleted: false,
    };
  }

  // Active file was deleted
  return {
    nextFileId: files.length > 0 ? files[0].id : null,
    wasDeleted: true,
  };
}
