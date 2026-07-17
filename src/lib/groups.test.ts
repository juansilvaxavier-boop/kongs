import { describe, expect, it } from "vitest";
import {
  assignTeamsToGroups,
  gamesWithinTeams,
  generateGroupLabels,
  groupTeams,
  groupTeamsByFormat,
  shuffle,
} from "./groups";

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

describe("generateGroupLabels", () => {
  it("generates lettered group labels", () => {
    expect(generateGroupLabels(3)).toEqual(["Grupo A", "Grupo B", "Grupo C"]);
  });

  it("falls back to numbers past the alphabet", () => {
    const labels = generateGroupLabels(27);
    expect(labels[25]).toBe("Grupo Z");
    expect(labels[26]).toBe("Grupo 27");
  });
});

describe("shuffle", () => {
  it("returns a permutation with the same elements", () => {
    const items = ["a", "b", "c", "d", "e"];
    const result = shuffle(items);
    expect(result).toHaveLength(items.length);
    expect([...result].sort()).toEqual([...items].sort());
  });

  it("does not mutate the original array", () => {
    const items = ["a", "b", "c"];
    shuffle(items);
    expect(items).toEqual(["a", "b", "c"]);
  });

  it("is deterministic given a fixed rng", () => {
    const rng = () => 0;
    expect(shuffle(["a", "b", "c"], rng)).toEqual(["b", "c", "a"]);
  });
});

describe("assignTeamsToGroups", () => {
  it("distributes teams round-robin across the given group count", () => {
    const teamIds = ["1", "2", "3", "4", "5"];
    const assignment = assignTeamsToGroups(teamIds, 2);
    expect(assignment.get("1")).toBe("Grupo A");
    expect(assignment.get("2")).toBe("Grupo B");
    expect(assignment.get("3")).toBe("Grupo A");
    expect(assignment.get("4")).toBe("Grupo B");
    expect(assignment.get("5")).toBe("Grupo A");
  });

  it("assigns every team a group", () => {
    const teamIds = ["1", "2", "3", "4", "5", "6"];
    const assignment = assignTeamsToGroups(teamIds, 3);
    expect(assignment.size).toBe(teamIds.length);
    for (const teamId of teamIds) {
      expect(assignment.has(teamId)).toBe(true);
    }
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
