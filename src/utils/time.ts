import type { Booking, CheckResult, Room } from "@/types";

/** Length of a full day in minutes (00:00 to 24:00). */
export const MINUTES_PER_DAY = 1440;

/** Longest allowed booking in minutes (AC2). */
export const MAX_BOOKING_MINUTES = 120;

/** "14:30" → 870 */
export function timeStringToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** 870 → "14:30" */
export function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** 870 → "2:30 PM" */
export function minutesToDisplay(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h >= 12 ? "PM" : "AM";
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayH}:${String(m).padStart(2, "0")} ${period}`;
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
}

/**
 * Core availability check implementing AC1–AC5.
 * Does NOT mutate bookings — purely read-only (AC5).
 */
export function checkAvailability(
  room: Room,
  startMin: number,
  endMin: number,
  currentMin: number,
  bookings: Booking[]
): CheckResult {
  // AC1: 0 ≤ start < end ≤ 1440 and start must be after current time
  if (!Number.isFinite(startMin) || !Number.isFinite(endMin)) {
    return { status: "unavailable", reason: "Times must be between 00:00 and 24:00." };
  }
  if (startMin < 0 || endMin > MINUTES_PER_DAY) {
    return { status: "unavailable", reason: "Times must be between 00:00 and 24:00." };
  }
  if (startMin >= endMin) {
    return { status: "unavailable", reason: "Start time must be earlier than end time." };
  }
  if (startMin <= currentMin) {
    return {
      status: "unavailable",
      reason: `Start time must be after the current time (${minutesToDisplay(currentMin)}).`,
    };
  }

  // AC2: reject bookings longer than MAX_BOOKING_MINUTES
  const duration = endMin - startMin;
  if (duration > MAX_BOOKING_MINUTES) {
    return {
      status: "unavailable",
      reason: `Requested duration is ${formatDuration(duration)}. Maximum allowed is 2 hours (${MAX_BOOKING_MINUTES} min).`,
    };
  }

  // AC3: reject if room is blocked
  if (room.blocked) {
    return {
      status: "unavailable",
      reason: "This room is currently blocked and unavailable for booking.",
    };
  }

  // AC4: reject overlapping intervals (touching endpoints are allowed)
  const roomBookings = bookings.filter((b) => b.roomId === room.id);
  const conflict = roomBookings.find(
    (b) => startMin < b.end && endMin > b.start
  );
  if (conflict) {
    return {
      status: "unavailable",
      reason: `Overlaps with "${conflict.title}" (${minutesToDisplay(conflict.start)} – ${minutesToDisplay(conflict.end)}).`,
    };
  }

  // All checks pass
  return { status: "available" };
}
