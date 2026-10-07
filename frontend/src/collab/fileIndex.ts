/**
 * fileIndex.ts — frontend mirror of backend/src/fileIndex.ts.
 *
 * Operates on the project:index Y.Doc. Keep behaviour identical to the backend
 * helpers and cover both with tests including concurrent merges.
 *
 * Validation rules (from ARCHITECTURE.md / file-model SKILL):
 *   - 1–100 chars after trim
 *   - no "/" or "\"
 *   - unique among existing siblings (same parentId level)
 *   - total files < MAX_FILES (50)
 */

import * as Y from "yjs";
import { FILE_INDEX_KEY, MAX_FILES } from "../config.js";
import type { FileEntry } from "./useIndex.js";

/** Regex for valid file ids — must match backend/src/docNames.ts FILE_ID_REGEX. */
export const FILE_ID_REGEX = /^[a-z0-9-]{1,40}$/;

/**
 * Validation errors returned by validateFileName.
 * null means the name is valid.
 */
export type ValidationError =
  | "empty"
  | "too_long"
  | "invalid_chars"
  | "duplicate_name"
  | "max_files"
  | "max_depth";

export const MAX_FOLDER_DEPTH = 5;

/** Calculate depth of a parent folder. Root is depth 0. */
export function getFolderDepth(
  parentId: string | null,
  existingFiles: FileEntry[]
): number {
  let depth = 0;
  let currentId = parentId;
  const fileMap = new Map(existingFiles.map((f) => [f.id, f]));
  while (currentId) {
    depth++;
    const parent = fileMap.get(currentId);
    if (!parent) break;
    currentId = parent.parentId;
    if (depth > 20) break; // cycle guard
  }
  return depth;
}

/**
 * Validate a proposed file/folder name against the current file list.
 * Returns null if valid, or a ValidationError string.
 * excludeId allows renaming without colliding with itself.
 * parentId specifies the target parent directory (for sibling uniqueness and max depth).
 */
export function validateFileName(
  name: string,
  existingFiles: FileEntry[],
  excludeId?: string,
  parentId: string | null = null
): ValidationError | null {
  const trimmed = name.trim();
  if (trimmed.length === 0) return "empty";
  if (trimmed.length > 100) return "too_long";
  if (trimmed.includes("/") || trimmed.includes("\\")) return "invalid_chars";
  if (!excludeId && existingFiles.length >= MAX_FILES) return "max_files";
  if (getFolderDepth(parentId, existingFiles) >= MAX_FOLDER_DEPTH) return "max_depth";

  // Duplicate check: same trimmed name among siblings at the SAME parentId level
  const duplicate = existingFiles.some(
    (f) =>
      f.id !== excludeId &&
      (f.parentId ?? null) === (parentId ?? null) &&
      f.name.trim().toLowerCase() === trimmed.toLowerCase()
  );
  if (duplicate) return "duplicate_name";
  return null;
}

/** Human-readable messages for each validation error. */
export const VALIDATION_MESSAGES: Record<ValidationError, string> = {
  empty: "File name cannot be empty.",
  too_long: "File name must be 100 characters or fewer.",
  invalid_chars: 'File name cannot contain "/" or "\\".',
  duplicate_name: "A file with that name already exists in this folder.",
  max_files: `Cannot create more than ${MAX_FILES} files.`,
  max_depth: `Cannot nest deeper than ${MAX_FOLDER_DEPTH} levels.`,
};

/** Generate a random file id matching FILE_ID_REGEX (browser crypto, no dep). */
function generateId(): string {
  // crypto.randomUUID() is available in all modern browsers and Node ≥ 14.17.
  // UUID format [0-9a-f-] length 36 satisfies FILE_ID_REGEX.
  return crypto.randomUUID();
}

/** Return the Y.Map holding all file entries for this doc. */
function getFilesMap(doc: Y.Doc): Y.Map<Y.Map<unknown>> {
  return doc.getMap(FILE_INDEX_KEY) as Y.Map<Y.Map<unknown>>;
}

/**
 * Create a new file entry in the index Y.Doc.
 * Returns the generated file id.
 * Does NOT validate — callers should call validateFileName first.
 */
export function createFile(
  doc: Y.Doc,
  opts: { name: string; parentId?: string | null }
): string {
  const id = generateId();
  const files = getFilesMap(doc);
  doc.transact(() => {
    const entry = new Y.Map<unknown>();
    entry.set("name", opts.name.trim());
    entry.set("parentId", opts.parentId ?? null);
    entry.set("type", "file");
    files.set(id, entry);
  });
  return id;
}

/**
 * Create a new folder entry in the index Y.Doc.
 * Returns the generated folder id.
 */
export function createFolder(
  doc: Y.Doc,
  opts: { name: string; parentId?: string | null }
): string {
  const id = generateId();
  const files = getFilesMap(doc);
  doc.transact(() => {
    const entry = new Y.Map<unknown>();
    entry.set("name", opts.name.trim());
    entry.set("parentId", opts.parentId ?? null);
    entry.set("type", "folder");
    files.set(id, entry);
  });
  return id;
}

/**
 * Rename a file entry. No-op if the id does not exist.
 */
export function renameFile(doc: Y.Doc, id: string, name: string): void {
  const files = getFilesMap(doc);
  const entry = files.get(id);
  if (!entry) {
    return;
  }
  doc.transact(() => {
    entry.set("name", name.trim());
  });
}

/**
 * Find all descendant IDs of a given folder ID.
 */
export function getDescendantIds(filesMap: Y.Map<Y.Map<unknown>>, parentId: string): string[] {
  const descendants: string[] = [];
  const queue = [parentId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const [id, entry] of filesMap.entries()) {
      if (entry.get("parentId") === current) {
        descendants.push(id);
        queue.push(id);
      }
    }
  }
  return descendants;
}

/**
 * Delete a file entry from the index. If it is a folder, recursively deletes all descendants.
 */
export function deleteFile(doc: Y.Doc, id: string): void {
  const files = getFilesMap(doc);
  if (!files.has(id)) {
    return;
  }
  const toDelete = [id, ...getDescendantIds(files, id)];
  doc.transact(() => {
    for (const fileId of toDelete) {
      files.delete(fileId);
    }
  });
}

/**
 * Return all file entries as a plain array, sorted by name then id.
 * Consistent with backend/src/fileIndex.ts listFiles().
 */
export function listFiles(doc: Y.Doc): FileEntry[] {
  const files = getFilesMap(doc);
  const result: FileEntry[] = [];
  for (const [id, entry] of files.entries()) {
    if (!FILE_ID_REGEX.test(id)) continue;
    result.push({
      id,
      name: String(entry.get("name") ?? ""),
      parentId: (entry.get("parentId") as string | null) ?? null,
      type: (entry.get("type") as "file" | "folder") ?? "file",
    });
  }
  result.sort((a, b) => {
    const nc = a.name.localeCompare(b.name);
    return nc !== 0 ? nc : a.id.localeCompare(b.id);
  });
  return result;
}
