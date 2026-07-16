import { describe, expect, it } from "vitest";
import { localInputToIso, naturalCompare } from "./datetime";

describe("localInputToIso", () => {
  it("returns an empty string for empty input", () => {
    expect(localInputToIso("")).toBe("");
  });

  it("returns an empty string for malformed input", () => {
    expect(localInputToIso("not-a-date")).toBe("");
    expect(localInputToIso("2026-07-16")).toBe("");
  });

  it("round-trips to the same local wall-clock components it was given", () => {
    const iso = localInputToIso("2026-07-16T15:30");
    expect(iso).not.toBe("");

    const parsed = new Date(iso);
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(6); // 0-indexed: julho
    expect(parsed.getDate()).toBe(16);
    expect(parsed.getHours()).toBe(15);
    expect(parsed.getMinutes()).toBe(30);
  });
});

describe("naturalCompare", () => {
  it("sorts numeric suffixes numerically, not lexicographically", () => {
    const rounds = ["Rodada 10", "Rodada 2", "Rodada 1"];
    expect([...rounds].sort(naturalCompare)).toEqual([
      "Rodada 1",
      "Rodada 2",
      "Rodada 10",
    ]);
  });

  it("falls back to locale string comparison for non-numeric text", () => {
    expect(naturalCompare("Final", "Semifinal")).toBeLessThan(0);
  });

  it("treats equal strings as equal", () => {
    expect(naturalCompare("Rodada 1", "Rodada 1")).toBe(0);
  });
});
