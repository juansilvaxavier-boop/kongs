import { describe, expect, it } from "vitest";
import { computeBolaoStandings } from "./bolao";

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
