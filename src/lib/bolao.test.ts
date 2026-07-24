import { describe, expect, it } from "vitest";
import {
  computeBolaoPredictionTier,
  computeBolaoStandings,
  computeChampionPredictionPoints,
  computeGroupPredictionPoints,
  computeTopscorerPredictionPoints,
} from "./bolao";

describe("computeBolaoStandings", () => {
  it("awards 3 points for an exact score prediction", () => {
    const rows = computeBolaoStandings(
      [{ userId: "u1", gameId: "g1", predictedScoreA: 2, predictedScoreB: 1 }],
      [{ id: "g1", scoreA: 2, scoreB: 1 }]
    );
    expect(rows).toEqual([{ userId: "u1", points: 3, exactCount: 1, correctCount: 0 }]);
  });

  it("awards 1 point for a correct winner without the exact score", () => {
    const rows = computeBolaoStandings(
      [{ userId: "u1", gameId: "g1", predictedScoreA: 3, predictedScoreB: 1 }],
      [{ id: "g1", scoreA: 2, scoreB: 0 }]
    );
    expect(rows).toEqual([{ userId: "u1", points: 1, exactCount: 0, correctCount: 1 }]);
  });

  it("awards 1 point for a correctly predicted draw without the exact score", () => {
    const rows = computeBolaoStandings(
      [{ userId: "u1", gameId: "g1", predictedScoreA: 0, predictedScoreB: 0 }],
      [{ id: "g1", scoreA: 2, scoreB: 2 }]
    );
    expect(rows).toEqual([{ userId: "u1", points: 1, exactCount: 0, correctCount: 1 }]);
  });

  it("awards 0 points for a wrong outcome", () => {
    const rows = computeBolaoStandings(
      [{ userId: "u1", gameId: "g1", predictedScoreA: 1, predictedScoreB: 0 }],
      [{ id: "g1", scoreA: 0, scoreB: 1 }]
    );
    expect(rows).toEqual([{ userId: "u1", points: 0, exactCount: 0, correctCount: 0 }]);
  });

  it("ignores predictions for games that are not in the played games list", () => {
    const rows = computeBolaoStandings(
      [{ userId: "u1", gameId: "unplayed", predictedScoreA: 1, predictedScoreB: 0 }],
      []
    );
    expect(rows).toEqual([]);
  });

  it("accumulates points across multiple games and sorts by points then exact hits", () => {
    const predictions = [
      { userId: "u1", gameId: "g1", predictedScoreA: 2, predictedScoreB: 1 },
      { userId: "u1", gameId: "g2", predictedScoreA: 1, predictedScoreB: 0 },
      { userId: "u2", gameId: "g1", predictedScoreA: 3, predictedScoreB: 1 },
      { userId: "u2", gameId: "g2", predictedScoreA: 0, predictedScoreB: 1 },
    ];
    const games = [
      { id: "g1", scoreA: 2, scoreB: 1 },
      { id: "g2", scoreA: 2, scoreB: 0 },
    ];
    const rows = computeBolaoStandings(predictions, games);
    expect(rows).toEqual([
      { userId: "u1", points: 4, exactCount: 1, correctCount: 1 },
      { userId: "u2", points: 1, exactCount: 0, correctCount: 1 },
    ]);
  });
});

describe("computeGroupPredictionPoints", () => {
  it("awards 5 points for each correctly predicted position in a finished group", () => {
    const rows = computeGroupPredictionPoints(
      [
        { userId: "u1", groupName: "Grupo A", position: 1, teamId: "t1" },
        { userId: "u1", groupName: "Grupo A", position: 2, teamId: "t2" },
      ],
      [{ groupName: "Grupo A", order: ["t1", "t2", "t3"] }]
    );
    expect(rows).toEqual([{ userId: "u1", points: 10, exactCount: 2 }]);
  });

  it("gives 0 points for a wrong position guess", () => {
    const rows = computeGroupPredictionPoints(
      [{ userId: "u1", groupName: "Grupo A", position: 1, teamId: "t2" }],
      [{ groupName: "Grupo A", order: ["t1", "t2", "t3"] }]
    );
    expect(rows).toEqual([{ userId: "u1", points: 0, exactCount: 0 }]);
  });

  it("ignores predictions for groups that are not yet finished", () => {
    const rows = computeGroupPredictionPoints(
      [{ userId: "u1", groupName: "Grupo B", position: 1, teamId: "t1" }],
      [{ groupName: "Grupo A", order: ["t1", "t2"] }]
    );
    expect(rows).toEqual([]);
  });

  it("treats a null groupName (tabela única, sem grupos) as its own group", () => {
    const rows = computeGroupPredictionPoints(
      [{ userId: "u1", groupName: null, position: 1, teamId: "t1" }],
      [{ groupName: null, order: ["t1", "t2"] }]
    );
    expect(rows).toEqual([{ userId: "u1", points: 5, exactCount: 1 }]);
  });

  it("accumulates points across multiple groups and sorts by points", () => {
    const rows = computeGroupPredictionPoints(
      [
        { userId: "u1", groupName: "Grupo A", position: 1, teamId: "t1" },
        { userId: "u1", groupName: "Grupo B", position: 1, teamId: "t3" },
        { userId: "u2", groupName: "Grupo A", position: 1, teamId: "t2" },
      ],
      [
        { groupName: "Grupo A", order: ["t1", "t2"] },
        { groupName: "Grupo B", order: ["t3", "t4"] },
      ]
    );
    expect(rows).toEqual([
      { userId: "u1", points: 10, exactCount: 2 },
      { userId: "u2", points: 0, exactCount: 0 },
    ]);
  });
});

describe("computeTopscorerPredictionPoints", () => {
  it("returns nothing while the topscorer isn't decided yet", () => {
    const rows = computeTopscorerPredictionPoints(
      [{ userId: "u1", playerId: "p1", points: 10 }],
      []
    );
    expect(rows).toEqual([]);
  });

  it("awards whoever picked the topscorer their stored points", () => {
    const rows = computeTopscorerPredictionPoints(
      [
        { userId: "u1", playerId: "p1", points: 10 },
        { userId: "u2", playerId: "p2", points: 10 },
      ],
      ["p1"]
    );
    expect(rows).toEqual([{ userId: "u1", points: 10 }]);
  });

  it("uses each prediction's own stored points (locked in when it was made)", () => {
    const rows = computeTopscorerPredictionPoints(
      [
        { userId: "u1", playerId: "p1", points: 10 },
        { userId: "u2", playerId: "p1", points: 3 },
      ],
      ["p1"]
    );
    expect(rows).toEqual(
      expect.arrayContaining([
        { userId: "u1", points: 10 },
        { userId: "u2", points: 3 },
      ])
    );
    expect(rows).toHaveLength(2);
  });

  it("counts a tie for the topscorer as a correct guess for either pick", () => {
    const rows = computeTopscorerPredictionPoints(
      [
        { userId: "u1", playerId: "p1", points: 10 },
        { userId: "u2", playerId: "p2", points: 10 },
      ],
      ["p1", "p2"]
    );
    expect(rows).toEqual(
      expect.arrayContaining([
        { userId: "u1", points: 10 },
        { userId: "u2", points: 10 },
      ])
    );
    expect(rows).toHaveLength(2);
  });
});

describe("computeChampionPredictionPoints", () => {
  it("returns nothing while the champion isn't decided yet", () => {
    const rows = computeChampionPredictionPoints([{ userId: "u1", teamId: "t1", points: 10 }], null);
    expect(rows).toEqual([]);
  });

  it("awards whoever picked the champion their stored points", () => {
    const rows = computeChampionPredictionPoints(
      [
        { userId: "u1", teamId: "t1", points: 10 },
        { userId: "u2", teamId: "t2", points: 5 },
      ],
      "t2"
    );
    expect(rows).toEqual([{ userId: "u2", points: 5 }]);
  });
});

describe("computeBolaoPredictionTier", () => {
  it("is worth 10 points before any game is played", () => {
    expect(computeBolaoPredictionTier(true, [])).toBe(10);
    expect(computeBolaoPredictionTier(true, [{ round: "Rodada 1", played: false }])).toBe(10);
  });

  it("is worth 5 points once games start, with no knockout stage", () => {
    expect(computeBolaoPredictionTier(false, [{ round: "Rodada 1", played: true }])).toBe(5);
  });

  it("is worth 5 points during the group/league stage of a championship with knockout", () => {
    expect(
      computeBolaoPredictionTier(true, [
        { round: "Grupo A - Rodada 1", played: true },
        { round: "Semifinal", played: false },
      ])
    ).toBe(5);
  });

  it("is worth 3 points once the knockout stage has started", () => {
    expect(
      computeBolaoPredictionTier(true, [
        { round: "Rodada 1", played: true },
        { round: "Semifinal", played: true },
      ])
    ).toBe(3);
  });

  it("never drops to 3 points for a championship without a knockout stage", () => {
    expect(
      computeBolaoPredictionTier(false, [
        { round: "Rodada 1", played: true },
        { round: "Final", played: true },
      ])
    ).toBe(5);
  });
});
