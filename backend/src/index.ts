import { createServer } from "./server.js";
import { PORT } from "./config.js";

async function main() {
  const { port } = await createServer({ port: PORT, quiet: false });
  console.log(`backend up on port ${port}`);
}

main().catch((err) => {
  console.error("Failed to start backend server:", err);
  process.exit(1);
});
