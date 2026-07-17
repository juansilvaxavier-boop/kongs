import { describe, expect, it } from "vitest";
import {
  generateRoundRobin,
  generateRoundRobinForTotalRounds,
  roundsPerCycle,
} from "./round-robin";

describe("generateRoundRobin", () => {
  it("returns nothing for fewer than 2 teams", () => {
    expect(generateRoundRobin([], 1)).toEqual([]);
    expect(generateRoundRobin(["a"], 1)).toEqual([]);
  });

  it("returns nothing for zero or negative rounds", () => {
    expect(generateRoundRobin(["a", "b"], 0)).toEqual([]);
  });

  it("schedules every pair exactly once for an even number of teams (single round)", () => {
    const teams = ["a", "b", "c", "d"];
    const fixtures = generateRoundRobin(teams, 1);

    // 4 times, turno único: 3 rodadas x 2 jogos = 6 jogos (todos os pares)
    expect(fixtures).toHaveLength(6);
    expect(new Set(fixtures.map((f) => f.round)).size).toBe(3);

    const pairs = fixtures.map((f) => [f.teamAId, f.teamBId].sort().join("-"));
    const expectedPairs = ["a-b", "a-c", "a-d", "b-c", "b-d", "c-d"];
    expect(new Set(pairs)).toEqual(new Set(expectedPairs));
  });

  it("gives every team a bye exactly once for an odd number of teams", () => {
    const teams = ["a", "b", "c"];
    const fixtures = generateRoundRobin(teams, 1);

    // 3 times: 3 rodadas, 1 jogo por rodada (o terceiro time folga)
    expect(fixtures).toHaveLength(3);
    const rounds = new Set(fixtures.map((f) => f.round));
    expect(rounds.size).toBe(3);
  });

  it("doubles the fixtures and mirrors home/away for ida e volta", () => {
    const teams = ["a", "b"];
    const fixtures = generateRoundRobin(teams, 2);

    expect(fixtures).toHaveLength(2);
    expect(fixtures[0]).toEqual({ round: 1, teamAId: "a", teamBId: "b" });
    expect(fixtures[1]).toEqual({ round: 2, teamAId: "b", teamBId: "a" });
  });

  it("supports extra rounds beyond ida e volta, alternating mando", () => {
    const teams = ["a", "b"];
    const fixtures = generateRoundRobin(teams, 3);

    expect(fixtures).toHaveLength(3);
    expect(fixtures[0]).toEqual({ round: 1, teamAId: "a", teamBId: "b" });
    expect(fixtures[1]).toEqual({ round: 2, teamAId: "b", teamBId: "a" });
    expect(fixtures[2]).toEqual({ round: 3, teamAId: "a", teamBId: "b" });
  });

  it("never schedules a team against itself", () => {
    const fixtures = generateRoundRobin(["a", "b", "c", "d", "e"], 2);
    expect(fixtures.every((f) => f.teamAId !== f.teamBId)).toBe(true);
  });
});

describe("roundsPerCycle", () => {
  it("is teamCount - 1 for an even number of teams", () => {
    expect(roundsPerCycle(4)).toBe(3);
  });

  it("is teamCount for an odd number of teams (bye rotates)", () => {
    expect(roundsPerCycle(5)).toBe(5);
  });
});

describe("generateRoundRobinForTotalRounds", () => {
  it("returns nothing for fewer than 2 teams or fewer than 1 round", () => {
    expect(generateRoundRobinForTotalRounds(["a"], 3)).toEqual([]);
    expect(generateRoundRobinForTotalRounds(["a", "b"], 0)).toEqual([]);
  });

  it("truncates a single cycle when total rounds is less than a full turno", () => {
    const fixtures = generateRoundRobinForTotalRounds(["a", "b", "c", "d"], 2);
    // turno único de 4 times tem 3 rodadas; pedindo 2, corta a 3ª
    expect(fixtures).toHaveLength(4);
    expect(new Set(fixtures.map((f) => f.round))).toEqual(new Set([1, 2]));
  });

  it("repeats full cycles and truncates the remainder to hit an exact round count", () => {
    // 2 times: 1 rodada por turno. Pedindo 5 rodadas, gera 5 turnos completos.
    const fixtures = generateRoundRobinForTotalRounds(["a", "b"], 5);
    expect(fixtures).toHaveLength(5);
    expect(fixtures.map((f) => f.round)).toEqual([1, 2, 3, 4, 5]);
  });

  it("gives every team the same number of games for an even team count", () => {
    const fixtures = generateRoundRobinForTotalRounds(["a", "b", "c", "d"], 5);
    const gamesPerTeam = new Map<string, number>();
    for (const f of fixtures) {
      gamesPerTeam.set(f.teamAId, (gamesPerTeam.get(f.teamAId) ?? 0) + 1);
      gamesPerTeam.set(f.teamBId, (gamesPerTeam.get(f.teamBId) ?? 0) + 1);
    }
    expect([...gamesPerTeam.values()]).toEqual([5, 5, 5, 5]);
  });
});
