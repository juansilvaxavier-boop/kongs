import { describe, expect, it } from "vitest";
import { computeElapsedSeconds, formatClock } from "./racha-clock";

describe("computeElapsedSeconds", () => {
  it("returns the accumulated seconds when stopped", () => {
    expect(computeElapsedSeconds("parado", null, 0)).toBe(0);
    expect(computeElapsedSeconds("parado", null, 125)).toBe(125);
  });

  it("returns the accumulated seconds when paused, ignoring startedAt", () => {
    expect(computeElapsedSeconds("pausado", "2026-01-01T00:00:00Z", 90)).toBe(90);
  });

  it("adds elapsed time since startedAt when running", () => {
    const startedAt = "2026-01-01T00:00:00Z";
    const now = new Date("2026-01-01T00:01:30Z");
    expect(computeElapsedSeconds("rodando", startedAt, 60, now)).toBe(150);
  });

  it("never goes negative if now is somehow before startedAt", () => {
    const startedAt = "2026-01-01T00:01:00Z";
    const now = new Date("2026-01-01T00:00:00Z");
    expect(computeElapsedSeconds("rodando", startedAt, 10, now)).toBe(10);
  });

  it("falls back to accumulated seconds if running with no startedAt", () => {
    expect(computeElapsedSeconds("rodando", null, 42)).toBe(42);
  });
});

describe("formatClock", () => {
  it("formats seconds as mm:ss", () => {
    expect(formatClock(0)).toBe("00:00");
    expect(formatClock(65)).toBe("01:05");
    expect(formatClock(3661)).toBe("61:01");
  });

  it("floors fractional seconds and clamps negatives to zero", () => {
    expect(formatClock(59.9)).toBe("00:59");
    expect(formatClock(-5)).toBe("00:00");
  });
});
