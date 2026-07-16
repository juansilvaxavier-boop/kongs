import { describe, expect, it } from "vitest";
import { buildBracketColumns } from "./bracket";

function game(overrides: Partial<Parameters<typeof buildBracketColumns>[0][number]>) {
  return {
    id: "g",
    round: "Rodada 1",
    team_a_id: "a",
    team_b_id: "b",
    date: null,
    score_a: null,
    score_b: null,
    played: false,
    ...overrides,
  };
}

describe("buildBracketColumns", () => {
  it("groups games by round label", () => {
    const games = [
      game({ id: "1", round: "Quartas", date: "2026-08-01T00:00:00Z" }),
      game({ id: "2", round: "Quartas", date: "2026-08-01T00:00:00Z" }),
      game({ id: "3", round: "Final", date: "2026-08-15T00:00:00Z" }),
    ];
    const columns = buildBracketColumns(games);

    expect(columns.map((c) => c.round)).toEqual(["Quartas", "Final"]);
    expect(columns[0].games).toHaveLength(2);
    expect(columns[1].games).toHaveLength(1);
  });

  it("orders columns by each round's earliest scheduled date", () => {
    const games = [
      game({ id: "1", round: "Final", date: "2026-08-20T00:00:00Z" }),
      game({ id: "2", round: "Semifinal", date: "2026-08-10T00:00:00Z" }),
    ];
    const columns = buildBracketColumns(games);
    expect(columns.map((c) => c.round)).toEqual(["Semifinal", "Final"]);
  });

  it("falls back to natural round-name order when no dates are set", () => {
    const games = [
      game({ id: "1", round: "Rodada 10", date: null }),
      game({ id: "2", round: "Rodada 2", date: null }),
    ];
    const columns = buildBracketColumns(games);
    expect(columns.map((c) => c.round)).toEqual(["Rodada 2", "Rodada 10"]);
  });

  it("puts undated rounds after dated ones", () => {
    const games = [
      game({ id: "1", round: "Sem data", date: null }),
      game({ id: "2", round: "Com data", date: "2026-08-01T00:00:00Z" }),
    ];
    const columns = buildBracketColumns(games);
    expect(columns.map((c) => c.round)).toEqual(["Com data", "Sem data"]);
  });
});
