import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App.js";
import { Header } from "./components/Header.js";
import { FILE_NAME } from "./config.js";

// monaco-workers.ts uses Vite-specific ?worker imports that only work in the
// browser build. Mock the entire module so Vitest (jsdom) can skip it.
vi.mock("./monaco-workers.js", () => ({}));

// Mock monaco-editor create for unit testing in jsdom environment.
// getModel() must return a non-null object so MonacoBinding can attach.
vi.mock("monaco-editor", () => ({
  editor: {
    create: vi.fn(() => ({
      dispose: vi.fn(),
      getModel: vi.fn(() => ({
        id: "mock-model",
        onDidChangeContent: vi.fn(() => ({ dispose: vi.fn() })),
        onWillDispose: vi.fn(() => ({ dispose: vi.fn() })),
        applyEdits: vi.fn(),
        getValue: vi.fn(() => ""),
        setValue: vi.fn(),
      })),
      getValue: vi.fn(() => ""),
      setValue: vi.fn(),
      onDidChangeCursorSelection: vi.fn(() => ({ dispose: vi.fn() })),
    })),
  },
}));

// Mock y-monaco so MonacoBinding is a no-op in unit tests.
vi.mock("y-monaco", () => {
  class MonacoBinding {
    destroy() {}
  }
  return { MonacoBinding };
});

// Mock @hocuspocus/provider so no real WebSocket is opened in tests.
vi.mock("@hocuspocus/provider", () => {
  const WebSocketStatus = {
    Connecting: "connecting",
    Connected: "connected",
    Disconnected: "disconnected",
  };
  class HocuspocusProvider {
    awareness = {
      clientID: 1,
      on: vi.fn(),
      off: vi.fn(),
      setLocalStateField: vi.fn(),
      getStates: vi.fn(() => new Map([[1, { user: { name: "Swift Fox", color: "#4caf50" } }]])),
    };
    constructor({ onStatus }: { onStatus?: (d: { status: string }) => void }) {
      // Immediately call onStatus so useCollab's state becomes non-null.
      onStatus?.({ status: WebSocketStatus.Connecting });
    }
    destroy() {}
  }
  return { HocuspocusProvider, WebSocketStatus };
});

// Mock yjs so no real CRDT is created.
vi.mock("yjs", () => {
  class Doc {
    getText() {
      return {};
    }
    destroy() {}
  }
  return { Doc };
});

describe("Header component", () => {
  it("renders app name, file name, and status text", () => {
    render(
      <Header
        appName="Collab Editor"
        fileName={FILE_NAME}
        status="connected"
        onlineCount={2}
        users={[
          { clientId: 1, name: "Swift Fox", color: "#4caf50" },
          { clientId: 2, name: "Calm Panda", color: "#2196f3" },
        ]}
      />
    );
    expect(screen.getByText("Collab Editor")).toBeInTheDocument();
    expect(screen.getByText(FILE_NAME)).toBeInTheDocument();
    expect(screen.getByText("connected")).toBeInTheDocument();
    expect(screen.getByText("2 online")).toBeInTheDocument();
    expect(screen.getByText("Swift Fox")).toBeInTheDocument();
    expect(screen.getByText("Calm Panda")).toBeInTheDocument();
  });
});

describe("App shell", () => {
  it("renders header and editor container element", () => {
    render(<App />);
    expect(screen.getByText("Collab Editor")).toBeInTheDocument();
    expect(screen.getByText(FILE_NAME)).toBeInTheDocument();
    expect(screen.getByTestId("monaco-editor-container")).toBeInTheDocument();
    expect(screen.getByText("1 online")).toBeInTheDocument();
  });
});

