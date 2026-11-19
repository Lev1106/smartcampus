import { describe, it, expect } from "vitest";
import { checkAvailability } from "@/utils/time";
import type { Room, Booking } from "@/types";
import { sampleRooms, sampleBookings } from "@/data/sampleData";

// ─── Shared fixtures ─────────────────────────────────────────────

/** Fixed "now" = 10:15 AM → 615 minutes, matching App.tsx */
const CURRENT_MIN = 615;

const openRoom: Room = {
  id: "r1",
  name: "Test Room",
  building: "Building A",
  capacity: 30,
  blocked: false,
};

const blockedRoom: Room = {
  ...openRoom,
  id: "r2",
  name: "Blocked Room",
  blocked: true,
};

const bookings: Booking[] = [
  { id: "b1", roomId: "r1", start: 540, end: 600, title: "Morning Class", bookedBy: "Prof A" },
  { id: "b2", roomId: "r1", start: 720, end: 780, title: "Afternoon Lab", bookedBy: "Prof B" },
  { id: "b3", roomId: "r1", start: 900, end: 960, title: "Office Hours", bookedBy: "Prof A" },
  { id: "b4", roomId: "r9", start: 660, end: 720, title: "Other Room Class", bookedBy: "Prof C" },
];

// Helper: deep-clone bookings to detect mutation
function cloneBookings(arr: Booking[] = bookings): Booking[] {
  return arr.map((b) => ({ ...b }));
}

// ─── AC1: interval validation ────────────────────────────────────

describe("checkAvailability — AC1: interval validation", () => {
  it("accepts a valid interval within bounds and after current time", () => {
    // 11:00–12:00, no conflicts on r1 (b1 ends 600, b2 starts 720)
    const result = checkAvailability(openRoom, 660, 720, CURRENT_MIN, bookings);
    expect(result.status).toBe("available");
  });

  it("rejects when start < 0", () => {
    const result = checkAvailability(openRoom, -30, 60, CURRENT_MIN, bookings);
    expect(result.status).toBe("unavailable");
  });

  it("rejects when end > 1440", () => {
    const result = checkAvailability(openRoom, 1380, 1500, CURRENT_MIN, bookings);
    expect(result.status).toBe("unavailable");
  });

  it("rejects when start === end (zero-length interval)", () => {
    const result = checkAvailability(openRoom, 660, 660, CURRENT_MIN, bookings);
    expect(result.status).toBe("unavailable");
  });

  it("rejects when start > end", () => {
    const result = checkAvailability(openRoom, 780, 720, CURRENT_MIN, bookings);
    expect(result.status).toBe("unavailable");
  });

  it("rejects when start equals current time (not strictly after)", () => {
    const result = checkAvailability(openRoom, 615, 660, CURRENT_MIN, bookings);
    expect(result.status).toBe("unavailable");
  });

  it("rejects when start is before current time", () => {
    const result = checkAvailability(openRoom, 480, 540, CURRENT_MIN, bookings);
    expect(result.status).toBe("unavailable");
  });

  it("accepts boundary: start = 0, end = 1, current = -1", () => {
    const result = checkAvailability(openRoom, 0, 1, -1, []);
    expect(result.status).toBe("available");
  });

  it("accepts boundary: end = 1440 exactly", () => {
    // 23:00–24:00 on r1, no existing booking overlaps
    const result = checkAvailability(openRoom, 1380, 1440, CURRENT_MIN, bookings);
    expect(result.status).toBe("available");
  });
});

// ─── AC2: 120-minute limit ───────────────────────────────────────

describe("checkAvailability — AC2: 120-minute limit", () => {
  it("accepts a booking of exactly 120 minutes", () => {
    // 12:00–14:00 on r1: existing b2 is 720–780, so use a clean 120-min gap.
    // Gap between b3 (900–960) and end of day: 960–1080 = 120 min, no overlap.
    const result = checkAvailability(openRoom, 960, 1080, CURRENT_MIN, bookings);
    expect(result.status).toBe("available");
  });

  it("rejects a booking of 121 minutes", () => {
    // 16:00–18:01 = 121 min, no overlap with existing r1 bookings
    const result = checkAvailability(openRoom, 960, 1081, CURRENT_MIN, bookings);
    expect(result.status).toBe("unavailable");
    if (result.status === "unavailable") {
      expect(result.reason).toContain("2 hr 1 min");
      expect(result.reason).toContain("120 min");
    }
  });

  it("rejects a booking of 180 minutes with duration in reason", () => {
    // 16:00–19:00 = 180 min, no overlap with existing bookings on r1
    const result = checkAvailability(openRoom, 960, 1140, CURRENT_MIN, bookings);
    expect(result.status).toBe("unavailable");
    if (result.status === "unavailable") {
      expect(result.reason).toContain("3 hr");
    }
  });

  it("rejects a booking of 180 minutes (3 hours)", () => {
    const result = checkAvailability(openRoom, 960, 1140, CURRENT_MIN, bookings);
    expect(result.status).toBe("unavailable");
  });
});

// ─── AC3: blocked rooms ──────────────────────────────────────────

describe("checkAvailability — AC3: blocked rooms", () => {
  it("rejects when the room is blocked even with a valid interval", () => {
    const result = checkAvailability(blockedRoom, 660, 720, CURRENT_MIN, []);
    expect(result.status).toBe("unavailable");
    if (result.status === "unavailable") {
      expect(result.reason).toContain("blocked");
    }
  });
});

// ─── AC4: overlap detection ──────────────────────────────────────

describe("checkAvailability — AC4: overlap detection", () => {
  it("rejects when candidate fully inside an existing booking", () => {
    // Existing: 720–780, candidate: 730–760
    const result = checkAvailability(openRoom, 730, 760, CURRENT_MIN, bookings);
    expect(result.status).toBe("unavailable");
  });

  it("rejects when candidate partially overlaps start of an existing booking", () => {
    // Existing: 720–780, candidate: 700–740
    const result = checkAvailability(openRoom, 700, 740, CURRENT_MIN, bookings);
    expect(result.status).toBe("unavailable");
  });

  it("rejects when candidate partially overlaps end of an existing booking", () => {
    // Existing: 720–780, candidate: 760–800
    const result = checkAvailability(openRoom, 760, 800, CURRENT_MIN, bookings);
    expect(result.status).toBe("unavailable");
  });

  it("rejects when candidate fully encloses an existing booking", () => {
    // Use currentMin=500 so start (550) is after current.
    // Existing 540–600, candidate 550–650 overlaps b1.
    const result = checkAvailability(openRoom, 550, 650, 500, bookings);
    expect(result.status).toBe("unavailable");
  });

  it("allows touching endpoints: candidate ends where a booking starts", () => {
    // Existing: 720–780, candidate: 660–720 (touching at 720)
    const result = checkAvailability(openRoom, 660, 720, CURRENT_MIN, bookings);
    expect(result.status).toBe("available");
  });

  it("allows touching endpoints: candidate starts where a booking ends", () => {
    // Existing: 720–780, candidate: 780–840
    const result = checkAvailability(openRoom, 780, 840, CURRENT_MIN, bookings);
    expect(result.status).toBe("available");
  });

  it("ignores bookings in other rooms", () => {
    // r9 has a booking 660–720; checking r1 at 660–720 should be available
    const result = checkAvailability(openRoom, 660, 720, CURRENT_MIN, [
      { id: "b4", roomId: "r9", start: 660, end: 720, title: "Other", bookedBy: "X" },
    ]);
    expect(result.status).toBe("available");
  });
});

// ─── AC5: bookings data unchanged ────────────────────────────────

describe("checkAvailability — AC5: bookings data unchanged", () => {
  it("does not mutate the bookings array (shallow)", () => {
    const before = cloneBookings();
    checkAvailability(openRoom, 660, 720, CURRENT_MIN, bookings);
    expect(bookings).toHaveLength(before.length);
    expect(bookings).toEqual(before);
  });

  it("does not mutate individual booking objects", () => {
    const before = cloneBookings();
    checkAvailability(openRoom, 730, 760, CURRENT_MIN, bookings);
    bookings.forEach((b, i) => {
      expect(b).toEqual(before[i]);
    });
  });

  it("returns the correct result while keeping data intact", () => {
    const before = cloneBookings();
    const result = checkAvailability(openRoom, 660, 720, CURRENT_MIN, bookings);
    expect(result.status).toBe("available");
    expect(bookings).toEqual(before);
  });

  it("does not mutate sample data when checked against it", () => {
    const before = cloneBookings(sampleBookings);
    checkAvailability(sampleRooms[0], 660, 720, CURRENT_MIN, sampleBookings);
    expect(sampleBookings).toEqual(before);
  });

  it("does not reorder an intentionally unsorted bookings array", () => {
    // Deliberately out-of-order so an in-place sort would be observable
    const unsorted: Booking[] = [
      { id: "b3", roomId: "r1", start: 900, end: 960, title: "Office Hours", bookedBy: "Prof A" },
      { id: "b1", roomId: "r1", start: 540, end: 600, title: "Morning Class", bookedBy: "Prof A" },
      { id: "b2", roomId: "r1", start: 720, end: 780, title: "Afternoon Lab", bookedBy: "Prof B" },
    ];
    const before = unsorted.map((b) => ({ ...b }));
    checkAvailability(openRoom, 660, 720, CURRENT_MIN, unsorted);
    expect(unsorted).toEqual(before);
  });
});

// ─── Sample-data integration tests ───────────────────────────────

describe("checkAvailability — integration with sample data at 10:15", () => {
  const r1 = sampleRooms[0]; // Engineering Hall 101 — not blocked
  const r4 = sampleRooms[3]; // Business Center 305 — blocked

  it("rejects a past time on r1", () => {
    // 9:00–9:30 is before 10:15
    const result = checkAvailability(r1, 540, 570, CURRENT_MIN, sampleBookings);
    expect(result.status).toBe("unavailable");
  });

  it("rejects overlapping with Calculus II (540–600) if current time were earlier", () => {
    // current=500 so start 540 passes AC1; 540–560 overlaps b1 (540–600)
    const result = checkAvailability(r1, 540, 560, 500, sampleBookings);
    expect(result.status).toBe("unavailable");
    if (result.status === "unavailable") {
      expect(result.reason).toContain("Calculus II");
    }
  });

  it("accepts a valid slot on r1 between Physics Lab and Office Hours", () => {
    // Physics Lab 720–780, Office Hours 900–960.
    // 780–840 touches end of Physics Lab, no overlap.
    const result = checkAvailability(r1, 780, 840, CURRENT_MIN, sampleBookings);
    expect(result.status).toBe("available");
  });

  it("rejects blocked room r4 regardless of valid slot", () => {
    const result = checkAvailability(r4, 660, 720, CURRENT_MIN, sampleBookings);
    expect(result.status).toBe("unavailable");
    if (result.status === "unavailable") {
      expect(result.reason).toContain("blocked");
    }
  });

  it("rejects a 3-hour request on r1", () => {
    // 16:00–19:00 = 180 min, no overlap with existing r1 bookings
    const result = checkAvailability(r1, 960, 1140, CURRENT_MIN, sampleBookings);
    expect(result.status).toBe("unavailable");
    if (result.status === "unavailable") {
      expect(result.reason).toContain("3 hr");
    }
  });

  it("sample bookings remain unmodified after multiple checks", () => {
    const before = cloneBookings(sampleBookings);
    checkAvailability(r1, 780, 840, CURRENT_MIN, sampleBookings);
    checkAvailability(r4, 660, 720, CURRENT_MIN, sampleBookings);
    checkAvailability(r1, 720, 900, CURRENT_MIN, sampleBookings);
    expect(sampleBookings).toEqual(before);
  });
});

// ─── Regression: exact reasons per AC and fixture values ──────────

describe("checkAvailability — regression: exact reasons per AC", () => {
  it("AC1 past time: explains the start must be after the current time", () => {
    const result = checkAvailability(openRoom, 540, 600, CURRENT_MIN, bookings);
    expect(result).toEqual({
      status: "unavailable",
      reason: "Start time must be after the current time (10:15 AM).",
    });
  });

  it("AC1 reversed interval: explains the start must be earlier than the end", () => {
    const result = checkAvailability(openRoom, 780, 720, CURRENT_MIN, bookings);
    expect(result).toEqual({
      status: "unavailable",
      reason: "Start time must be earlier than end time.",
    });
  });

  it("AC2 121 minutes: states the duration and the 120-minute maximum", () => {
    const result = checkAvailability(openRoom, 960, 1081, CURRENT_MIN, bookings);
    expect(result).toEqual({
      status: "unavailable",
      reason: "Requested duration is 2 hr 1 min. Maximum allowed is 2 hours (120 min).",
    });
  });

  it("AC3 blocked room: explains the room is blocked", () => {
    const result = checkAvailability(blockedRoom, 660, 720, CURRENT_MIN, []);
    expect(result).toEqual({
      status: "unavailable",
      reason: "This room is currently blocked and unavailable for booking.",
    });
  });

  it("AC4 overlap: names the conflicting booking and its times", () => {
    const result = checkAvailability(openRoom, 730, 760, CURRENT_MIN, bookings);
    expect(result).toEqual({
      status: "unavailable",
      reason: 'Overlaps with "Afternoon Lab" (12:00 PM – 1:00 PM).',
    });
  });

  it("AC4 touching endpoints: a booking ending exactly at start is available", () => {
    const result = checkAvailability(openRoom, 780, 840, CURRENT_MIN, bookings);
    expect(result).toEqual({ status: "available" });
  });
});

// ─── Regression: NaN / non-finite time values (F1) ───────────────

describe("checkAvailability — rejects non-finite time values (F1)", () => {
  it("rejects NaN as startMin", () => {
    const result = checkAvailability(openRoom, NaN, 720, CURRENT_MIN, bookings);
    expect(result.status).toBe("unavailable");
    if (result.status === "unavailable") {
      expect(result.reason).toBe("Times must be between 00:00 and 24:00.");
    }
  });

  it("rejects NaN as endMin", () => {
    const result = checkAvailability(openRoom, 660, NaN, CURRENT_MIN, bookings);
    expect(result.status).toBe("unavailable");
  });

  it("rejects Infinity as startMin", () => {
    const result = checkAvailability(openRoom, Infinity, 720, CURRENT_MIN, bookings);
    expect(result.status).toBe("unavailable");
  });

  it("rejects -Infinity as endMin", () => {
    const result = checkAvailability(openRoom, 660, -Infinity, CURRENT_MIN, bookings);
    expect(result.status).toBe("unavailable");
  });

  it("rejects NaN for both startMin and endMin", () => {
    const result = checkAvailability(openRoom, NaN, NaN, CURRENT_MIN, bookings);
    expect(result.status).toBe("unavailable");
  });
});

describe("sample fixtures — regression: documented values unchanged", () => {
  it("keeps the five rooms with Business Center 305 blocked", () => {
    expect(sampleRooms.map((r) => [r.id, r.blocked])).toEqual([
      ["r1", false],
      ["r2", false],
      ["r3", false],
      ["r4", true],
      ["r5", false],
    ]);
  });

  it("keeps the nine bookings with their original times", () => {
    expect(sampleBookings).toHaveLength(9);
    expect(sampleBookings[0]).toEqual({
      id: "b1",
      roomId: "r1",
      start: 540,
      end: 600,
      title: "Calculus II",
      bookedBy: "Prof. Chen",
    });
    expect(sampleBookings[8]).toEqual({
      id: "b9",
      roomId: "r5",
      start: 960,
      end: 1020,
      title: "Sculpture Workshop",
      bookedBy: "Prof. Okafor",
    });
  });
});
