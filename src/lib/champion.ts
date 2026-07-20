import { buildBracketColumns } from "./bracket";
import { computeStandings } from "./standings";
import { gameWinnerId } from "./game-result";

type Team = { id: string; name: string; crest_url?: string | null };
type Game = {
  id: string;
  round: string;
  team_a_id: string;
  team_b_id: string;
  date: string | null;
  score_a: number | null;
  score_b: number | null;
  penalty_score_a?: number | null;
  penalty_score_b?: number | null;
  played: boolean;
};

/**
 * Decide se o campeonato já tem campeão definido, e quem é:
 * - com fase de mata-mata: o vencedor do jogo da última coluna do
 *   chaveamento (a final), só se essa coluna tiver um único jogo e
 *   ele já tiver sido realizado (usa pênaltis para desempatar).
 * - sem mata-mata (liga, tabela única): só quando todos os jogos já
 *   foram realizados, o 1º colocado da classificação.
 * Em qualquer outro caso (fase de grupos sem mata-mata, campeonato
 * ainda em andamento) retorna null — ainda não há campeão decidido.
 */
export function computeChampionTeamId(
  hasKnockoutStage: boolean,
  format: string,
  teams: Team[],
  games: Game[]
): string | null {
  if (teams.length === 0) return null;

  if (hasKnockoutStage) {
    const columns = buildBracketColumns(games);
    const finalColumn = columns[columns.length - 1];
    if (!finalColumn || finalColumn.games.length !== 1) return null;
    const finalGame = finalColumn.games[0];
    return gameWinnerId({
      teamAId: finalGame.team_a_id,
      teamBId: finalGame.team_b_id,
      scoreA: finalGame.score_a,
      scoreB: finalGame.score_b,
      penaltyScoreA: finalGame.penalty_score_a,
      penaltyScoreB: finalGame.penalty_score_b,
      played: finalGame.played,
    });
  }

  if (format === "liga") {
    if (games.length === 0) return null;
    if (!games.every((g) => g.played)) return null;
    return computeStandings(teams, games)[0]?.teamId ?? null;
  }

  return null;
}
