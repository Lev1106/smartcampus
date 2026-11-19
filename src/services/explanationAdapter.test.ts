import { describe, it, expect } from "vitest";
import { createMockExplanationAdapter } from "@/services/explanationAdapter";
import type { ExplanationRequest } from "@/types";

const validRequest: ExplanationRequest = {
  roomName: "Engineering Hall 101",
  startMin: 780,
  endMin: 840,
  result: { status: "available" },
};

describe("explanationAdapter — input validation", () => {
  it("rejects empty roomName", async () => {
    const adapter = createMockExplanationAdapter({ delayMs: 0 });
    const state = await adapter.fetchExplanation({ ...validRequest, roomName: "" });
    expect(state.status).toBe("error");
    if (state.status === "error") {
      expect(state.message).toContain("roomName");
    }
  });

  it("rejects startMin out of range (negative)", async () => {
    const adapter = createMockExplanationAdapter({ delayMs: 0 });
    const state = await adapter.fetchExplanation({ ...validRequest, startMin: -1 });
    expect(state.status).toBe("error");
    if (state.status === "error") {
      expect(state.message).toContain("startMin");
    }
  });

  it("rejects endMin out of range (> 1440)", async () => {
    const adapter = createMockExplanationAdapter({ delayMs: 0 });
    const state = await adapter.fetchExplanation({ ...validRequest, endMin: 1441 });
    expect(state.status).toBe("error");
    if (state.status === "error") {
      expect(state.message).toContain("endMin");
    }
  });

  it("rejects startMin >= endMin", async () => {
    const adapter = createMockExplanationAdapter({ delayMs: 0 });
    const state = await adapter.fetchExplanation({ ...validRequest, startMin: 800, endMin: 800 });
    expect(state.status).toBe("error");
    if (state.status === "error") {
      expect(state.message).toContain("less than");
    }
  });

  it("rejects unavailable result without reason", async () => {
    const adapter = createMockExplanationAdapter({ delayMs: 0 });
    const state = await adapter.fetchExplanation({
      ...validRequest,
      result: { status: "unavailable", reason: "" },
    });
    expect(state.status).toBe("error");
  });

  it("rejects non-finite startMin (NaN)", async () => {
    const adapter = createMockExplanationAdapter({ delayMs: 0 });
    const state = await adapter.fetchExplanation({ ...validRequest, startMin: NaN });
    expect(state.status).toBe("error");
  });
});

describe("explanationAdapter — successful output", () => {
  it("returns success text for an available result", async () => {
    const adapter = createMockExplanationAdapter({ delayMs: 0 });
    const state = await adapter.fetchExplanation(validRequest);
    expect(state.status).toBe("success");
    if (state.status === "success") {
      expect(state.text).toContain("Engineering Hall 101");
      expect(state.text).toContain("available");
    }
  });

  it("returns success text for an unavailable result with reason", async () => {
    const adapter = createMockExplanationAdapter({ delayMs: 0 });
    const state = await adapter.fetchExplanation({
      ...validRequest,
      result: { status: "unavailable", reason: "Overlaps with Physics Lab." },
    });
    expect(state.status).toBe("success");
    if (state.status === "success") {
      expect(state.text).toContain("unavailable");
      expect(state.text).toContain("Physics Lab");
    }
  });

  it("includes duration in the explanation text", async () => {
    const adapter = createMockExplanationAdapter({ delayMs: 0 });
    const state = await adapter.fetchExplanation(validRequest);
    expect(state.status).toBe("success");
    if (state.status === "success") {
      expect(state.text).toContain("1 hr");
    }
  });
});

describe("explanationAdapter — failure handling", () => {
  it("returns error state when failureRate is 1", async () => {
    const adapter = createMockExplanationAdapter({ delayMs: 0, failureRate: 1 });
    const state = await adapter.fetchExplanation(validRequest);
    expect(state.status).toBe("error");
    if (state.status === "error") {
      expect(state.message).toContain("temporarily unavailable");
    }
  });

  it("error message clarifies the deterministic result is still authoritative", async () => {
    const adapter = createMockExplanationAdapter({ delayMs: 0, failureRate: 1 });
    const state = await adapter.fetchExplanation(validRequest);
    expect(state.status).toBe("error");
    if (state.status === "error") {
      expect(state.message).toContain("authoritative");
    }
  });
});

describe("explanationAdapter — F2: no double period in unavailable text", () => {
  it("does not produce a double period when reason ends with a period", async () => {
    const adapter = createMockExplanationAdapter({ delayMs: 0 });
    const state = await adapter.fetchExplanation({
      ...validRequest,
      result: { status: "unavailable", reason: "This room is currently blocked and unavailable for booking." },
    });
    expect(state.status).toBe("success");
    if (state.status === "success") {
      expect(state.text).not.toContain("..");
    }
  });

  it("produces a single period after the reason for overlap reasons", async () => {
    const adapter = createMockExplanationAdapter({ delayMs: 0 });
    const state = await adapter.fetchExplanation({
      ...validRequest,
      result: { status: "unavailable", reason: 'Overlaps with "Physics Lab" (12:00 PM – 1:00 PM).' },
    });
    expect(state.status).toBe("success");
    if (state.status === "success") {
      expect(state.text).toContain('1:00 PM). The deterministic');
      expect(state.text).not.toContain("..");
    }
  });

  it("handles reasons with multiple trailing periods", async () => {
    const adapter = createMockExplanationAdapter({ delayMs: 0 });
    const state = await adapter.fetchExplanation({
      ...validRequest,
      result: { status: "unavailable", reason: "Blocked.." },
    });
    expect(state.status).toBe("success");
    if (state.status === "success") {
      expect(state.text).toContain("Blocked. The");
      expect(state.text).not.toContain("..");
    }
  });
});
