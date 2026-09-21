type Team = { id: string; name: string; crest_url?: string | null };
type Game = {
  team_a_id: string;
  team_b_id: string;
  score_a: number | null;
  score_b: number | null;
  played: boolean;
};

export type StandingRow = {
  pos: number;
  teamId: string;
  teamName: string;
  teamCrestUrl: string | null;
  pts: number;
  j: number;
  v: number;
  e: number;
  d: number;
  gp: number;
  gc: number;
  sg: number;
};

export function computeStandings(teams: Team[], games: Game[]): StandingRow[] {
  const stats = new Map<
    string,
    Omit<StandingRow, "pos" | "teamId" | "teamName" | "teamCrestUrl">
  >();

  for (const team of teams) {
    stats.set(team.id, { pts: 0, j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, sg: 0 });
  }

  for (const game of games) {
    if (!game.played || game.score_a === null || game.score_b === null) continue;

    const a = stats.get(game.team_a_id);
    const b = stats.get(game.team_b_id);
    if (!a || !b) continue;

    a.j += 1;
    b.j += 1;
    a.gp += game.score_a;
    a.gc += game.score_b;
    b.gp += game.score_b;
    b.gc += game.score_a;

    if (game.score_a > game.score_b) {
      a.v += 1;
      a.pts += 3;
      b.d += 1;
    } else if (game.score_a < game.score_b) {
      b.v += 1;
      b.pts += 3;
      a.d += 1;
    } else {
      a.e += 1;
      b.e += 1;
      a.pts += 1;
      b.pts += 1;
    }

    a.sg = a.gp - a.gc;
    b.sg = b.gp - b.gc;
  }

  const rows = teams.map((team) => {
    const s = stats.get(team.id)!;
    return {
      teamId: team.id,
      teamName: team.name,
      teamCrestUrl: team.crest_url ?? null,
      ...s,
    };
  });

  rows.sort((x, y) => {
    if (y.pts !== x.pts) return y.pts - x.pts;
    if (y.sg !== x.sg) return y.sg - x.sg;
    if (y.gp !== x.gp) return y.gp - x.gp;
    return x.teamName.localeCompare(y.teamName, "pt-BR");
  });

  return rows.map((row, index) => ({ ...row, pos: index + 1 }));
}

/**
 * Total de cartões amarelos por time, considerando só os jogos em
 * `gameIds` (pra poder restringir por grupo, ou excluir o mata-mata,
 * do mesmo jeito que a classificação já faz para os placares).
 */
export function computeYellowCardCounts(
  cardEvents: { card_type: string; game_id: string; player_id: string }[],
  players: { id: string; team_id: string | null }[],
  gameIds: Set<string>
): Map<string, number> {
  const teamByPlayer = new Map(players.map((p) => [p.id, p.team_id]));
  const counts = new Map<string, number>();

  for (const event of cardEvents) {
    if (event.card_type !== "yellow" || !gameIds.has(event.game_id)) continue;
    const teamId = teamByPlayer.get(event.player_id);
    if (!teamId) continue;
    counts.set(teamId, (counts.get(teamId) ?? 0) + 1);
  }

  return counts;
}
