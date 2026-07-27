import { describe, expect, it } from "vitest";
import { computeBalancedTeams } from "./racha-draft";

describe("computeBalancedTeams", () => {
  it("returns two empty teams for no players", () => {
    expect(computeBalancedTeams([])).toEqual({ teamA: [], teamB: [] });
  });

  it("puts a single player on team A", () => {
    const result = computeBalancedTeams([{ id: "p1", position: "Atacante", ovr: 80 }]);
    expect(result).toEqual({ teamA: ["p1"], teamB: [] });
  });

  it("balances total OVR between teams (greedy, highest first)", () => {
    const players = [
      { id: "p1", position: "Atacante", ovr: 90 },
      { id: "p2", position: "Meia", ovr: 80 },
      { id: "p3", position: "Zagueiro", ovr: 70 },
      { id: "p4", position: "Atacante", ovr: 60 },
    ];
    const { teamA, teamB } = computeBalancedTeams(players);
    expect(teamA).toContain("p1");
    expect(teamB).toContain("p2");
    expect([...teamA, ...teamB].sort()).toEqual(["p1", "p2", "p3", "p4"]);

    const sumA = teamA
      .map((id) => players.find((p) => p.id === id)!.ovr)
      .reduce((a, b) => a + b, 0);
    const sumB = teamB
      .map((id) => players.find((p) => p.id === id)!.ovr)
      .reduce((a, b) => a + b, 0);
    expect(Math.abs(sumA - sumB)).toBeLessThanOrEqual(20);
  });

  it("spreads goalkeepers one per team when there are at least two", () => {
    const players = [
      { id: "gk1", position: "Goleiro", ovr: 75 },
      { id: "gk2", position: "Goleiro", ovr: 65 },
      { id: "p1", position: "Atacante", ovr: 80 },
      { id: "p2", position: "Meia", ovr: 70 },
    ];
    const { teamA, teamB } = computeBalancedTeams(players);
    expect(teamA).toContain("gk1");
    expect(teamB).toContain("gk2");
  });

  it("never assigns the same player to both teams and never drops a player", () => {
    const players = Array.from({ length: 11 }, (_, i) => ({
      id: `p${i}`,
      position: i === 0 ? "Goleiro" : "Meia",
      ovr: 50 + i,
    }));
    const { teamA, teamB } = computeBalancedTeams(players);
    const all = [...teamA, ...teamB];
    expect(new Set(all).size).toBe(all.length);
    expect(all.length).toBe(players.length);
  });
});
