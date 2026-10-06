import { describe, it, expect, beforeEach } from "vitest";
import { getOrCreateIdentity, generateIdentity } from "./identity.js";

describe("identity module", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("generates a valid name and color", () => {
    const id = generateIdentity();
    expect(id.name.split(" ")).toHaveLength(2);
    expect(id.color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("persists identity in sessionStorage across calls", () => {
    const first = getOrCreateIdentity();
    const second = getOrCreateIdentity();
    expect(first).toEqual(second);
  });

  it("creates a new identity if sessionStorage was empty", () => {
    const id1 = getOrCreateIdentity();
    expect(id1.name).toBeTruthy();

    sessionStorage.clear();
    // After clear, getOrCreateIdentity generates a new one
    const id2 = getOrCreateIdentity();
    expect(id2.name).toBeTruthy();
  });
});
