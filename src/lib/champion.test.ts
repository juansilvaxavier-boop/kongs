import { describe, expect, it } from "vitest";
import { computeChampionTeamId } from "./champion";

const teams = [
  { id: "t1", name: "Alpha" },
  { id: "t2", name: "Beta" },
];

function game(overrides: Partial<Parameters<typeof computeChampionTeamId>[3][number]> & { round?: string }) {
  return {
    id: "g1",
    round: "Rodada 1",
    team_a_id: "t1",
    team_b_id: "t2",
    date: null,
    score_a: null,
    score_b: null,
    played: false,
    ...overrides,
  };
}

describe("computeChampionTeamId", () => {
  it("returns null when there are no teams", () => {
    expect(computeChampionTeamId(false, "liga", [], [])).toBeNull();
  });

  it("liga: returns null while not all games are played", () => {
    const games = [
      game({ id: "g1", score_a: 1, score_b: 0, played: true }),
      game({ id: "g2", played: false }),
    ];
    expect(computeChampionTeamId(false, "liga", teams, games)).toBeNull();
  });

  it("liga: returns the top of the standings once every game is played", () => {
    const games = [game({ id: "g1", score_a: 2, score_b: 0, played: true })];
    expect(computeChampionTeamId(false, "liga", teams, games)).toBe("t1");
  });

  it("knockout: returns null when the final has not been played", () => {
    const games = [game({ id: "g1", round: "Final", played: false })];
    expect(computeChampionTeamId(true, "copa", teams, games)).toBeNull();
  });

  it("knockout: returns null when the last round still has more than one game", () => {
    const games = [
      game({ id: "g1", round: "Semifinal", score_a: 1, score_b: 0, played: true }),
      game({ id: "g2", round: "Semifinal", team_a_id: "t1", team_b_id: "t2", score_a: 2, score_b: 1, played: true }),
    ];
    expect(computeChampionTeamId(true, "copa", teams, games)).toBeNull();
  });

  it("knockout: returns the winner of the final", () => {
    const games = [game({ id: "g1", round: "Final", score_a: 3, score_b: 1, played: true })];
    expect(computeChampionTeamId(true, "copa", teams, games)).toBe("t1");
  });

  it("knockout: uses the penalty shootout when the final is tied", () => {
    const games = [
      game({
        id: "g1",
        round: "Final",
        score_a: 1,
        score_b: 1,
        penalty_score_a: 2,
        penalty_score_b: 4,
        played: true,
      }),
    ];
    expect(computeChampionTeamId(true, "copa", teams, games)).toBe("t2");
  });

  it("copa without knockout stage (só fase de grupos): returns null — ambíguo", () => {
    const games = [game({ id: "g1", score_a: 2, score_b: 0, played: true })];
    expect(computeChampionTeamId(false, "copa", teams, games)).toBeNull();
  });
});
