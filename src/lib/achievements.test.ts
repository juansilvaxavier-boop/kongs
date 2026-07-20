import { describe, expect, it } from "vitest";
import { computeAchievements } from "./achievements";

function baseInput(overrides: Partial<Parameters<typeof computeAchievements>[0]> = {}) {
  return {
    goalsTotal: 0,
    maxGoalsSingleGame: 0,
    isTopScorer: false,
    cardsTotal: 0,
    wasMvp: false,
    position: null,
    ovr: 70,
    rarity: "bronze" as const,
    ...overrides,
  };
}

describe("computeAchievements", () => {
  it("returns no achievements for a plain average player", () => {
    expect(computeAchievements(baseInput())).toEqual([]);
  });

  it("awards Artilheiro to the championship's top scorer", () => {
    const result = computeAchievements(baseInput({ isTopScorer: true, goalsTotal: 10 }));
    expect(result.some((a) => a.id === "artilheiro")).toBe(true);
  });

  it("awards Hat-trick when 3+ goals were scored in a single game", () => {
    const result = computeAchievements(baseInput({ maxGoalsSingleGame: 3 }));
    expect(result.some((a) => a.id === "hat-trick")).toBe(true);
  });

  it("does not award Hat-trick for 2 goals in a single game", () => {
    const result = computeAchievements(baseInput({ maxGoalsSingleGame: 2 }));
    expect(result.some((a) => a.id === "hat-trick")).toBe(false);
  });

  it("awards Craque do jogo when the player was MVP at least once", () => {
    const result = computeAchievements(baseInput({ wasMvp: true }));
    expect(result.some((a) => a.id === "craque-do-jogo")).toBe(true);
  });

  it("awards Fair Play only when the player scored and has zero cards", () => {
    const withGoalsNoCards = computeAchievements(baseInput({ goalsTotal: 2, cardsTotal: 0 }));
    expect(withGoalsNoCards.some((a) => a.id === "fair-play")).toBe(true);

    const withCards = computeAchievements(baseInput({ goalsTotal: 2, cardsTotal: 1 }));
    expect(withCards.some((a) => a.id === "fair-play")).toBe(false);

    const noGoals = computeAchievements(baseInput({ goalsTotal: 0, cardsTotal: 0 }));
    expect(noGoals.some((a) => a.id === "fair-play")).toBe(false);
  });

  it("awards Lenda only for legend rarity", () => {
    const legend = computeAchievements(baseInput({ rarity: "legend", ovr: 97 }));
    expect(legend.some((a) => a.id === "lenda")).toBe(true);

    const gold = computeAchievements(baseInput({ rarity: "ouro", ovr: 90 }));
    expect(gold.some((a) => a.id === "lenda")).toBe(false);
  });

  it("awards Muralha to defenders/goalkeepers with 80+ overall", () => {
    const zagueiro = computeAchievements(baseInput({ position: "Zagueiro", ovr: 82 }));
    expect(zagueiro.some((a) => a.id === "muralha")).toBe(true);

    const goleiro = computeAchievements(baseInput({ position: "Goleiro", ovr: 85 }));
    expect(goleiro.some((a) => a.id === "muralha")).toBe(true);

    const lowOvr = computeAchievements(baseInput({ position: "Zagueiro", ovr: 75 }));
    expect(lowOvr.some((a) => a.id === "muralha")).toBe(false);
  });

  it("awards Camisa 10 to midfielders/attackers with 80+ overall", () => {
    const meia = computeAchievements(baseInput({ position: "Meia", ovr: 81 }));
    expect(meia.some((a) => a.id === "camisa-10")).toBe(true);

    const atacante = computeAchievements(baseInput({ position: "Atacante", ovr: 88 }));
    expect(atacante.some((a) => a.id === "camisa-10")).toBe(true);

    const defender = computeAchievements(baseInput({ position: "Zagueiro", ovr: 88 }));
    expect(defender.some((a) => a.id === "camisa-10")).toBe(false);
  });
});
