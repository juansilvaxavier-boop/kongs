import { describe, expect, it } from "vitest";
import { computeOvrEvolution } from "./ovr-evolution";

describe("computeOvrEvolution", () => {
  it("returns an empty array when there is no history", () => {
    expect(computeOvrEvolution([], 70)).toEqual([]);
  });

  it("computes a baseline point plus one point per round", () => {
    const history = [
      { round: "Rodada 1", delta: 1.5, created_at: "2026-01-01T00:00:00Z" },
      { round: "Rodada 2", delta: -0.5, created_at: "2026-01-08T00:00:00Z" },
    ];
    const points = computeOvrEvolution(history, 71);
    expect(points).toEqual([
      { label: "Início", ovr: 70 },
      { label: "Rodada 1", ovr: 71.5 },
      { label: "Rodada 2", ovr: 71 },
    ]);
  });

  it("sorts history chronologically regardless of input order", () => {
    const history = [
      { round: "Rodada 2", delta: 1, created_at: "2026-01-08T00:00:00Z" },
      { round: "Rodada 1", delta: 2, created_at: "2026-01-01T00:00:00Z" },
    ];
    const points = computeOvrEvolution(history, 73);
    expect(points.map((p) => p.label)).toEqual(["Início", "Rodada 1", "Rodada 2"]);
    expect(points[1].ovr).toBe(72);
    expect(points[2].ovr).toBe(73);
  });

  it("merges multiple deltas within the same round into a single point", () => {
    const history = [
      { round: "Rodada 1", delta: 1, created_at: "2026-01-01T00:00:00Z" },
      { round: "Rodada 1", delta: 0.5, created_at: "2026-01-01T01:00:00Z" },
    ];
    const points = computeOvrEvolution(history, 71.5);
    expect(points).toEqual([
      { label: "Início", ovr: 70 },
      { label: "Rodada 1", ovr: 71.5 },
    ]);
  });

  it("falls back to a placeholder label when round is null", () => {
    const history = [{ round: null, delta: 1, created_at: "2026-01-01T00:00:00Z" }];
    const points = computeOvrEvolution(history, 71);
    expect(points[1].label).toBe("—");
  });
});
