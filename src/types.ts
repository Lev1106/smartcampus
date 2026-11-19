export interface Room {
  id: string;
  name: string;
  building: string;
  capacity: number;
  blocked: boolean;
}

export interface Booking {
  id: string;
  roomId: string;
  start: number; // minutes from midnight (0–1440)
  end: number;
  title: string;
  bookedBy: string;
}

export type CheckResult =
  | { status: "available" }
  | { status: "unavailable"; reason: string };

export interface ExplanationRequest {
  roomName: string;
  startMin: number;
  endMin: number;
  result: CheckResult;
}

export type ExplanationState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; text: string }
  | { status: "error"; message: string };
