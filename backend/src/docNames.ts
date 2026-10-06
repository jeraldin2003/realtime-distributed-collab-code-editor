/**
 * docNames.ts — canonical document name helpers.
 *
 * Allowed doc names (from ARCHITECTURE.md):
 *   "project:index"      — the file index for the project
 *   "file:<id>"          — content doc for a single file; <id> must match FILE_ID_REGEX
 *
 * Everything else is rejected by the server.
 */

/** Regex for a valid file id: lowercase alphanumeric + hyphen, 1–40 chars. */
export const FILE_ID_REGEX = /^[a-z0-9-]{1,40}$/;

/** The one shared index document name. */
export const INDEX_DOC = "project:index";

/** Build the document name for a given file id. */
export function fileDocName(id: string): string {
  return `file:${id}`;
}

export type ParsedDocName =
  | { kind: "index" }
  | { kind: "file"; id: string };

/**
 * Parse a Hocuspocus document name into a typed result.
 * Returns null if the name is not a recognised format.
 */
export function parseDocName(name: string): ParsedDocName | null {
  if (name === INDEX_DOC) {
    return { kind: "index" };
  }

  if (name.startsWith("file:")) {
    const id = name.slice("file:".length);
    if (FILE_ID_REGEX.test(id)) {
      return { kind: "file", id };
    }
    // id failed regex (e.g. "file:../x", "file:UPPER", empty id)
    return null;
  }

  return null;
}
