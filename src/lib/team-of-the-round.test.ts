import { describe, expect, it } from "vitest";
import { computeTeamOfTheRound } from "./team-of-the-round";

describe("computeTeamOfTheRound", () => {
  it("picks the top scorer for each single-slot position", () => {
    const result = computeTeamOfTheRound([
      { playerId: "gk1", position: "Goleiro", delta: 0.5 },
      { playerId: "gk2", position: "Goleiro", delta: 1.2 },
      { playerId: "fw1", position: "Atacante", delta: 0.3 },
    ]);

    expect(result.find((s) => s.position === "Goleiro")?.playerId).toBe("gk2");
    expect(result.find((s) => s.position === "Atacante")?.playerId).toBe("fw1");
  });

  it("picks the top 2 for Zagueiro and Meia slots", () => {
    const result = computeTeamOfTheRound([
      { playerId: "def1", position: "Zagueiro", delta: 0.4 },
      { playerId: "def2", position: "Zagueiro", delta: 0.9 },
      { playerId: "def3", position: "Zagueiro", delta: 0.1 },
      { playerId: "mid1", position: "Meia", delta: 1.5 },
      { playerId: "mid2", position: "Meia", delta: 0.2 },
    ]);

    const defenders = result.filter((s) => s.position === "Zagueiro").map((s) => s.playerId);
    expect(defenders).toEqual(["def2", "def1"]);

    const midfielders = result.filter((s) => s.position === "Meia").map((s) => s.playerId);
    expect(midfielders).toEqual(["mid1", "mid2"]);
  });

  it("sums multiple ledger entries for the same player before ranking", () => {
    const result = computeTeamOfTheRound([
      { playerId: "fw1", position: "Atacante", delta: 0.3 },
      { playerId: "fw1", position: "Atacante", delta: 0.3 },
      { playerId: "fw2", position: "Atacante", delta: 0.5 },
    ]);

    expect(result.find((s) => s.position === "Atacante")?.playerId).toBe("fw1");
  });

  it("ignores positions outside the formation (Lateral, Volante)", () => {
    const result = computeTeamOfTheRound([
      { playerId: "lat1", position: "Lateral", delta: 10 },
      { playerId: "vol1", position: "Volante", delta: 10 },
    ]);

    expect(result).toEqual([]);
  });

  it("leaves a slot empty when there are no candidates for it", () => {
    const result = computeTeamOfTheRound([
      { playerId: "fw1", position: "Atacante", delta: 0.3 },
    ]);

    expect(result).toEqual([{ position: "Atacante", playerId: "fw1", delta: 0.3 }]);
  });

  it("returns an empty formation for no entries", () => {
    expect(computeTeamOfTheRound([])).toEqual([]);
  });
});
