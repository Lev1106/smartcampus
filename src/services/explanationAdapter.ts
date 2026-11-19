import type { ExplanationRequest, ExplanationState } from "@/types";

const MIN_MINUTE = 0;
const MAX_MINUTE = 1440;

function validateRequest(req: ExplanationRequest): string | null {
  if (typeof req.roomName !== "string" || req.roomName.trim().length === 0) {
    return "roomName must be a non-empty string";
  }
  if (
    typeof req.startMin !== "number" ||
    !Number.isFinite(req.startMin) ||
    req.startMin < MIN_MINUTE ||
    req.startMin > MAX_MINUTE
  ) {
    return "startMin must be a finite number between 0 and 1440";
  }
  if (
    typeof req.endMin !== "number" ||
    !Number.isFinite(req.endMin) ||
    req.endMin < MIN_MINUTE ||
    req.endMin > MAX_MINUTE
  ) {
    return "endMin must be a finite number between 0 and 1440";
  }
  if (req.startMin >= req.endMin) {
    return "startMin must be less than endMin";
  }
  if (req.result == null || (req.result.status !== "available" && req.result.status !== "unavailable")) {
    return "result must be a valid CheckResult";
  }
  if (req.result.status === "unavailable" && (typeof req.result.reason !== "string" || req.result.reason.length === 0)) {
    return "unavailable result must include a non-empty reason";
  }
  return null;
}

function buildText(req: ExplanationRequest): string {
  const duration = req.endMin - req.startMin;
  const hours = Math.floor(duration / 60);
  const mins = duration % 60;
  const durStr = hours === 0 ? `${mins} min` : mins === 0 ? `${hours} hr` : `${hours} hr ${mins} min`;

  if (req.result.status === "available") {
    return `${req.roomName} is available for your requested ${durStr} slot. There are no overlapping bookings and all booking rules are satisfied.`;
  }

  const reason = req.result.reason.replace(/\.+$/, "");
  return `${req.roomName} is unavailable: ${reason}. The deterministic checker evaluates time bounds, room status, duration limits, and booking overlaps — this explanation is informational only.`;
}

export interface ExplanationAdapter {
  fetchExplanation(req: ExplanationRequest): Promise<ExplanationState>;
}

export function createMockExplanationAdapter(
  opts: { delayMs?: number; failureRate?: number } = {}
): ExplanationAdapter {
  const delayMs = opts.delayMs ?? 600;
  const failureRate = opts.failureRate ?? 0;

  return {
    async fetchExplanation(req: ExplanationRequest): Promise<ExplanationState> {
      const validationError = validateRequest(req);
      if (validationError) {
        return { status: "error", message: validationError };
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));

      if (failureRate > 0 && Math.random() < failureRate) {
        return {
          status: "error",
          message: "The explanation service is temporarily unavailable. The availability result above is still authoritative.",
        };
      }

      return { status: "success", text: buildText(req) };
    },
  };
}
