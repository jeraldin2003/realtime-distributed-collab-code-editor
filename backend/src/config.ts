export const PORT: number = Number(process.env.PORT) || 1234;
export const MAX_USERS: number = Number(process.env.MAX_USERS) || 10;
export const ALLOWED_ORIGIN: string = process.env.ALLOWED_ORIGIN || "http://localhost:5173";

export const DOC_NAME: string = "file:main";
export const FILE_NAME: string = "main.ts";
export const LANGUAGE: string = "typescript";
export const TEXT_KEY: string = "content";

// Phase 2 constants — keep in sync with frontend/src/config.ts
export const INDEX_DOC: string = "project:index";
export const FILE_INDEX_KEY: string = "files";
export const MAX_FILES: number = 50;
export const DEFAULT_FILE_ID: string = "main";
export const DEFAULT_FILE_NAME: string = "main.ts";

export const STARTER: string = `// Welcome to the real-time collaborative code editor!
// Edits made here will sync live across all connected clients.

function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

console.log(greet("World"));
`;

