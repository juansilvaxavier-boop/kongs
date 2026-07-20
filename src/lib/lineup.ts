export type LineupPlayer = {
  id: string;
  name: string;
  position: string | null;
  number: number | null;
  photoUrl: string | null;
  ovr: number;
};

export type Formation = "1-2-2-1" | "1-2-1-2";

export type AutoLineup = {
  formation: Formation;
  starters: {
    Goleiro: LineupPlayer[];
    Zagueiro: LineupPlayer[];
    Meia: LineupPlayer[];
    Atacante: LineupPlayer[];
  };
  bench: LineupPlayer[];
};

function byPosition(players: LineupPlayer[], position: string) {
  return players.filter((p) => p.position === position);
}

function topN(players: LineupPlayer[], n: number) {
  return [...players].sort((a, b) => b.ovr - a.ovr).slice(0, n);
}

function sumOvr(players: LineupPlayer[]) {
  return players.reduce((sum, p) => sum + p.ovr, 0);
}

/**
 * Monta a escalação automática de um time por overall: 1 Goleiro + 2
 * Zagueiros sempre, e a dupla Meia/Atacante escolhida entre 2 Meias + 1
 * Atacante ou 1 Meia + 2 Atacantes — o que tiver a soma de overall maior
 * entra. Quem sobra vira reserva (banco).
 */
export function computeAutoLineup(players: LineupPlayer[]): AutoLineup {
  const goleiros = topN(byPosition(players, "Goleiro"), 1);
  const zagueiros = topN(byPosition(players, "Zagueiro"), 2);
  const meias = byPosition(players, "Meia");
  const atacantes = byPosition(players, "Atacante");

  const optionA = { meias: topN(meias, 2), atacantes: topN(atacantes, 1) };
  const optionB = { meias: topN(meias, 1), atacantes: topN(atacantes, 2) };
  const totalA = sumOvr(optionA.meias) + sumOvr(optionA.atacantes);
  const totalB = sumOvr(optionB.meias) + sumOvr(optionB.atacantes);

  const useOptionA = totalA >= totalB;
  const chosen = useOptionA ? optionA : optionB;

  const starterIds = new Set(
    [...goleiros, ...zagueiros, ...chosen.meias, ...chosen.atacantes].map((p) => p.id)
  );
  const bench = players.filter((p) => !starterIds.has(p.id)).sort((a, b) => b.ovr - a.ovr);

  return {
    formation: useOptionA ? "1-2-2-1" : "1-2-1-2",
    starters: {
      Goleiro: goleiros,
      Zagueiro: zagueiros,
      Meia: chosen.meias,
      Atacante: chosen.atacantes,
    },
    bench,
  };
}
