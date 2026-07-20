import { naturalCompare } from "./datetime";

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

export type BracketColumn = {
  round: string;
  games: Game[];
};

/**
 * Agrupa os jogos por rodada/fase em colunas, ordenadas pela data mais cedo
 * de cada rodada (fases mais recentes, sem data, ficam por último via ordem
 * natural do nome). Não faz avanço automático de vencedor — é só visual.
 */
export function buildBracketColumns(games: Game[]): BracketColumn[] {
  const byRound = new Map<string, Game[]>();
  for (const game of games) {
    if (!byRound.has(game.round)) byRound.set(game.round, []);
    byRound.get(game.round)!.push(game);
  }

  const columns = [...byRound.entries()].map(([round, roundGames]) => {
    const dates = roundGames
      .map((g) => g.date)
      .filter((d): d is string => Boolean(d))
      .sort();
    return { round, games: roundGames, earliestDate: dates[0] ?? null };
  });

  columns.sort((a, b) => {
    if (a.earliestDate && b.earliestDate) {
      return a.earliestDate < b.earliestDate ? -1 : 1;
    }
    if (a.earliestDate) return -1;
    if (b.earliestDate) return 1;
    return naturalCompare(a.round, b.round);
  });

  return columns.map(({ round, games: roundGames }) => ({ round, games: roundGames }));
}
