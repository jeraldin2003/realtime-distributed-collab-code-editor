import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePresence } from "./usePresence.js";

interface MockAwarenessState {
  user?: { name: string; color: string };
  activeFileId?: string | null;
}

class MockAwareness {
  clientID = 100;
  private states = new Map<number, MockAwarenessState>();
  private listeners: Array<() => void> = [];

  getStates() {
    return this.states;
  }

  setStates(states: Map<number, MockAwarenessState>) {
    this.states = states;
    this.notify();
  }

  on(event: string, cb: () => void) {
    if (event === "change") this.listeners.push(cb);
  }

  off(event: string, cb: () => void) {
    if (event === "change") {
      this.listeners = this.listeners.filter((l) => l !== cb);
    }
  }

  notify() {
    for (const listener of this.listeners) {
      listener();
    }
  }
}

describe("usePresence hook", () => {
  let awareness: MockAwareness;

  beforeEach(() => {
    awareness = new MockAwareness();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("handles null or undefined awareness gracefully", () => {
    const { result } = renderHook(() => usePresence(null));
    expect(result.current.users).toEqual([]);
    expect(result.current.onlineCount).toBe(0);
    expect(result.current.fileUsers).toEqual({});
  });

  it("parses user identities and activeFileId correctly", () => {
    const initialStates = new Map<number, MockAwarenessState>([
      [
        1,
        {
          user: { name: "Alice", color: "#ff0000" },
          activeFileId: "file-a",
        },
      ],
      [
        2,
        {
          user: { name: "Bob", color: "#00ff00" },
          activeFileId: "file-b",
        },
      ],
      [
        3,
        {
          user: { name: "Charlie", color: "#0000ff" },
          activeFileId: "file-a",
        },
      ],
    ]);

    awareness.setStates(initialStates);

    const { result } = renderHook(() => usePresence(awareness as unknown as import("y-protocols/awareness").Awareness));

    expect(result.current.users).toHaveLength(3);
    expect(result.current.onlineCount).toBe(3);

    expect(result.current.fileUsers["file-a"]).toHaveLength(2);
    expect(result.current.fileUsers["file-a"].map((u) => u.name)).toEqual(["Alice", "Charlie"]);

    expect(result.current.fileUsers["file-b"]).toHaveLength(1);
    expect(result.current.fileUsers["file-b"][0].name).toBe("Bob");
  });

  it("reacts dynamically to awareness changes", () => {
    const { result } = renderHook(() => usePresence(awareness as unknown as import("y-protocols/awareness").Awareness));
    expect(result.current.users).toHaveLength(0);

    act(() => {
      awareness.setStates(
        new Map([
          [
            1,
            {
              user: { name: "Alice", color: "#ff0000" },
              activeFileId: "file-1",
            },
          ],
        ])
      );
    });

    expect(result.current.users).toHaveLength(1);
    expect(result.current.fileUsers["file-1"]).toHaveLength(1);

    act(() => {
      // User switches file
      awareness.setStates(
        new Map([
          [
            1,
            {
              user: { name: "Alice", color: "#ff0000" },
              activeFileId: "file-2",
            },
          ],
        ])
      );
    });

    expect(result.current.fileUsers["file-1"]).toBeUndefined();
    expect(result.current.fileUsers["file-2"]).toHaveLength(1);

    act(() => {
      // User closes file / departs
      awareness.setStates(new Map());
    });

    expect(result.current.users).toHaveLength(0);
    expect(result.current.fileUsers).toEqual({});
  });
});
