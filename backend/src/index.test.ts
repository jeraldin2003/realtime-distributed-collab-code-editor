import { describe, it, expect } from "vitest";
import { PORT, MAX_USERS } from "./config.js";

describe("backend config", () => {
  it("exports default PORT and MAX_USERS", () => {
    expect(PORT).toBe(1234);
    expect(MAX_USERS).toBe(10);
  });
});
