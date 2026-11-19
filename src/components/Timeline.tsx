import type { Booking } from "@/types";
import { MINUTES_PER_DAY, minutesToDisplay } from "@/utils/time";

interface TimelineProps {
  bookings: Booking[];
  candidateStart: number | null;
  candidateEnd: number | null;
  candidateAvailable: boolean;
}

export function Timeline({
  bookings,
  candidateStart,
  candidateEnd,
  candidateAvailable,
}: TimelineProps) {
  const totalMinutes = MINUTES_PER_DAY;
  const hourMarks = Array.from({ length: 25 }, (_, i) => i * 60); // 0, 60, ... 1440

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Today's Schedule</h3>
        <span className="text-xs text-slate-400">00:00 – 24:00</span>
      </div>

      {/* Track */}
      <div className="relative h-14 w-full overflow-hidden rounded-lg bg-slate-50">
        {/* Hour gridlines */}
        {hourMarks.map((m) => (
          <div
            key={m}
            className="absolute top-0 bottom-0 border-l border-slate-200/70"
            style={{ left: `${(m / totalMinutes) * 100}%` }}
          />
        ))}

        {/* Existing bookings */}
        {bookings.map((b) => (
          <div
            key={b.id}
            className="absolute top-1 bottom-1 flex items-center justify-center overflow-hidden rounded bg-slate-300/80 px-1 text-[10px] font-medium text-slate-700"
            style={{
              left: `${(b.start / totalMinutes) * 100}%`,
              width: `${((b.end - b.start) / totalMinutes) * 100}%`,
            }}
            title={`${b.title} — ${minutesToDisplay(b.start)} to ${minutesToDisplay(b.end)}`}
          >
            <span className="truncate">{b.title}</span>
          </div>
        ))}

        {/* Candidate interval */}
        {candidateStart != null && candidateEnd != null && (() => {
          const widthPct = ((candidateEnd - candidateStart) / totalMinutes) * 100;
          const showLabel = widthPct > 5.5; // ~80px on a typical track
          const label = `${minutesToDisplay(candidateStart)}–${minutesToDisplay(candidateEnd)}`;
          return (
            <div
              className={`absolute top-0 bottom-0 flex items-center justify-center overflow-hidden rounded border-2 ${
                candidateAvailable
                  ? "border-emerald-500 bg-emerald-400/30"
                  : "border-rose-500 bg-rose-400/30"
              }`}
              style={{
                left: `${(candidateStart / totalMinutes) * 100}%`,
                width: `${widthPct}%`,
              }}
              title={label}
            >
              {showLabel && (
                <span
                  className={`truncate px-1 text-[10px] font-bold ${
                    candidateAvailable ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {label}
                </span>
              )}
            </div>
          );
        })()}
      </div>

      {/* Time axis labels */}
      <div className="relative mt-1 h-4 w-full">
        {[0, 6, 12, 18, 24].map((h) => (
          <span
            key={h}
            className="absolute -translate-x-1/2 text-[10px] text-slate-400"
            style={{ left: `${(h * 60 / totalMinutes) * 100}%` }}
          >
            {String(h).padStart(2, "0")}:00
          </span>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-slate-300" /> Existing booking
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded border-2 border-emerald-500 bg-emerald-400/30" /> Candidate (available)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded border-2 border-rose-500 bg-rose-400/30" /> Candidate (unavailable)
        </span>
      </div>
    </div>
  );
}
