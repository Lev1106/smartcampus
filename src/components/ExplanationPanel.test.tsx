import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ExplanationPanel } from "@/components/ExplanationPanel";
import type { ExplanationState } from "@/types";

describe("ExplanationPanel — rendering", () => {
  it("renders nothing when idle", () => {
    const { container } = render(
      <ExplanationPanel state={{ status: "idle" }} onDismiss={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows loading text when loading", () => {
    render(
      <ExplanationPanel state={{ status: "loading" } as ExplanationState} onDismiss={() => {}} />
    );
    expect(screen.getByText("Generating explanation…")).toBeInTheDocument();
  });

  it("shows success text when success", () => {
    render(
      <ExplanationPanel
        state={{ status: "success", text: "Room is available for 1 hr." }}
        onDismiss={() => {}}
      />
    );
    expect(screen.getByText("Room is available for 1 hr.")).toBeInTheDocument();
    expect(screen.getByText(/authoritative/i)).toBeInTheDocument();
  });

  it("shows error message when error", () => {
    render(
      <ExplanationPanel
        state={{ status: "error", message: "Service unavailable." }}
        onDismiss={() => {}}
      />
    );
    expect(screen.getByText("Service unavailable.")).toBeInTheDocument();
  });

  it("renders a dismiss button in non-idle states", () => {
    render(
      <ExplanationPanel
        state={{ status: "success", text: "test" }}
        onDismiss={() => {}}
      />
    );
    expect(screen.getByRole("button", { name: /dismiss/i })).toBeInTheDocument();
  });
});
