import { describe, it, expect } from "vitest";
import { ConnectionLimiter } from "./connectionLimiter.js";

describe("ConnectionLimiter", () => {
  it("allows up to max users and rejects subsequent additions", () => {
    const limiter = new ConnectionLimiter(2);
    expect(limiter.tryAdd("client-1")).toBe(true);
    expect(limiter.tryAdd("client-2")).toBe(true);
    expect(limiter.count()).toBe(2);
    expect(limiter.isFull()).toBe(true);

    // Third addition should be rejected
    expect(limiter.tryAdd("client-3")).toBe(false);
    expect(limiter.count()).toBe(2);
  });

  it("treats adding an already existing id as idempotent", () => {
    const limiter = new ConnectionLimiter(2);
    expect(limiter.tryAdd("client-1")).toBe(true);
    expect(limiter.tryAdd("client-1")).toBe(true);
    expect(limiter.count()).toBe(1);
  });

  it("frees a slot when remove is called", () => {
    const limiter = new ConnectionLimiter(1);
    expect(limiter.tryAdd("client-1")).toBe(true);
    expect(limiter.tryAdd("client-2")).toBe(false);

    limiter.remove("client-1");
    expect(limiter.count()).toBe(0);

    expect(limiter.tryAdd("client-2")).toBe(true);
    expect(limiter.count()).toBe(1);
  });

  it("handles double remove and unknown id removal safely", () => {
    const limiter = new ConnectionLimiter(2);
    expect(() => limiter.remove("unknown-id")).not.toThrow();

    limiter.tryAdd("client-1");
    expect(limiter.count()).toBe(1);

    limiter.remove("client-1");
    expect(limiter.count()).toBe(0);

    // Duplicate remove
    expect(() => limiter.remove("client-1")).not.toThrow();
    expect(limiter.count()).toBe(0);
  });
});
