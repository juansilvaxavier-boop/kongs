import { describe, expect, it } from "vitest";
import {
  clampAttribute,
  computeOvrLedger,
  computeRarity,
  sumLedger,
  type PlayerGameStats,
} from "./gamification";

function stats(overrides: Partial<PlayerGameStats>): PlayerGameStats {
  return {
    goals: 0,
    won: false,
    yellowCards: 0,
    redCards: 0,
    goalsConceded: 0,
    position: "Atacante",
    ...overrides,
  };
}

describe("computeOvrLedger", () => {
  it("returns nothing for a player with no events, no win, and no goals conceded impact", () => {
    expect(computeOvrLedger(stats({ position: "Meia" }))).toEqual([]);
  });

  it("adds a goal entry worth 0.30 per goal", () => {
    const entries = computeOvrLedger(stats({ goals: 1 }));
    expect(entries).toEqual([{ reason: "1 gol", delta: 0.3 }]);
  });

  it("pluralizes multiple goals and multiplies the weight", () => {
    const entries = computeOvrLedger(stats({ goals: 2 }));
    expect(entries).toEqual([{ reason: "2 gols", delta: 0.6 }]);
  });

  it("adds a fixed 0.20 bonus for a win", () => {
    expect(computeOvrLedger(stats({ won: true }))).toEqual([
      { reason: "Vitória", delta: 0.2 },
    ]);
  });

  it("subtracts 0.15 per yellow card", () => {
    expect(computeOvrLedger(stats({ yellowCards: 1 }))).toEqual([
      { reason: "Cartão amarelo", delta: -0.15 },
    ]);
  });

  it("subtracts 0.50 per red card", () => {
    expect(computeOvrLedger(stats({ redCards: 1 }))).toEqual([
      { reason: "Cartão vermelho", delta: -0.5 },
    ]);
  });

  it("gives Atacantes and Meias only the base formula (no defensive term)", () => {
    const entries = computeOvrLedger(
      stats({ goals: 1, position: "Atacante", goalsConceded: 5 })
    );
    expect(entries).toEqual([{ reason: "1 gol", delta: 0.3 }]);
  });

  it("gives Zagueiros a defensive impact term based on goals conceded", () => {
    // (3.5 - 1) * 0.15 = 0.375 -> rounds to 0.38 (round2 uses standard rounding)
    const entries = computeOvrLedger(stats({ position: "Zagueiro", goalsConceded: 1 }));
    expect(entries).toEqual([
      { reason: "Impacto defensivo (1 gols sofridos)", delta: 0.38 },
    ]);
  });

  it("gives Goleiros a larger defensive impact weight than Zagueiros", () => {
    const entries = computeOvrLedger(stats({ position: "Goleiro", goalsConceded: 1 }));
    expect(entries).toEqual([
      { reason: "Impacto defensivo (1 gols sofridos)", delta: 0.63 },
    ]);
  });

  it("penalizes a Zagueiro who concedes more than the goals constant", () => {
    const entries = computeOvrLedger(stats({ position: "Zagueiro", goalsConceded: 5 }));
    expect(entries).toEqual([
      { reason: "Impacto defensivo (5 gols sofridos)", delta: -0.22 },
    ]);
  });

  it("omits the defensive term entirely when it would be exactly zero", () => {
    // (3.5 - 3.5) * 0.15 = 0, but goalsConceded is an int in practice; use 3.5 to hit zero directly
    const entries = computeOvrLedger(stats({ position: "Zagueiro", goalsConceded: 3.5 }));
    expect(entries).toEqual([]);
  });

  it("combines every applicable reason for a full match line", () => {
    const entries = computeOvrLedger(
      stats({ goals: 1, won: true, yellowCards: 1, position: "Zagueiro", goalsConceded: 0 })
    );
    expect(entries).toEqual([
      { reason: "1 gol", delta: 0.3 },
      { reason: "Vitória", delta: 0.2 },
      { reason: "Cartão amarelo", delta: -0.15 },
      { reason: "Impacto defensivo (0 gols sofridos)", delta: 0.53 },
    ]);
  });
});

describe("sumLedger", () => {
  it("sums all entry deltas", () => {
    expect(
      sumLedger([
        { reason: "a", delta: 0.3 },
        { reason: "b", delta: -0.15 },
      ])
    ).toBe(0.15);
  });

  it("returns 0 for an empty ledger", () => {
    expect(sumLedger([])).toBe(0);
  });
});

describe("computeRarity", () => {
  it("classifies Bronze below 70", () => {
    expect(computeRarity(69)).toBe("bronze");
    expect(computeRarity(0)).toBe("bronze");
  });

  it("classifies Prata from 70 to 79", () => {
    expect(computeRarity(70)).toBe("prata");
    expect(computeRarity(79.9)).toBe("prata");
  });

  it("classifies Ouro from 80 to 95", () => {
    expect(computeRarity(80)).toBe("ouro");
    expect(computeRarity(95)).toBe("ouro");
  });

  it("classifies Legend from 96 to 99", () => {
    expect(computeRarity(96)).toBe("legend");
    expect(computeRarity(99)).toBe("legend");
  });
});

describe("clampAttribute", () => {
  it("clamps to the 0-99 range", () => {
    expect(clampAttribute(105)).toBe(99);
    expect(clampAttribute(-5)).toBe(0);
    expect(clampAttribute(70.456)).toBe(70.46);
  });
});
