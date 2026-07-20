type Team = { id: string; name: string; crest_url?: string | null };
type Game = {
  team_a_id: string;
  team_b_id: string;
  score_a: number | null;
  score_b: number | null;
  played: boolean;
  orderKey: string;
};

export type TeamStreaks = {
  teamId: string;
  teamName: string;
  teamCrestUrl: string | null;
  winStreak: number;
  unbeatenStreak: number;
  cleanSheetStreak: number;
  scoringDroughtStreak: number;
};

function trailingStreak<T>(items: T[], matches: (item: T) => boolean): number {
  let streak = 0;
  for (let i = items.length - 1; i >= 0; i--) {
    if (!matches(items[i])) break;
    streak += 1;
  }
  return streak;
}

export function computeStreaks(teams: Team[], games: Game[]): TeamStreaks[] {
  const playedGames = games
    .filter((g) => g.played && g.score_a !== null && g.score_b !== null)
    .slice()
    .sort((a, b) => a.orderKey.localeCompare(b.orderKey));

  return teams.map((team) => {
    const results = playedGames
      .filter((g) => g.team_a_id === team.id || g.team_b_id === team.id)
      .map((g) => {
        const isA = g.team_a_id === team.id;
        return {
          gf: (isA ? g.score_a : g.score_b)!,
          ga: (isA ? g.score_b : g.score_a)!,
        };
      });

    return {
      teamId: team.id,
      teamName: team.name,
      teamCrestUrl: team.crest_url ?? null,
      winStreak: trailingStreak(results, (r) => r.gf > r.ga),
      unbeatenStreak: trailingStreak(results, (r) => r.gf >= r.ga),
      cleanSheetStreak: trailingStreak(results, (r) => r.ga === 0),
      scoringDroughtStreak: trailingStreak(results, (r) => r.gf === 0),
    };
  });
}
