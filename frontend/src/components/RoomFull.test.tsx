import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RoomFull } from "./RoomFull.js";

describe("RoomFull component", () => {
  it("renders Room is full message and calls onRetry when button is clicked", () => {
    const handleRetry = vi.fn();
    render(<RoomFull onRetry={handleRetry} />);

    expect(screen.getByText("Room is full")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });
});
