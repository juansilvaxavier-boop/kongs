export type Fixture = { round: number; teamAId: string; teamBId: string };

const BYE = Symbol("bye");

/**
 * Gera a tabela de jogos "todos contra todos" pelo método do círculo:
 * fixa o primeiro time e roda os demais a cada rodada. Com número ímpar
 * de times, um recebe "bye" (folga) por rodada e não entra em nenhum jogo.
 *
 * `rounds` define quantas vezes cada dupla de times se enfrenta: 1 = turno
 * único, 2 = ida e volta (mandos invertidos), 3+ = turnos adicionais,
 * alternando mando a cada turno.
 */
export function generateRoundRobin(teamIds: string[], rounds: number = 1): Fixture[] {
  if (teamIds.length < 2 || rounds < 1) return [];

  const slots: (string | typeof BYE)[] = [...teamIds];
  if (slots.length % 2 !== 0) slots.push(BYE);

  const n = slots.length;
  const half = n / 2;
  const roundsCount = n - 1;
  const singleLeg: Fixture[] = [];
  let arrangement = slots.slice();

  for (let round = 0; round < roundsCount; round++) {
    for (let i = 0; i < half; i++) {
      const home = arrangement[i];
      const away = arrangement[n - 1 - i];
      if (home === BYE || away === BYE) continue;

      const [teamAId, teamBId] = round % 2 === 0 ? [home, away] : [away, home];
      singleLeg.push({ round: round + 1, teamAId, teamBId });
    }

    const fixed = arrangement[0];
    const rest = arrangement.slice(1);
    rest.unshift(rest.pop()!);
    arrangement = [fixed, ...rest];
  }

  const fixtures: Fixture[] = [];
  for (let leg = 0; leg < rounds; leg++) {
    const swapped = leg % 2 === 1;
    for (const f of singleLeg) {
      fixtures.push({
        round: leg * roundsCount + f.round,
        teamAId: swapped ? f.teamBId : f.teamAId,
        teamBId: swapped ? f.teamAId : f.teamBId,
      });
    }
  }

  return fixtures;
}

/**
 * Quantas rodadas um turno único (uma volta) de todos contra todos ocupa
 * para determinado número de times: n-1 se par, n se ímpar (por causa do
 * bye rotativo).
 */
export function roundsPerCycle(teamCount: number): number {
  return teamCount % 2 === 0 ? teamCount - 1 : teamCount;
}

/**
 * Gera exatamente `totalRounds` rodadas de todos contra todos: repete
 * turnos completos quantas vezes forem necessárias e corta o excedente.
 * Quando `totalRounds` é menor que um turno completo, nem todo mundo chega
 * a se enfrentar; quando é maior, os confrontos se repetem (mandos
 * alternando a cada turno) até completar a quantidade pedida.
 */
export function generateRoundRobinForTotalRounds(
  teamIds: string[],
  totalRounds: number
): Fixture[] {
  if (teamIds.length < 2 || totalRounds < 1) return [];

  const cyclesNeeded = Math.ceil(totalRounds / roundsPerCycle(teamIds.length));
  return generateRoundRobin(teamIds, cyclesNeeded).filter(
    (f) => f.round <= totalRounds
  );
}
