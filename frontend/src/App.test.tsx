import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App.js";
import { Header } from "./components/Header.js";
import { Sidebar } from "./components/Sidebar.js";
import { FileList } from "./components/FileList.js";
import { FILE_NAME } from "./config.js";

// monaco-workers.ts uses Vite-specific ?worker imports that only work in the
// browser build. Mock the entire module so Vitest (jsdom) can skip it.
vi.mock("./monaco-workers.js", () => ({}));

// Mock monaco-editor create for unit testing in jsdom environment.
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
// Now includes HocuspocusProviderWebsocket for the shared socket.
vi.mock("@hocuspocus/provider", () => {
  const WebSocketStatus = {
    Connecting: "connecting",
    Connected: "connected",
    Disconnected: "disconnected",
  };

  // Shared mock websocket — just needs to exist as an object reference.
  class HocuspocusProviderWebsocket {
    connect() {}
    disconnect() {}
    destroy() {}
  }

  class HocuspocusProvider {
    awareness = {
      clientID: 1,
      on: vi.fn(),
      off: vi.fn(),
      setLocalStateField: vi.fn(),
      getStates: vi.fn(() =>
        new Map([[1, { user: { name: "Swift Fox", color: "#4caf50" } }]])
      ),
    };

    constructor({
      onStatus,
    }: {
      onStatus?: (d: { status: string }) => void;
      [key: string]: unknown;
    }) {
      // Immediately call onStatus so hooks' state becomes non-null.
      onStatus?.({ status: WebSocketStatus.Connecting });
    }

    destroy() {}
  }

  return { HocuspocusProvider, HocuspocusProviderWebsocket, WebSocketStatus };
});

// Mock yjs so no real CRDT is created.
vi.mock("yjs", () => {
  class Doc {
    getText() {
      return {};
    }
    getMap() {
      // Return a minimal Y.Map-like with empty entries and observe/unobserve.
      return {
        entries: () => [],
        observe: vi.fn(),
        unobserve: vi.fn(),
        size: 0,
      };
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
    expect(screen.getByText("Connected")).toBeInTheDocument();
    expect(screen.getByText("2 online")).toBeInTheDocument();
    expect(screen.getByText("Swift Fox")).toBeInTheDocument();
    expect(screen.getByText("Calm Panda")).toBeInTheDocument();
  });

  it("renders N / MAX online when maxUsers is provided", () => {
    render(
      <Header
        appName="Collab Editor"
        fileName={FILE_NAME}
        status="connected"
        onlineCount={3}
        maxUsers={10}
      />
    );
    expect(screen.getByText("3 / 10 online")).toBeInTheDocument();
  });
});

describe("FileList component", () => {
  it("renders a list of file names", () => {
    render(
      <FileList
        files={[
          { id: "main", name: "main.ts", type: "file", parentId: null },
          { id: "abc", name: "utils.ts", type: "file", parentId: null },
        ]}
        activeFileId="main"
      />
    );
    expect(screen.getByTestId("file-list")).toBeInTheDocument();
    expect(screen.getByText("main.ts")).toBeInTheDocument();
    expect(screen.getByText("utils.ts")).toBeInTheDocument();
  });

  it("shows 'No files' when list is empty", () => {
    render(<FileList files={[]} />);
    expect(screen.getByText("No files")).toBeInTheDocument();
  });

  it("marks the active file item", () => {
    render(
      <FileList
        files={[{ id: "main", name: "main.ts", type: "file", parentId: null }]}
        activeFileId="main"
      />
    );
    expect(screen.getByTestId("file-item-main")).toBeInTheDocument();
  });
});

describe("Sidebar component", () => {
  it("renders the sidebar with Files header and file list", () => {
    render(
      <Sidebar
        files={[{ id: "main", name: "main.ts", type: "file", parentId: null }]}
        activeFileId="main"
      />
    );
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
    expect(screen.getByText("Files")).toBeInTheDocument();
    expect(screen.getByText("main.ts")).toBeInTheDocument();
  });
});

describe("App shell", () => {
  it("renders header and editor container element", () => {
    render(<App />);
    expect(screen.getByText("Collab Editor")).toBeInTheDocument();
    expect(screen.getByTestId("monaco-editor-container")).toBeInTheDocument();
  });

  it("renders the sidebar", () => {
    render(<App />);
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
    expect(screen.getByText("Files")).toBeInTheDocument();
  });
});
