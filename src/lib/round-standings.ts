import { naturalCompare } from "./datetime";
import { computeStandings } from "./standings";

type Team = { id: string; name: string; crest_url?: string | null };
type Game = {
  team_a_id: string;
  team_b_id: string;
  score_a: number | null;
  score_b: number | null;
  played: boolean;
  round: string;
};

export type RoundStandingSnapshot = {
  round: string;
  positionByTeamId: Record<string, number>;
};

/**
 * Recalcula a classificação de forma cumulativa, rodada a rodada, na
 * ordem natural dos nomes de rodada (Rodada 1, Rodada 2, ...). Só gera
 * uma "foto" (snapshot) para rodadas que já tiveram pelo menos um jogo
 * realizado, para não poluir com rodadas futuras vazias.
 */
export function computeStandingsByRound(teams: Team[], games: Game[]): RoundStandingSnapshot[] {
  const rounds = [...new Set(games.map((g) => g.round))].sort(naturalCompare);
  const snapshots: RoundStandingSnapshot[] = [];
  let cumulativePlayedGames: Game[] = [];

  for (const round of rounds) {
    const roundGames = games.filter((g) => g.round === round && g.played);
    if (roundGames.length === 0) continue;

    cumulativePlayedGames = [...cumulativePlayedGames, ...roundGames];
    const standings = computeStandings(teams, cumulativePlayedGames);
    const positionByTeamId: Record<string, number> = {};
    for (const row of standings) positionByTeamId[row.teamId] = row.pos;
    snapshots.push({ round, positionByTeamId });
  }

  return snapshots;
}
