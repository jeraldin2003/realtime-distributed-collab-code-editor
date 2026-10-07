import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import App from "./App.js";
import { Header } from "./components/Header.js";
import { Sidebar } from "./components/Sidebar.js";
import { FileList } from "./components/FileList.js";
import { NewFileInput } from "./components/NewFileInput.js";
import { FILE_NAME } from "./config.js";
import { getLanguageForFile } from "./languages.js";

// monaco-workers.ts uses Vite-specific ?worker imports that only work in the
// browser build. Mock the entire module so Vitest (jsdom) can skip it.
vi.mock("./monaco-workers.js", () => ({}));

// Mock monaco-editor for unit testing in jsdom environment.
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
    setModelLanguage: vi.fn(),
  },
}));

// Mock y-monaco so MonacoBinding is a no-op in unit tests.
vi.mock("y-monaco", () => {
  class MonacoBinding {
    destroy() {}
  }
  return { MonacoBinding };
});

// Mock @hocuspocus/provider — no real WebSocket opened in tests.
vi.mock("@hocuspocus/provider", () => {
  const WebSocketStatus = {
    Connecting: "connecting",
    Connected: "connected",
    Disconnected: "disconnected",
  };

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
      onStatus?.({ status: WebSocketStatus.Connecting });
    }
    attach() {}
    detach() {}
    destroy() {}
  }

  return { HocuspocusProvider, HocuspocusProviderWebsocket, WebSocketStatus };
});

// Mock yjs — no real CRDT in tests.
vi.mock("yjs", () => {
  class Doc {
    getText() {
      return { toString: () => "" };
    }
    getMap() {
      return {
        entries: () => [],
        observe: vi.fn(),
        unobserve: vi.fn(),
        size: 0,
      };
    }
    // createFile uses doc.transact(); provide a no-op
    transact(fn: () => void) {
      fn();
    }
    destroy() {}
  }
  return { Doc };
});

// ─── languages ────────────────────────────────────────────────────────────────

describe("languages", () => {
  it("returns typescript for .ts files", () => {
    expect(getLanguageForFile("main.ts")).toBe("typescript");
  });
  it("returns typescript for .tsx files", () => {
    expect(getLanguageForFile("App.tsx")).toBe("typescript");
  });
  it("returns javascript for .js files", () => {
    expect(getLanguageForFile("index.js")).toBe("javascript");
  });
  it("returns json for .json files", () => {
    expect(getLanguageForFile("package.json")).toBe("json");
  });
  it("returns markdown for .md files", () => {
    expect(getLanguageForFile("README.md")).toBe("markdown");
  });
  it("returns plaintext for unknown extensions", () => {
    expect(getLanguageForFile("file.xyz")).toBe("plaintext");
  });
  it("returns plaintext for files with no extension", () => {
    expect(getLanguageForFile("Makefile")).toBe("plaintext");
  });
});

// ─── Header ───────────────────────────────────────────────────────────────────

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

// ─── FileList ─────────────────────────────────────────────────────────────────

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

  it("calls onFileClick when a file item is clicked", () => {
    const onFileClick = vi.fn();
    render(
      <FileList
        files={[{ id: "main", name: "main.ts", type: "file", parentId: null }]}
        activeFileId="main"
        onFileClick={onFileClick}
      />
    );
    fireEvent.click(screen.getByTestId("file-item-main"));
    expect(onFileClick).toHaveBeenCalledWith({
      id: "main",
      name: "main.ts",
      type: "file",
      parentId: null,
    });
  });
});

// ─── NewFileInput ─────────────────────────────────────────────────────────────

describe("NewFileInput component", () => {
  const files = [{ id: "main", name: "main.ts", type: "file" as const, parentId: null }];

  it("renders an input field", () => {
    render(
      <NewFileInput
        existingFiles={files}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByTestId("new-file-input")).toBeInTheDocument();
  });

  it("calls onConfirm with trimmed name on Enter", () => {
    const onConfirm = vi.fn();
    render(
      <NewFileInput
        existingFiles={files}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    );
    const input = screen.getByTestId("new-file-input");
    fireEvent.change(input, { target: { value: " utils.ts " } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onConfirm).toHaveBeenCalledWith("utils.ts");
  });

  it("calls onCancel on Escape", () => {
    const onCancel = vi.fn();
    render(
      <NewFileInput
        existingFiles={files}
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );
    fireEvent.keyDown(screen.getByTestId("new-file-input"), { key: "Escape" });
    expect(onCancel).toHaveBeenCalled();
  });

  it("shows error for duplicate name", () => {
    render(
      <NewFileInput
        existingFiles={files}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    const input = screen.getByTestId("new-file-input");
    fireEvent.change(input, { target: { value: "main.ts" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByTestId("new-file-error")).toBeInTheDocument();
  });

  it("shows error for empty name", () => {
    render(
      <NewFileInput
        existingFiles={files}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    const input = screen.getByTestId("new-file-input");
    fireEvent.change(input, { target: { value: "  " } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByTestId("new-file-error")).toBeInTheDocument();
  });

  it("clears error when typing after an error", () => {
    render(
      <NewFileInput
        existingFiles={files}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    const input = screen.getByTestId("new-file-input");
    fireEvent.change(input, { target: { value: "main.ts" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByTestId("new-file-error")).toBeInTheDocument();
    fireEvent.change(input, { target: { value: "other.ts" } });
    expect(screen.queryByTestId("new-file-error")).not.toBeInTheDocument();
  });
});

// ─── Sidebar ──────────────────────────────────────────────────────────────────

describe("Sidebar component", () => {
  it("renders Files header and file list", () => {
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

  it("shows NewFileInput after clicking the new-file button", () => {
    render(
      <Sidebar
        files={[{ id: "main", name: "main.ts", type: "file", parentId: null }]}
        activeFileId="main"
        onCreateFile={vi.fn()}
      />
    );
    expect(screen.queryByTestId("new-file-input")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("new-file-button"));
    expect(screen.getByTestId("new-file-input")).toBeInTheDocument();
  });

  it("calls onCreateFile when a valid name is confirmed", () => {
    const onCreateFile = vi.fn();
    render(
      <Sidebar
        files={[{ id: "main", name: "main.ts", type: "file", parentId: null }]}
        activeFileId="main"
        onCreateFile={onCreateFile}
      />
    );
    fireEvent.click(screen.getByTestId("new-file-button"));
    const input = screen.getByTestId("new-file-input");
    fireEvent.change(input, { target: { value: "utils.ts" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onCreateFile).toHaveBeenCalledWith("utils.ts");
  });
});

// ─── App shell ────────────────────────────────────────────────────────────────

describe("App shell", () => {
  it("renders header and editor container element", () => {
    render(<App />);
    expect(screen.getByText("Collab Editor")).toBeInTheDocument();
    expect(screen.getByTestId("monaco-editor-container")).toBeInTheDocument();
  });

  it("renders the sidebar with new-file button", () => {
    render(<App />);
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("new-file-button")).toBeInTheDocument();
  });
});
