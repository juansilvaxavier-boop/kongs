import { describe, expect, it } from "vitest";
import { generateRoundRobin } from "./round-robin";

describe("generateRoundRobin", () => {
  it("returns nothing for fewer than 2 teams", () => {
    expect(generateRoundRobin([], false)).toEqual([]);
    expect(generateRoundRobin(["a"], false)).toEqual([]);
  });

  it("schedules every pair exactly once for an even number of teams (single round)", () => {
    const teams = ["a", "b", "c", "d"];
    const fixtures = generateRoundRobin(teams, false);

    // 4 times, turno único: 3 rodadas x 2 jogos = 6 jogos (todos os pares)
    expect(fixtures).toHaveLength(6);
    expect(new Set(fixtures.map((f) => f.round)).size).toBe(3);

    const pairs = fixtures.map((f) => [f.teamAId, f.teamBId].sort().join("-"));
    const expectedPairs = ["a-b", "a-c", "a-d", "b-c", "b-d", "c-d"];
    expect(new Set(pairs)).toEqual(new Set(expectedPairs));
  });

  it("gives every team a bye exactly once for an odd number of teams", () => {
    const teams = ["a", "b", "c"];
    const fixtures = generateRoundRobin(teams, false);

    // 3 times: 3 rodadas, 1 jogo por rodada (o terceiro time folga)
    expect(fixtures).toHaveLength(3);
    const rounds = new Set(fixtures.map((f) => f.round));
    expect(rounds.size).toBe(3);
  });

  it("doubles the fixtures and mirrors home/away for ida e volta", () => {
    const teams = ["a", "b"];
    const fixtures = generateRoundRobin(teams, true);

    expect(fixtures).toHaveLength(2);
    expect(fixtures[0]).toEqual({ round: 1, teamAId: "a", teamBId: "b" });
    expect(fixtures[1]).toEqual({ round: 2, teamAId: "b", teamBId: "a" });
  });

  it("never schedules a team against itself", () => {
    const fixtures = generateRoundRobin(["a", "b", "c", "d", "e"], true);
    expect(fixtures.every((f) => f.teamAId !== f.teamBId)).toBe(true);
  });
});
