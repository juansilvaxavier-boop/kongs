import { describe, expect, it } from "vitest";
import { computeStandingsByRound } from "./round-standings";

const teams = [
  { id: "t1", name: "Alpha" },
  { id: "t2", name: "Beta" },
  { id: "t3", name: "Gamma" },
];

describe("computeStandingsByRound", () => {
  it("returns no snapshots when nothing has been played", () => {
    const games = [
      { team_a_id: "t1", team_b_id: "t2", score_a: null, score_b: null, played: false, round: "Rodada 1" },
    ];
    expect(computeStandingsByRound(teams, games)).toEqual([]);
  });

  it("accumulates standings round after round in natural round order", () => {
    const games = [
      { team_a_id: "t1", team_b_id: "t2", score_a: 2, score_b: 0, played: true, round: "Rodada 1" },
      { team_a_id: "t2", team_b_id: "t3", score_a: 1, score_b: 1, played: true, round: "Rodada 2" },
      { team_a_id: "t1", team_b_id: "t3", score_a: 0, score_b: 3, played: true, round: "Rodada 10" },
    ];

    const snapshots = computeStandingsByRound(teams, games);
    expect(snapshots.map((s) => s.round)).toEqual(["Rodada 1", "Rodada 2", "Rodada 10"]);

    // After round 1: t1 has 3 pts (1st, 2-0 win); t3 hasn't played (0 pts, sg 0)
    // ranks above t2, who lost 0-2 (0 pts, sg -2)
    expect(snapshots[0].positionByTeamId).toEqual({ t1: 1, t3: 2, t2: 3 });

    // After round 2: t1 still 3 pts (1st); t2 and t3 have 1 pt each from the draw (t3 ahead alphabetically... actually t2 < t3)
    expect(snapshots[1].positionByTeamId.t1).toBe(1);

    // After round 10: t3 now has 3 (win) + 1 (draw) = 4 pts -> should be 1st
    expect(snapshots[2].positionByTeamId.t3).toBe(1);
  });

  it("skips rounds where nothing was played yet even if a later round has games", () => {
    const games = [
      { team_a_id: "t1", team_b_id: "t2", score_a: null, score_b: null, played: false, round: "Rodada 1" },
      { team_a_id: "t1", team_b_id: "t3", score_a: 1, score_b: 0, played: true, round: "Rodada 2" },
    ];
    const snapshots = computeStandingsByRound(teams, games);
    expect(snapshots.map((s) => s.round)).toEqual(["Rodada 2"]);
  });
});
