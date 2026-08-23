export type DraftPlayer = { id: string; position: string | null; ovr: number };
export type BalancedTeams = { teamA: string[]; teamB: string[] };

/**
 * Sorteio balanceado por OVR: distribui primeiro os goleiros um pra cada
 * time (pra nenhum time ficar sem goleiro se tiver pelo menos dois), depois
 * o resto em ordem decrescente de OVR, sempre pro time com soma menor até
 * ali — um "draft" guloso, não uma combinatória ótima, mas suficiente pra
 * equilibrar um racha.
 */
export function computeBalancedTeams(players: DraftPlayer[]): BalancedTeams {
  const goalkeepers = players.filter((p) => p.position === "Goleiro");
  const others = [...players.filter((p) => p.position !== "Goleiro")].sort(
    (a, b) => b.ovr - a.ovr
  );

  const teamA: string[] = [];
  const teamB: string[] = [];
  let sumA = 0;
  let sumB = 0;

  for (let i = 0; i < goalkeepers.length; i++) {
    const player = goalkeepers[i];
    if (i % 2 === 0) {
      teamA.push(player.id);
      sumA += player.ovr;
    } else {
      teamB.push(player.id);
      sumB += player.ovr;
    }
  }

  for (const player of others) {
    if (sumA <= sumB) {
      teamA.push(player.id);
      sumA += player.ovr;
    } else {
      teamB.push(player.id);
      sumB += player.ovr;
    }
  }

  return { teamA, teamB };
}
