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

export type BolaoTopscorerPrediction = { userId: string; playerId: string; points: number };
export type BolaoChampionPrediction = { userId: string; teamId: string; points: number };
export type BolaoSinglePickStandingRow = { userId: string; points: number };

/**
 * `topScorerPlayerIds` traz os ids de todos os jogadores empatados na
 * artilharia (ou vazio/undefined se o campeonato ainda não terminou —
 * nesse caso ninguém pontua ainda). Empatar com qualquer um dos
 * líderes conta como acerto. Os pontos vêm de cada palpite (travados no
 * momento em que foram feitos/alterados — ver `computeBolaoPredictionTier`),
 * não de um valor fixo.
 */
export function computeTopscorerPredictionPoints(
  predictions: BolaoTopscorerPrediction[],
  topScorerPlayerIds: string[]
): BolaoSinglePickStandingRow[] {
  if (topScorerPlayerIds.length === 0) return [];
  const leaders = new Set(topScorerPlayerIds);

  return predictions
    .filter((p) => leaders.has(p.playerId))
    .map((p) => ({ userId: p.userId, points: p.points }))
    .sort((a, b) => b.points - a.points);
}

/** `championTeamId` é null enquanto o campeonato não tiver um campeão
 * decidido (ver `computeChampionTeamId`). */
export function computeChampionPredictionPoints(
  predictions: BolaoChampionPrediction[],
  championTeamId: string | null
): BolaoSinglePickStandingRow[] {
  if (!championTeamId) return [];

  return predictions
    .filter((p) => p.teamId === championTeamId)
    .map((p) => ({ userId: p.userId, points: p.points }))
    .sort((a, b) => b.points - a.points);
}

export type BolaoPredictionTier = 10 | 5 | 3;

const GROUP_ROUND_PATTERN = /Rodada \d+$/;

/**
 * Quanto vale um palpite de artilheiro/campeão feito (ou alterado) agora:
 * 10 pontos antes de qualquer jogo, 5 pontos já com a fase de grupos/liga
 * rolando, 3 pontos já com o mata-mata começado (só se o campeonato tiver
 * fase eliminatória — `hasKnockoutStage`). O valor é travado no momento do
 * palpite, não recalculado depois — por isso quem palpita cedo garante
 * mais pontos mesmo que só confirme o resultado bem mais tarde.
 *
 * Jogos da fase de grupos/liga são reconhecidos pelo nome da rodada
 * terminar em "Rodada N" (como o gerador automático de rodadas nomeia,
 * com ou sem prefixo de grupo — ex.: "Grupo A - Rodada 2"); qualquer outro
 * nome de rodada (ex.: "Semifinal", "Final") é considerado mata-mata.
 */
export function computeBolaoPredictionTier(
  hasKnockoutStage: boolean,
  games: { round: string; played: boolean }[]
): BolaoPredictionTier {
  const anyPlayed = games.some((g) => g.played);
  if (!anyPlayed) return 10;

  const knockoutStarted = games.some((g) => g.played && !GROUP_ROUND_PATTERN.test(g.round));
  if (hasKnockoutStage && knockoutStarted) return 3;

  return 5;
}
