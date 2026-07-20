export type GameResult = {
  teamAId: string;
  teamBId: string;
  scoreA: number | null;
  scoreB: number | null;
  penaltyScoreA?: number | null;
  penaltyScoreB?: number | null;
  played: boolean;
};

/**
 * Retorna o id do time vencedor do jogo, ou null se o jogo ainda não
 * aconteceu ou terminou empatado sem disputa de pênaltis registrada
 * (empate de fato, em campeonatos que não usam mata-mata).
 */
export function gameWinnerId(game: GameResult): string | null {
  if (!game.played || game.scoreA === null || game.scoreB === null) return null;

  if (game.scoreA > game.scoreB) return game.teamAId;
  if (game.scoreB > game.scoreA) return game.teamBId;

  if (
    game.penaltyScoreA !== null &&
    game.penaltyScoreA !== undefined &&
    game.penaltyScoreB !== null &&
    game.penaltyScoreB !== undefined &&
    game.penaltyScoreA !== game.penaltyScoreB
  ) {
    return game.penaltyScoreA > game.penaltyScoreB ? game.teamAId : game.teamBId;
  }

  return null;
}
