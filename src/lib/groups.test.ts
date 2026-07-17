import { describe, expect, it } from "vitest";
import { gamesWithinTeams, groupTeams, groupTeamsByFormat } from "./groups";

describe("groupTeams", () => {
  it("returns a single ungrouped bucket when no team has a group", () => {
    const teams = [
      { id: "a", name: "A", group_name: null },
      { id: "b", name: "B", group_name: null },
    ];
    const groups = groupTeams(teams);
    expect(groups).toEqual([{ groupName: null, teams }]);
  });

  it("splits teams into groups sorted alphabetically", () => {
    const teams = [
      { id: "a", name: "A", group_name: "Grupo B" },
      { id: "b", name: "B", group_name: "Grupo A" },
      { id: "c", name: "C", group_name: "Grupo A" },
    ];
    const groups = groupTeams(teams);

    expect(groups.map((g) => g.groupName)).toEqual(["Grupo A", "Grupo B"]);
    expect(groups[0].teams.map((t) => t.id)).toEqual(["b", "c"]);
    expect(groups[1].teams.map((t) => t.id)).toEqual(["a"]);
  });

  it("puts teams without a group in a trailing 'Sem grupo' bucket", () => {
    const teams = [
      { id: "a", name: "A", group_name: "Grupo A" },
      { id: "b", name: "B", group_name: null },
    ];
    const groups = groupTeams(teams);

    expect(groups.map((g) => g.groupName)).toEqual(["Grupo A", "Sem grupo"]);
    expect(groups[1].teams.map((t) => t.id)).toEqual(["b"]);
  });
});

describe("groupTeamsByFormat", () => {
  const teams = [
    { id: "a", name: "A", group_name: "Grupo B" },
    { id: "b", name: "B", group_name: "Grupo A" },
  ];

  it("groups by group_name for copa", () => {
    const groups = groupTeamsByFormat("copa", teams);
    expect(groups.map((g) => g.groupName)).toEqual(["Grupo A", "Grupo B"]);
  });

  it("always returns a single table for liga, ignoring group_name", () => {
    const groups = groupTeamsByFormat("liga", teams);
    expect(groups).toEqual([{ groupName: null, teams }]);
  });
});

describe("gamesWithinTeams", () => {
  it("keeps only games where both teams are in the given list", () => {
    const games = [
      { team_a_id: "a", team_b_id: "b" },
      { team_a_id: "a", team_b_id: "c" },
      { team_a_id: "b", team_b_id: "c" },
    ];
    const result = gamesWithinTeams(games, [{ id: "a" }, { id: "b" }]);
    expect(result).toEqual([{ team_a_id: "a", team_b_id: "b" }]);
  });
});
