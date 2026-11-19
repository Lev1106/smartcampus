import { useEffect, useMemo, useRef, useState } from "react";
import {
  DoorClosed,
  Users,
  Ban,
  Building2,
  Clock,
  Search,
  CalendarCheck,
  Sparkles,
} from "lucide-react";
import type { Room, Booking, CheckResult, ExplanationState } from "@/types";
import { createMockExplanationAdapter } from "@/services/explanationAdapter";
import { sampleRooms, sampleBookings } from "@/data/sampleData";
import {
  checkAvailability,
  timeStringToMinutes,
  minutesToDisplay,
} from "@/utils/time";
import { Timeline } from "@/components/Timeline";
import { ResultBanner } from "@/components/ResultBanner";
import { ExplanationPanel } from "@/components/ExplanationPanel";

/** Current time in minutes — fictional "now" set to 10:15 AM for the demo */
const CURRENT_MINUTE = 10 * 60 + 15;

/** Returns the current minute of the day from the system clock */
function getCurrentMinute(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

export default function App() {
  const [rooms] = useState<Room[]>(sampleRooms);
  const [bookings] = useState<Booking[]>(sampleBookings);

  const [selectedRoomId, setSelectedRoomId] = useState<string>("r1");
  const [startTime, setStartTime] = useState<string>("13:00");
  const [endTime, setEndTime] = useState<string>("14:00");
  const [useLiveTime, setUseLiveTime] = useState<boolean>(false);

  const [result, setResult] = useState<CheckResult | null>(null);
  const [hasChecked, setHasChecked] = useState(false);
  const [explanation, setExplanation] = useState<ExplanationState>({ status: "idle" });
  const explanationRequestRef = useRef<number>(0);

  // R2: live clock — when enabled, periodically refresh the displayed current
  // time so it doesn't freeze between re-renders. Interval is cleaned up on
  // unmount or when the toggle is switched off.
  const [liveMinute, setLiveMinute] = useState<number>(getCurrentMinute());
  useEffect(() => {
    if (!useLiveTime) return;
    setLiveMinute(getCurrentMinute());
    const id = setInterval(() => setLiveMinute(getCurrentMinute()), 1000);
    return () => clearInterval(id);
  }, [useLiveTime]);

  const currentMin = useLiveTime ? liveMinute : CURRENT_MINUTE;

  const selectedRoom = useMemo(
    () => rooms.find((r) => r.id === selectedRoomId) ?? rooms[0],
    [rooms, selectedRoomId]
  );

  const roomBookings = useMemo(
    () =>
      bookings
        .filter((b) => b.roomId === selectedRoom.id)
        .sort((a, b) => a.start - b.start),
    [bookings, selectedRoom.id]
  );

  // The candidate interval to preview on the timeline — derived from inputs,
  // kept as raw values so the timeline can show even invalid ones.
  const candidateStart = useMemo(() => {
    const m = timeStringToMinutes(startTime);
    return isNaN(m) ? null : m;
  }, [startTime]);

  const candidateEnd = useMemo(() => {
    const m = timeStringToMinutes(endTime);
    return isNaN(m) ? null : m;
  }, [endTime]);

  const handleCheck = () => {
    if (candidateStart == null || candidateEnd == null) {
      setResult({ status: "unavailable", reason: "Please enter valid start and end times." });
      setHasChecked(true);
      setExplanation({ status: "idle" });
      return;
    }
    const res = checkAvailability(
      selectedRoom,
      candidateStart,
      candidateEnd,
      currentMin,
      bookings
    );
    setResult(res);
    setHasChecked(true);
    setExplanation({ status: "idle" });
  };

  const handleExplain = async () => {
    if (!hasChecked || !result) return;
    if (candidateStart == null || candidateEnd == null) return;

    const requestId = ++explanationRequestRef.current;
    setExplanation({ status: "loading" });

    const adapter = createMockExplanationAdapter();
    const nextState = await adapter.fetchExplanation({
      roomName: selectedRoom.name,
      startMin: candidateStart,
      endMin: candidateEnd,
      result,
    });

    if (explanationRequestRef.current !== requestId) return;
    setExplanation(nextState);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4 sm:px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <CalendarCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 sm:text-xl">
              Smart Campus Room Availability
            </h1>
            <p className="text-xs text-slate-500 sm:text-sm">
              Check whether a room is free for your desired time slot.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
          {/* ── Left: Form card ── */}
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            {/* Current time */}
            <div className="flex items-center justify-between rounded-lg bg-blue-50 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium text-blue-800">
                <Clock className="h-4 w-4" />
                Current time
              </div>
              <span className="text-sm font-bold text-blue-900">
                {minutesToDisplay(currentMin)}
              </span>
            </div>

            {/* Toggle live vs demo time */}
            <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-500">
              <input
                type="checkbox"
                checked={useLiveTime}
                onChange={(e) => setUseLiveTime(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Use my device's actual time
            </label>

            {/* Room selection */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Select Room
              </label>
              <div className="space-y-2">
                {rooms.map((room) => {
                  const isSelected = room.id === selectedRoomId;
                  return (
                    <button
                      key={room.id}
                      onClick={() => {
                        setSelectedRoomId(room.id);
                        setHasChecked(false);
                        setResult(null);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <DoorClosed
                          className={`h-5 w-5 flex-shrink-0 ${
                            isSelected ? "text-blue-600" : "text-slate-400"
                          }`}
                        />
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {room.name}
                          </p>
                          <p className="flex items-center gap-1 text-xs text-slate-500">
                            <Building2 className="h-3 w-3" />
                            {room.building}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-2">
                        <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          <Users className="h-3 w-3" />
                          {room.capacity}
                        </span>
                        {room.blocked && (
                          <span className="flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-600">
                            <Ban className="h-3 w-3" />
                            Blocked
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Start time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    setHasChecked(false);
                    setResult(null);
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  End time
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => {
                    setEndTime(e.target.value);
                    setHasChecked(false);
                    setResult(null);
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Check button */}
            <button
              onClick={handleCheck}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 active:bg-blue-800"
            >
              <Search className="h-4 w-4" />
              Check Availability
            </button>

            {hasChecked && result && (
              <button
                onClick={handleExplain}
                disabled={explanation.status === "loading"}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-medium text-sky-700 transition-colors hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                {explanation.status === "loading" ? "Generating…" : "Explain result"}
              </button>
            )}
          </div>

          {/* ── Right: Results + timeline ── */}
          <div className="space-y-4">
            <ResultBanner
              result={hasChecked ? result : null}
              candidateStart={candidateStart}
              candidateEnd={candidateEnd}
            />

            <Timeline
              bookings={roomBookings}
              candidateStart={candidateStart}
              candidateEnd={candidateEnd}
              candidateAvailable={result?.status === "available"}
            />

            <ExplanationPanel
              state={explanation}
              onDismiss={() => setExplanation({ status: "idle" })}
            />

            {/* Existing bookings for selected room */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-slate-700">
                Existing Bookings — {selectedRoom.name}
                {selectedRoom.blocked && (
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-600">
                    <Ban className="h-3 w-3" /> Blocked
                  </span>
                )}
              </h3>
              {roomBookings.length === 0 ? (
                <p className="text-sm text-slate-400">
                  No bookings for this room today.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {roomBookings.map((b) => (
                      <li
                        key={b.id}
                        className="flex items-center justify-between py-2.5"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            {b.title}
                          </p>
                          <p className="text-xs text-slate-400">by {b.bookedBy}</p>
                        </div>
                        <span className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                          <Clock className="h-3 w-3" />
                          {minutesToDisplay(b.start)} – {minutesToDisplay(b.end)}
                        </span>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="px-1 text-center text-xs text-slate-400">
          Fictional sample data for demonstration. No booking data is modified —
          this tool is read-only.
        </p>
      </main>
    </div>
  );
}
