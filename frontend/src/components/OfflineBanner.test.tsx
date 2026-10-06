import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { OfflineBanner } from "./OfflineBanner.js";

describe("OfflineBanner component", () => {
  it("renders offline banner when visible is true", () => {
    render(<OfflineBanner visible={true} />);
    expect(screen.getByTestId("offline-banner")).toBeInTheDocument();
    expect(
      screen.getByText("Offline. Your edits will sync when you reconnect.")
    ).toBeInTheDocument();
  });

  it("does not render when visible is false", () => {
    const { container } = render(<OfflineBanner visible={false} />);
    expect(container).toBeEmptyDOMElement();
  });
});
