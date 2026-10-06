// keep in sync with backend/src/config.ts
export const FILE_NAME = "main.ts";
export const LANGUAGE = "typescript";
export const DOC_NAME = "file:main";
export const INDEX_DOC = "project:index";
export const WS_URL: string =
  import.meta.env["VITE_WS_URL"] ?? "ws://localhost:1234";
export const HTTP_URL: string =
  import.meta.env["VITE_HTTP_URL"] ?? "http://localhost:1234";

