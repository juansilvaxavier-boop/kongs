import { describe, expect, it } from "vitest";
import { computeAutoLineup, type LineupPlayer } from "./lineup";

function player(
  id: string,
  position: string | null,
  ovr: number
): LineupPlayer {
  return { id, name: id, position, number: null, photoUrl: null, ovr };
}

describe("computeAutoLineup", () => {
  it("picks the best goalkeeper and the best 2 defenders by ovr", () => {
    const result = computeAutoLineup([
      player("gk1", "Goleiro", 60),
      player("gk2", "Goleiro", 80),
      player("def1", "Zagueiro", 70),
      player("def2", "Zagueiro", 90),
      player("def3", "Zagueiro", 50),
    ]);

    expect(result.starters.Goleiro.map((p) => p.id)).toEqual(["gk2"]);
    expect(result.starters.Zagueiro.map((p) => p.id)).toEqual(["def2", "def1"]);
    expect(result.bench.map((p) => p.id)).toContain("gk1");
    expect(result.bench.map((p) => p.id)).toContain("def3");
  });

  it("uses 2 midfielders + 1 forward when that combination has more ovr", () => {
    const result = computeAutoLineup([
      player("mid1", "Meia", 90),
      player("mid2", "Meia", 85),
      player("fwd1", "Atacante", 60),
    ]);

    expect(result.formation).toBe("1-2-2-1");
    expect(result.starters.Meia.map((p) => p.id).sort()).toEqual(["mid1", "mid2"]);
    expect(result.starters.Atacante.map((p) => p.id)).toEqual(["fwd1"]);
  });

  it("uses 1 midfielder + 2 forwards when that combination has more ovr", () => {
    const result = computeAutoLineup([
      player("mid1", "Meia", 60),
      player("fwd1", "Atacante", 90),
      player("fwd2", "Atacante", 85),
    ]);

    expect(result.formation).toBe("1-2-1-2");
    expect(result.starters.Meia.map((p) => p.id)).toEqual(["mid1"]);
    expect(result.starters.Atacante.map((p) => p.id).sort()).toEqual(["fwd1", "fwd2"]);
  });

  it("puts every non-starter on the bench, sorted by ovr desc", () => {
    const result = computeAutoLineup([
      player("gk1", "Goleiro", 70),
      player("def1", "Zagueiro", 70),
      player("def2", "Zagueiro", 65),
      player("def3", "Zagueiro", 60),
      player("mid1", "Meia", 75),
      player("mid2", "Meia", 55),
      player("mid3", "Meia", 40),
      player("fwd1", "Atacante", 80),
    ]);

    expect(result.bench.map((p) => p.id)).toEqual(["def3", "mid3"]);
  });

  it("handles a roster missing some positions gracefully", () => {
    const result = computeAutoLineup([player("fwd1", "Atacante", 70)]);

    expect(result.starters.Goleiro).toEqual([]);
    expect(result.starters.Zagueiro).toEqual([]);
    expect(result.bench).toEqual([]);
  });

  it("returns an empty lineup for no players", () => {
    const result = computeAutoLineup([]);
    expect(result.starters.Goleiro).toEqual([]);
    expect(result.bench).toEqual([]);
  });
});
