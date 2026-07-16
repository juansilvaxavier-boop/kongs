export type Fixture = { round: number; teamAId: string; teamBId: string };

const BYE = Symbol("bye");

/**
 * Gera a tabela de jogos "todos contra todos" pelo método do círculo:
 * fixa o primeiro time e roda os demais a cada rodada. Com número ímpar
 * de times, um recebe "bye" (folga) por rodada e não entra em nenhum jogo.
 */
export function generateRoundRobin(
  teamIds: string[],
  doubleRound: boolean
): Fixture[] {
  if (teamIds.length < 2) return [];

  const slots: (string | typeof BYE)[] = [...teamIds];
  if (slots.length % 2 !== 0) slots.push(BYE);

  const n = slots.length;
  const half = n / 2;
  const roundsCount = n - 1;
  const fixtures: Fixture[] = [];
  let arrangement = slots.slice();

  for (let round = 0; round < roundsCount; round++) {
    for (let i = 0; i < half; i++) {
      const home = arrangement[i];
      const away = arrangement[n - 1 - i];
      if (home === BYE || away === BYE) continue;

      const [teamAId, teamBId] = round % 2 === 0 ? [home, away] : [away, home];
      fixtures.push({ round: round + 1, teamAId, teamBId });
    }

    const fixed = arrangement[0];
    const rest = arrangement.slice(1);
    rest.unshift(rest.pop()!);
    arrangement = [fixed, ...rest];
  }

  if (!doubleRound) return fixtures;

  const secondLeg = fixtures.map((f) => ({
    round: roundsCount + f.round,
    teamAId: f.teamBId,
    teamBId: f.teamAId,
  }));

  return [...fixtures, ...secondLeg];
}
