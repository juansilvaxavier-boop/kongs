import { describe, expect, it } from "vitest";
import { computeStandings, computeYellowCardCounts } from "./standings";

const teams = [
  { id: "a", name: "Atlético Vale Verde" },
  { id: "b", name: "Leões da Serra" },
  { id: "c", name: "Furacão FC" },
];

describe("computeStandings", () => {
  it("ranks by points, then goal difference, then goals scored", () => {
    const games = [
      { team_a_id: "a", team_b_id: "b", score_a: 3, score_b: 1, played: true },
      { team_a_id: "a", team_b_id: "c", score_a: 1, score_b: 0, played: true },
      { team_a_id: "b", team_b_id: "c", score_a: 2, score_b: 2, played: true },
    ];

    const standings = computeStandings(teams, games);

    // a: 2V, pts6, sg+3. b and c tie on pts1 (1 loss + 1 draw each), broken
    // by goal difference: c is -1 (2 for, 3 against), b is -2 (3 for, 5 against).
    expect(standings.map((r) => r.teamId)).toEqual(["a", "c", "b"]);
    expect(standings[0]).toMatchObject({ pos: 1, pts: 6, j: 2, v: 2, e: 0, d: 0, gp: 4, gc: 1, sg: 3 });
    expect(standings[1]).toMatchObject({ pos: 2, pts: 1, j: 2, v: 0, e: 1, d: 1, gp: 2, gc: 3, sg: -1 });
    expect(standings[2]).toMatchObject({ pos: 3, pts: 1, j: 2, v: 0, e: 1, d: 1, gp: 3, gc: 5, sg: -2 });
  });

  it("ignores games that are not played or have null scores", () => {
    const games = [
      { team_a_id: "a", team_b_id: "b", score_a: null, score_b: null, played: false },
      { team_a_id: "a", team_b_id: "c", score_a: 2, score_b: 1, played: false },
    ];

    const standings = computeStandings(teams, games);

    expect(standings.every((r) => r.j === 0 && r.pts === 0)).toBe(true);
  });

  it("breaks ties alphabetically by team name when pts/sg/gp all match", () => {
    const tied = [
      { id: "z", name: "Zebra FC" },
      { id: "y", name: "Amistoso EC" },
    ];
    const standings = computeStandings(tied, []);

    expect(standings.map((r) => r.teamName)).toEqual(["Amistoso EC", "Zebra FC"]);
  });

  it("returns zeroed rows for a championship with teams but no games", () => {
    const standings = computeStandings(teams, []);
    expect(standings).toHaveLength(3);
    expect(standings.every((r) => r.pts === 0 && r.sg === 0)).toBe(true);
  });
});

describe("computeYellowCardCounts", () => {
  const players = [
    { id: "p1", team_id: "a" },
    { id: "p2", team_id: "a" },
    { id: "p3", team_id: "b" },
  ];

  it("counts yellow cards per team, ignoring other card types", () => {
    const cardEvents = [
      { card_type: "yellow", game_id: "g1", player_id: "p1" },
      { card_type: "yellow", game_id: "g1", player_id: "p2" },
      { card_type: "red", game_id: "g1", player_id: "p3" },
    ];
    const counts = computeYellowCardCounts(cardEvents, players, new Set(["g1"]));
    expect(counts.get("a")).toBe(2);
    expect(counts.has("b")).toBe(false);
  });

  it("ignores events from games outside the given set", () => {
    const cardEvents = [{ card_type: "yellow", game_id: "g2", player_id: "p1" }];
    const counts = computeYellowCardCounts(cardEvents, players, new Set(["g1"]));
    expect(counts.size).toBe(0);
  });

  it("ignores events for players with no known team", () => {
    const cardEvents = [{ card_type: "yellow", game_id: "g1", player_id: "unknown" }];
    const counts = computeYellowCardCounts(cardEvents, players, new Set(["g1"]));
    expect(counts.size).toBe(0);
  });
});
