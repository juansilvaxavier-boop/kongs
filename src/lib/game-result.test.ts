import { describe, expect, it } from "vitest";
import { gameWinnerId } from "./game-result";

const base = { teamAId: "a", teamBId: "b", played: true };

describe("gameWinnerId", () => {
  it("returns null when the game has not been played", () => {
    expect(gameWinnerId({ ...base, played: false, scoreA: 1, scoreB: 0 })).toBeNull();
  });

  it("returns null when scores are missing", () => {
    expect(gameWinnerId({ ...base, scoreA: null, scoreB: null })).toBeNull();
  });

  it("returns team A when it scored more", () => {
    expect(gameWinnerId({ ...base, scoreA: 2, scoreB: 1 })).toBe("a");
  });

  it("returns team B when it scored more", () => {
    expect(gameWinnerId({ ...base, scoreA: 0, scoreB: 3 })).toBe("b");
  });

  it("returns null for a tie with no penalty shootout registered", () => {
    expect(gameWinnerId({ ...base, scoreA: 1, scoreB: 1 })).toBeNull();
  });

  it("uses the penalty shootout to break a tie", () => {
    expect(
      gameWinnerId({ ...base, scoreA: 1, scoreB: 1, penaltyScoreA: 4, penaltyScoreB: 3 })
    ).toBe("a");
    expect(
      gameWinnerId({ ...base, scoreA: 1, scoreB: 1, penaltyScoreA: 2, penaltyScoreB: 5 })
    ).toBe("b");
  });

  it("ignores a tied penalty shootout (invalid state)", () => {
    expect(
      gameWinnerId({ ...base, scoreA: 1, scoreB: 1, penaltyScoreA: 3, penaltyScoreB: 3 })
    ).toBeNull();
  });
});
