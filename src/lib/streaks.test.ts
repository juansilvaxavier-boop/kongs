import { describe, expect, it } from "vitest";
import { computeStreaks } from "./streaks";

const teams = [
  { id: "a", name: "Time A" },
  { id: "b", name: "Time B" },
];

function game(overrides: Partial<Parameters<typeof computeStreaks>[1][number]>) {
  return {
    team_a_id: "a",
    team_b_id: "b",
    score_a: 0,
    score_b: 0,
    played: true,
    orderKey: "2026-01-01",
    ...overrides,
  };
}

describe("computeStreaks", () => {
  it("counts the current trailing win streak", () => {
    const games = [
      game({ orderKey: "2026-01-01", score_a: 2, score_b: 0 }),
      game({ orderKey: "2026-01-02", score_a: 1, score_b: 0 }),
      game({ orderKey: "2026-01-03", score_a: 3, score_b: 1 }),
    ];
    const [rowA] = computeStreaks(teams, games);
    expect(rowA.winStreak).toBe(3);
  });

  it("resets the win streak after a loss but keeps counting unbeaten separately", () => {
    const games = [
      game({ orderKey: "2026-01-01", score_a: 0, score_b: 2 }),
      game({ orderKey: "2026-01-02", score_a: 0, score_b: 0 }),
      game({ orderKey: "2026-01-03", score_a: 1, score_b: 1 }),
    ];
    const [rowA] = computeStreaks(teams, games);
    expect(rowA.winStreak).toBe(0);
    expect(rowA.unbeatenStreak).toBe(2);
  });

  it("only counts the trailing streak, not the longest one in history", () => {
    const games = [
      game({ orderKey: "2026-01-01", score_a: 3, score_b: 0 }),
      game({ orderKey: "2026-01-02", score_a: 2, score_b: 0 }),
      game({ orderKey: "2026-01-03", score_a: 0, score_b: 1 }),
      game({ orderKey: "2026-01-04", score_a: 1, score_b: 0 }),
    ];
    const [rowA] = computeStreaks(teams, games);
    expect(rowA.winStreak).toBe(1);
  });

  it("counts clean sheets and scoring droughts from the opposing team's perspective", () => {
    const games = [
      game({ orderKey: "2026-01-01", score_a: 2, score_b: 0 }),
      game({ orderKey: "2026-01-02", score_a: 1, score_b: 0 }),
    ];
    const [rowA, rowB] = computeStreaks(teams, games);
    expect(rowA.cleanSheetStreak).toBe(2);
    expect(rowB.scoringDroughtStreak).toBe(2);
  });

  it("ignores games that have not been played yet", () => {
    const games = [
      game({ orderKey: "2026-01-01", score_a: 2, score_b: 0 }),
      game({ orderKey: "2026-01-02", played: false, score_a: null, score_b: null }),
    ];
    const [rowA] = computeStreaks(teams, games);
    expect(rowA.winStreak).toBe(1);
  });
});
