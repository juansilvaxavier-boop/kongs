import { describe, expect, it } from "vitest";
import { computeDiscipline, computeTopScorers } from "./stats";

const teams = [
  { id: "t1", name: "Leões da Serra" },
  { id: "t2", name: "Furacão FC" },
];

const players = [
  { id: "p1", name: "Diego Farias", team_id: "t1" },
  { id: "p2", name: "Igor Salgado", team_id: "t2" },
  { id: "p3", name: "Bruno Castro", team_id: "t1" },
];

describe("computeTopScorers", () => {
  it("counts goals per player and sorts descending", () => {
    const goals = [
      { player_id: "p2" },
      { player_id: "p1" },
      { player_id: "p1" },
      { player_id: "p1" },
    ];

    const scorers = computeTopScorers(players, goals, teams);

    expect(scorers).toEqual([
      {
        playerId: "p1",
        playerName: "Diego Farias",
        teamName: "Leões da Serra",
        teamCrestUrl: null,
        goals: 3,
      },
      {
        playerId: "p2",
        playerName: "Igor Salgado",
        teamName: "Furacão FC",
        teamCrestUrl: null,
        goals: 1,
      },
    ]);
  });

  it("excludes players with zero goals", () => {
    const scorers = computeTopScorers(players, [{ player_id: "p1" }], teams);
    expect(scorers).toHaveLength(1);
    expect(scorers[0].playerId).toBe("p1");
  });

  it("returns an empty list when there are no goals", () => {
    expect(computeTopScorers(players, [], teams)).toEqual([]);
  });
});

describe("computeDiscipline", () => {
  it("counts yellow and red cards separately, sorted by red then yellow", () => {
    const cards = [
      { player_id: "p1", card_type: "yellow" },
      { player_id: "p1", card_type: "yellow" },
      { player_id: "p2", card_type: "red" },
    ];

    const rows = computeDiscipline(players, cards, teams);

    expect(rows[0]).toEqual({
      playerId: "p2",
      playerName: "Igor Salgado",
      teamName: "Furacão FC",
      teamCrestUrl: null,
      yellow: 0,
      red: 1,
    });
    expect(rows[1]).toEqual({
      playerId: "p1",
      playerName: "Diego Farias",
      teamName: "Leões da Serra",
      teamCrestUrl: null,
      yellow: 2,
      red: 0,
    });
  });
});
