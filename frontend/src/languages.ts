/**
 * languages.ts — maps file extensions to Monaco language identifiers.
 *
 * Monaco language ids verified from monaco-editor/esm/vs/editor/editor.api.d.ts
 * (the `languages.register` calls in the Monaco source use these string ids).
 * Default is "plaintext" which Monaco always supports.
 */

/** Map from lowercase file extension (without dot) to Monaco language id. */
const EXTENSION_LANGUAGE: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  json: "json",
  css: "css",
  html: "html",
  md: "markdown",
};

/**
 * Return the Monaco language id for the given file name.
 * Derives the extension from the last "." segment of the name.
 * Returns "plaintext" if the extension is unknown or absent.
 */
export function getLanguageForFile(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  if (dot === -1) return "plaintext";
  const ext = fileName.slice(dot + 1).toLowerCase();
  return EXTENSION_LANGUAGE[ext] ?? "plaintext";
}
