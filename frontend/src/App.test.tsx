import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App.js";
import { Header } from "./components/Header.js";
import { FILE_NAME } from "./config.js";

// monaco-workers.ts uses Vite-specific ?worker imports that only work in the
// browser build. Mock the entire module so Vitest (jsdom) can skip it.
vi.mock("./monaco-workers.js", () => ({}));

// Mock monaco-editor create for unit testing in jsdom environment
vi.mock("monaco-editor", () => ({
  editor: {
    create: vi.fn(() => ({
      dispose: vi.fn(),
      getModel: vi.fn(),
      getValue: vi.fn(() => ""),
      setValue: vi.fn(),
    })),
  },
}));

describe("Header component", () => {
  it("renders app name, file name, and status text", () => {
    render(<Header appName="Collab Editor" fileName={FILE_NAME} statusText="Local Mode" />);
    expect(screen.getByText("Collab Editor")).toBeInTheDocument();
    expect(screen.getByText(FILE_NAME)).toBeInTheDocument();
    expect(screen.getByText("Local Mode")).toBeInTheDocument();
  });
});

describe("App shell", () => {
  it("renders header and editor container element", () => {
    render(<App />);
    expect(screen.getByText("Collab Editor")).toBeInTheDocument();
    expect(screen.getByText(FILE_NAME)).toBeInTheDocument();
    expect(screen.getByTestId("monaco-editor-container")).toBeInTheDocument();
  });
});
