import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import App from "@/App";

// R3 regression: After a successful availability check (green candidate on
// the timeline), editing a time input should reset the candidate color.
// Previously `result` was not cleared on input change, so the timeline kept
// showing green for an invalid slot.
describe("App — R3: stale timeline candidate color after input change", () => {
  it("candidate resets after editing time to overlap an existing booking", () => {
    const { container } = render(<App />);

    // Room r1 is selected by default; default slot 13:00–14:00 is free.
    fireEvent.click(screen.getByRole("button", { name: /Check Availability/i }));

    // After a successful check the candidate overlay should be green.
    const track = container.querySelector(".relative.h-14");
    expect(track).not.toBeNull();
    const candidateAfterCheck = track!.querySelector(".border-emerald-500");
    expect(candidateAfterCheck).not.toBeNull();

    // Change to 12:00–13:30 (720–810), which overlaps "Physics Lab" (720–780).
    const timeInputs = container.querySelectorAll('input[type="time"]');
    fireEvent.change(timeInputs[0], { target: { value: "12:00" } });
    fireEvent.change(timeInputs[1], { target: { value: "13:30" } });

    // The banner correctly hides because hasChecked is false.
    expect(screen.queryByText(/^Available$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Unavailable$/i)).not.toBeInTheDocument();

    // FIX: The candidate overlay is no longer green because `result` is reset.
    const candidateAfterEdit = track!.querySelector(".border-emerald-500");
    expect(
      candidateAfterEdit,
      "R3 fix: candidate should not stay green after input change to overlapping slot"
    ).toBeNull();
  });
});

// R2 regression: When "Use my device's actual time" is enabled, the displayed
// current time should refresh from the system clock rather than staying frozen
// at the demo value (10:15 AM). This verifies the live-clock interval is
// active and updating state.
describe("App — R2: live clock updates current time display", () => {
  it("shows the demo time (10:15 AM) before toggling live mode", () => {
    render(<App />);
    expect(screen.getByText("10:15 AM")).toBeInTheDocument();
  });

  it("updates the displayed time away from 10:15 AM after enabling live mode", () => {
    render(<App />);
    expect(screen.getByText("10:15 AM")).toBeInTheDocument();

    const checkbox = screen.getByRole("checkbox", {
      name: /Use my device's actual time/i,
    }) as HTMLInputElement;

    act(() => {
      fireEvent.click(checkbox);
    });

    // After enabling live mode, the displayed time should come from the real
    // system clock. It's extremely unlikely the real time is exactly 10:15 AM,
    // so the demo value should disappear.
    expect(screen.queryByText("10:15 AM")).not.toBeInTheDocument();
  });

  it("restores the demo time (10:15 AM) after disabling live mode", () => {
    render(<App />);
    const checkbox = screen.getByRole("checkbox", {
      name: /Use my device's actual time/i,
    }) as HTMLInputElement;

    // Enable live mode
    act(() => {
      fireEvent.click(checkbox);
    });
    expect(screen.queryByText("10:15 AM")).not.toBeInTheDocument();

    // Disable live mode — should revert to demo time
    act(() => {
      fireEvent.click(checkbox);
    });
    expect(screen.getByText("10:15 AM")).toBeInTheDocument();
  });
});
