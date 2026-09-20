import { naturalCompare } from "./datetime";

/** Rodadas da fase de grupos/liga terminam em "Rodada N" (com ou sem
 * prefixo de grupo, ex.: "Grupo A - Rodada 2"). Qualquer outro nome de
 * rodada (ex.: "Semifinal", "Lado A - Oitavas de Final") é mata-mata. */
const GROUP_ROUND_PATTERN = /Rodada \d+$/;
export function isKnockoutRound(round: string): boolean {
  return !GROUP_ROUND_PATTERN.test(round);
}

/** Convenção pra separar o mata-mata em dois lados que só se encontram
 * na final: rodadas prefixadas com "Lado A - "/"Lado B - " (ex.: "Lado A
 * - Oitavas de Final"). A final em si não tem prefixo de lado. */
const SIDE_PREFIXES = ["Lado A", "Lado B"] as const;
export type BracketSide = (typeof SIDE_PREFIXES)[number];

export function bracketSideOf(round: string): BracketSide | null {
  return SIDE_PREFIXES.find((side) => round.startsWith(`${side} - `)) ?? null;
}

export function stripBracketSide(round: string): string {
  const side = bracketSideOf(round);
  return side ? round.slice(`${side} - `.length) : round;
}

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
