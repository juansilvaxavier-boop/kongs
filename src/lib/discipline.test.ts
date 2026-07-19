import { describe, expect, it } from "vitest";
import { computeSuspensions } from "./discipline";

describe("computeSuspensions", () => {
  const players = [{ id: "p1", team_id: "t1" }];

  it("does not suspend a player when the team has no played games", () => {
    const result = computeSuspensions(players, [], [], 3);
    expect(result.get("p1")).toEqual({ suspended: false, reason: null, pendingSuspension: false });
  });

  it("ignores players without a team", () => {
    const result = computeSuspensions(
      [{ id: "p1", team_id: null }],
      [],
      [],
      3
    );
    expect(result.get("p1")).toEqual({ suspended: false, reason: null, pendingSuspension: false });
  });

  it("suspends with reason red when a red card happened in the last played game", () => {
    const games = [
      { id: "g1", team_a_id: "t1", team_b_id: "t2", date: null, round: "Rodada 1", played: true },
    ];
    const cardEvents = [{ player_id: "p1", card_type: "red", game_id: "g1" }];
    const result = computeSuspensions(players, cardEvents, games, 3);
    expect(result.get("p1")).toEqual({ suspended: true, reason: "red", pendingSuspension: false });
  });

  it("suspends with reason yellow when the accumulated count crosses the threshold in the last game", () => {
    const games = [
      { id: "g1", team_a_id: "t1", team_b_id: "t2", date: null, round: "Rodada 1", played: true },
      { id: "g2", team_a_id: "t1", team_b_id: "t2", date: null, round: "Rodada 2", played: true },
      { id: "g3", team_a_id: "t1", team_b_id: "t2", date: null, round: "Rodada 3", played: true },
    ];
    const cardEvents = [
      { player_id: "p1", card_type: "yellow", game_id: "g1" },
      { player_id: "p1", card_type: "yellow", game_id: "g2" },
      { player_id: "p1", card_type: "yellow", game_id: "g3" },
    ];
    const result = computeSuspensions(players, cardEvents, games, 3);
    expect(result.get("p1")).toEqual({ suspended: true, reason: "yellow", pendingSuspension: false });
  });

  it("does not suspend when the threshold was already crossed before the last game", () => {
    const games = [
      { id: "g1", team_a_id: "t1", team_b_id: "t2", date: null, round: "Rodada 1", played: true },
      { id: "g2", team_a_id: "t1", team_b_id: "t2", date: null, round: "Rodada 2", played: true },
      { id: "g3", team_a_id: "t1", team_b_id: "t2", date: null, round: "Rodada 3", played: true },
      { id: "g4", team_a_id: "t1", team_b_id: "t2", date: null, round: "Rodada 4", played: true },
    ];
    const cardEvents = [
      { player_id: "p1", card_type: "yellow", game_id: "g1" },
      { player_id: "p1", card_type: "yellow", game_id: "g2" },
      { player_id: "p1", card_type: "yellow", game_id: "g3" },
    ];
    const result = computeSuspensions(players, cardEvents, games, 3);
    expect(result.get("p1")).toEqual({ suspended: false, reason: null, pendingSuspension: false });
  });

  it("marks a player as pendurado one yellow card away from suspension", () => {
    const games = [
      { id: "g1", team_a_id: "t1", team_b_id: "t2", date: null, round: "Rodada 1", played: true },
      { id: "g2", team_a_id: "t1", team_b_id: "t2", date: null, round: "Rodada 2", played: true },
    ];
    const cardEvents = [
      { player_id: "p1", card_type: "yellow", game_id: "g1" },
      { player_id: "p1", card_type: "yellow", game_id: "g2" },
    ];
    const result = computeSuspensions(players, cardEvents, games, 3);
    expect(result.get("p1")).toEqual({ suspended: false, reason: null, pendingSuspension: true });
  });

  it("does not mark pendurado when the yellow threshold is 1 (every card suspends)", () => {
    const games = [
      { id: "g1", team_a_id: "t1", team_b_id: "t2", date: null, round: "Rodada 1", played: true },
    ];
    const result = computeSuspensions(players, [], games, 1);
    expect(result.get("p1")).toEqual({ suspended: false, reason: null, pendingSuspension: false });
  });

  it("clears the suspension once the team plays a further game after the trigger game", () => {
    const games = [
      { id: "g1", team_a_id: "t1", team_b_id: "t2", date: null, round: "Rodada 1", played: true },
      { id: "g2", team_a_id: "t1", team_b_id: "t2", date: null, round: "Rodada 2", played: true },
      { id: "g3", team_a_id: "t1", team_b_id: "t2", date: null, round: "Rodada 3", played: true },
      { id: "g4", team_a_id: "t1", team_b_id: "t2", date: null, round: "Rodada 4", played: true },
    ];
    const cardEvents = [
      { player_id: "p1", card_type: "yellow", game_id: "g1" },
      { player_id: "p1", card_type: "yellow", game_id: "g2" },
      { player_id: "p1", card_type: "yellow", game_id: "g3" },
    ];
    const result = computeSuspensions(players, cardEvents, games, 3);
    expect(result.get("p1")).toEqual({ suspended: false, reason: null, pendingSuspension: false });
  });

  it("ignores unplayed games when determining the last game", () => {
    const games = [
      { id: "g1", team_a_id: "t1", team_b_id: "t2", date: null, round: "Rodada 1", played: true },
      { id: "g2", team_a_id: "t1", team_b_id: "t2", date: null, round: "Rodada 2", played: false },
    ];
    const cardEvents = [{ player_id: "p1", card_type: "red", game_id: "g1" }];
    const result = computeSuspensions(players, cardEvents, games, 3);
    expect(result.get("p1")).toEqual({ suspended: true, reason: "red", pendingSuspension: false });
  });

  it("sorts games chronologically by date when available", () => {
    const games = [
      { id: "g2", team_a_id: "t1", team_b_id: "t2", date: "2026-02-01", round: "Rodada 2", played: true },
      { id: "g1", team_a_id: "t1", team_b_id: "t2", date: "2026-01-01", round: "Rodada 1", played: true },
    ];
    const cardEvents = [{ player_id: "p1", card_type: "red", game_id: "g1" }];
    const result = computeSuspensions(players, cardEvents, games, 3);
    expect(result.get("p1")).toEqual({ suspended: false, reason: null, pendingSuspension: false });
  });

  it("falls back to natural round ordering when dates are missing", () => {
    const games = [
      { id: "g10", team_a_id: "t1", team_b_id: "t2", date: null, round: "Rodada 10", played: true },
      { id: "g2", team_a_id: "t1", team_b_id: "t2", date: null, round: "Rodada 2", played: true },
    ];
    const cardEvents = [{ player_id: "p1", card_type: "red", game_id: "g2" }];
    const result = computeSuspensions(players, cardEvents, games, 3);
    expect(result.get("p1")).toEqual({ suspended: false, reason: null, pendingSuspension: false });
  });
});
