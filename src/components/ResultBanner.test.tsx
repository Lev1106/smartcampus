import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ResultBanner } from "@/components/ResultBanner";

// AC6: Clear desktop and mobile feedback.
// These tests verify that the banner renders distinguishable,
// readable result messaging for all three states (idle, available,
// unavailable). The component is the same markup shown on desktop
// and mobile — responsive layout is handled by Tailwind classes
// already present in the production code.

describe("ResultBanner — AC6: clear feedback", () => {
  it("shows an idle prompt before any check is performed", () => {
    render(<ResultBanner result={null} candidateStart={null} candidateEnd={null} />);
    expect(screen.getByText(/Check Availability/i)).toBeInTheDocument();
  });

  it("shows a prominent 'Available' message with the time range", () => {
    render(<ResultBanner result={{ status: "available" }} candidateStart={780} candidateEnd={840} />);
    expect(screen.getByText("Available")).toBeInTheDocument();
    expect(screen.getByText(/1:00 PM to 2:00 PM/i)).toBeInTheDocument();
  });

  it("shows a prominent 'Unavailable' message with the reason", () => {
    render(
      <ResultBanner
        result={{ status: "unavailable", reason: "This room is currently blocked and unavailable for booking." }}
        candidateStart={660}
        candidateEnd={720}
      />
    );
    expect(screen.getByText("Unavailable")).toBeInTheDocument();
    expect(screen.getByText(/blocked/i)).toBeInTheDocument();
  });

  it("renders distinct visual containers (not just plain text) so the result is visually obvious", () => {
    const { container } = render(
      <ResultBanner result={{ status: "available" }} candidateStart={780} candidateEnd={840} />
    );
    // The banner wraps content in a styled div with border + background classes
    const banner = container.firstElementChild;
    expect(banner).not.toBeNull();
    expect(banner!.className).toMatch(/border/);
    expect(banner!.className).toMatch(/bg-/);
  });
});
