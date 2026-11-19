import { CheckCircle2, XCircle, Clock, Info } from "lucide-react";
import type { CheckResult } from "@/types";
import { minutesToDisplay, formatDuration } from "@/utils/time";

interface ResultBannerProps {
  result: CheckResult | null;
  candidateStart: number | null;
  candidateEnd: number | null;
}

export function ResultBanner({
  result,
  candidateStart,
  candidateEnd,
}: ResultBannerProps) {
  if (!result) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-500">
        <Info className="h-5 w-5 flex-shrink-0 text-slate-400" />
        <span className="text-sm">
          Select a room and time range, then click "Check Availability" to see the result.
        </span>
      </div>
    );
  }

  const duration =
    candidateStart != null && candidateEnd != null
      ? candidateEnd - candidateStart
      : 0;

  if (result.status === "available") {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <CheckCircle2 className="mt-0.5 h-6 w-6 flex-shrink-0 text-emerald-600" />
        <div>
          <p className="font-semibold text-emerald-800">Available</p>
          <p className="mt-0.5 text-sm text-emerald-700">
            This room is free from {minutesToDisplay(candidateStart!)} to{" "}
            {minutesToDisplay(candidateEnd!)} ({formatDuration(duration)}).
            No existing bookings overlap this interval.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
      <XCircle className="mt-0.5 h-6 w-6 flex-shrink-0 text-rose-600" />
      <div>
        <p className="font-semibold text-rose-800">Unavailable</p>
        <p className="mt-0.5 text-sm text-rose-700">{result.reason}</p>
        {duration > 0 && (
          <p className="mt-1 flex items-center gap-1 text-xs text-rose-500">
            <Clock className="h-3 w-3" />
            Requested: {minutesToDisplay(candidateStart!)} –{" "}
            {minutesToDisplay(candidateEnd!)} ({formatDuration(duration)})
          </p>
        )}
      </div>
    </div>
  );
}
