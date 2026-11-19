import { Sparkles, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import type { ExplanationState } from "@/types";

interface ExplanationPanelProps {
  state: ExplanationState;
  onDismiss: () => void;
}

export function ExplanationPanel({ state, onDismiss }: ExplanationPanelProps) {
  if (state.status === "idle") return null;

  return (
    <div
      className="rounded-xl border border-sky-200 bg-sky-50 p-4"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0">
          {state.status === "loading" && (
            <Loader2 className="h-5 w-5 animate-spin text-sky-600" />
          )}
          {state.status === "success" && (
            <CheckCircle2 className="h-5 w-5 text-sky-600" />
          )}
          {state.status === "error" && (
            <AlertCircle className="h-5 w-5 text-amber-600" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-sky-500" />
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
              Explanation
            </p>
          </div>

          {state.status === "loading" && (
            <p className="mt-1 text-sm text-sky-800">
              Generating explanation…
            </p>
          )}

          {state.status === "success" && (
            <p className="mt-1 text-sm leading-relaxed text-sky-900">
              {state.text}
            </p>
          )}

          {state.status === "error" && (
            <p className="mt-1 text-sm leading-relaxed text-amber-800">
              {state.message}
            </p>
          )}
        </div>

        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-xs font-medium text-sky-600 transition-colors hover:text-sky-800"
          aria-label="Dismiss explanation"
        >
          Dismiss
        </button>
      </div>

      {state.status === "success" && (
        <p className="mt-2 border-t border-sky-200 pt-2 text-[11px] text-sky-500">
          The availability result above is always authoritative. This explanation is optional and informational only.
        </p>
      )}
    </div>
  );
}
