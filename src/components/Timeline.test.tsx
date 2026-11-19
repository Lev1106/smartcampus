import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Timeline } from "@/components/Timeline";
import type { Booking } from "@/types";

// AC6: Clear desktop and mobile feedback.
// The timeline gives a visual representation of the day's bookings
// and the candidate slot. These tests verify the legend and labels
// render so users on any viewport size can interpret the schedule.

const bookings: Booking[] = [
  { id: "b1", roomId: "r1", start: 540, end: 600, title: "Calculus II", bookedBy: "Prof. Chen" },
  { id: "b2", roomId: "r1", start: 720, end: 780, title: "Physics Lab", bookedBy: "Prof. Rao" },
];

describe("Timeline — AC6: visual schedule feedback", () => {
  it("renders the schedule heading", () => {
    render(<Timeline bookings={bookings} candidateStart={null} candidateEnd={null} candidateAvailable={false} />);
    expect(screen.getByText("Today's Schedule")).toBeInTheDocument();
  });

  it("renders hour axis labels visible on all viewport sizes", () => {
    render(<Timeline bookings={bookings} candidateStart={null} candidateEnd={null} candidateAvailable={false} />);
    expect(screen.getByText("00:00")).toBeInTheDocument();
    expect(screen.getByText("24:00")).toBeInTheDocument();
  });

  it("renders the legend explaining booking vs candidate colors", () => {
    render(<Timeline bookings={bookings} candidateStart={null} candidateEnd={null} candidateAvailable={false} />);
    expect(screen.getByText(/Existing booking/i)).toBeInTheDocument();
    expect(screen.getByText(/Candidate \(available\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Candidate \(unavailable\)/i)).toBeInTheDocument();
  });

  it("renders existing booking titles on the track", () => {
    render(<Timeline bookings={bookings} candidateStart={null} candidateEnd={null} candidateAvailable={false} />);
    expect(screen.getByText("Calculus II")).toBeInTheDocument();
    expect(screen.getByText("Physics Lab")).toBeInTheDocument();
  });
});
