export type BolaoPrediction = {
  userId: string;
  gameId: string;
  predictedScoreA: number;
  predictedScoreB: number;
};

export type BolaoPlayedGame = {
  id: string;
  scoreA: number;
  scoreB: number;
};

export type BolaoStandingRow = {
  userId: string;
  points: number;
  exactCount: number;
  correctCount: number;
};

export function computeBolaoStandings(
  predictions: BolaoPrediction[],
  games: BolaoPlayedGame[]
): BolaoStandingRow[] {
  const gameById = new Map(games.map((g) => [g.id, g]));
  const totals = new Map<string, { points: number; exact: number; correct: number }>();

  for (const prediction of predictions) {
    const game = gameById.get(prediction.gameId);
    if (!game) continue;

    const entry = totals.get(prediction.userId) ?? { points: 0, exact: 0, correct: 0 };
    const exact =
      prediction.predictedScoreA === game.scoreA && prediction.predictedScoreB === game.scoreB;
    const actualOutcome = Math.sign(game.scoreA - game.scoreB);
    const predictedOutcome = Math.sign(prediction.predictedScoreA - prediction.predictedScoreB);

    if (exact) {
      entry.points += 3;
      entry.exact += 1;
    } else if (actualOutcome === predictedOutcome) {
      entry.points += 1;
      entry.correct += 1;
    }
    totals.set(prediction.userId, entry);
  }

  return [...totals.entries()]
    .map(([userId, t]) => ({
      userId,
      points: t.points,
      exactCount: t.exact,
      correctCount: t.correct,
    }))
    .sort((a, b) => b.points - a.points || b.exactCount - a.exactCount);
}

const GROUP_POSITION_POINTS = 5;

export type BolaoGroupPrediction = {
  userId: string;
  groupName: string | null;
  position: number;
  teamId: string;
};

/** Classificação final de um grupo já encerrado (todos os jogos entre os
 * times do grupo já foram realizados): `order` traz os ids dos times na
 * ordem final, do 1º colocado ao último. */
export type FinishedGroupStanding = {
  groupName: string | null;
  order: string[];
};

export type BolaoGroupStandingRow = {
  userId: string;
  points: number;
  exactCount: number;
};

export function computeGroupPredictionPoints(
  predictions: BolaoGroupPrediction[],
  finishedGroups: FinishedGroupStanding[]
): BolaoGroupStandingRow[] {
  const orderByGroup = new Map(finishedGroups.map((g) => [g.groupName ?? "", g.order]));
  const totals = new Map<string, { points: number; exact: number }>();

  for (const prediction of predictions) {
    const order = orderByGroup.get(prediction.groupName ?? "");
    if (!order) continue;

    const actualTeamId = order[prediction.position - 1];
    if (actualTeamId === undefined) continue;

    const entry = totals.get(prediction.userId) ?? { points: 0, exact: 0 };
    if (actualTeamId === prediction.teamId) {
      entry.points += GROUP_POSITION_POINTS;
      entry.exact += 1;
    }
    totals.set(prediction.userId, entry);
  }

  return [...totals.entries()]
    .map(([userId, t]) => ({ userId, points: t.points, exactCount: t.exact }))
    .sort((a, b) => b.points - a.points);
}
