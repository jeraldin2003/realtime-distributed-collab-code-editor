/**
 * fileIndex.ts — pure helpers operating on the project:index Y.Doc.
 *
 * Shape (from ARCHITECTURE.md):
 *   doc.getMap(FILE_INDEX_KEY)  →  Y.Map<fileId, Y.Map<{name, parentId, type}>>
 *
 * All mutations are wrapped in doc.transact() so they appear as single Yjs ops.
 * No side effects beyond mutating the passed Y.Doc.
 */

import * as Y from "yjs";
import { FILE_INDEX_KEY, DEFAULT_FILE_ID, DEFAULT_FILE_NAME } from "./config.js";
import { FILE_ID_REGEX } from "./docNames.js";

export interface FileEntry {
  id: string;
  name: string;
  parentId: string | null;
  type: "file" | "folder";
}

/**
 * Generate a random file id that matches FILE_ID_REGEX.
 * Uses crypto.randomUUID() (Node built-in, no extra dep) stripped to lowercase hex+hyphens.
 * The UUID format is already [0-9a-f-] and 36 chars, well within the 40-char limit.
 */
function generateId(): string {
  // crypto is a Node built-in available globally in Node 19+ and via import in earlier versions.
  // randomUUID() is available since Node 14.17.
  const uuid = crypto.randomUUID(); // e.g. "110e8400-e29b-41d4-a716-446655440000"
  // UUID chars are [0-9a-f-], length 36 — all valid per FILE_ID_REGEX
  return uuid;
}

/** Return the Y.Map holding all file entries for this doc. */
function getFilesMap(doc: Y.Doc): Y.Map<Y.Map<unknown>> {
  return doc.getMap(FILE_INDEX_KEY) as Y.Map<Y.Map<unknown>>;
}

/**
 * Seed the index with the default project (one file: main → main.ts) if it is empty.
 * Idempotent: does nothing when the map already has entries.
 */
export function ensureDefaultIndex(doc: Y.Doc): void {
  const files = getFilesMap(doc);
  if (files.size > 0) {
    return;
  }
  doc.transact(() => {
    const entry = new Y.Map<unknown>();
    entry.set("name", DEFAULT_FILE_NAME);
    entry.set("parentId", null);
    entry.set("type", "file");
    files.set(DEFAULT_FILE_ID, entry);
  });
}

/**
 * Create a new file entry in the index.
 * Returns the generated file id.
 * Does not create the file:‹id› content doc — that is the server's job.
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
 * Create a new folder entry in the index.
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
 * Delete a file or folder entry from the index.
 * If the entry is a folder, recursively deletes all descendants.
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
 * Return all file entries as a plain array, sorted by name then id for a stable order
 * across clients (see file-model SKILL.md: concurrent creates may produce same name).
 */
export function listFiles(doc: Y.Doc): FileEntry[] {
  const files = getFilesMap(doc);
  const result: FileEntry[] = [];

  for (const [id, entry] of files.entries()) {
    if (!FILE_ID_REGEX.test(id)) {
      // Defensive: skip any entry whose id slipped past validation
      continue;
    }
    result.push({
      id,
      name: String(entry.get("name") ?? ""),
      parentId: (entry.get("parentId") as string | null) ?? null,
      type: (entry.get("type") as "file" | "folder") ?? "file",
    });
  }

  result.sort((a, b) => {
    const nameCmp = a.name.localeCompare(b.name);
    return nameCmp !== 0 ? nameCmp : a.id.localeCompare(b.id);
  });

  return result;
}
