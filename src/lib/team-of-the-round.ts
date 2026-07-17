export type TeamOfRoundPosition = "Goleiro" | "Zagueiro" | "Meia" | "Atacante";

export type RoundOvrEntry = {
  playerId: string;
  position: string;
  delta: number;
};

export type TeamOfRoundSlot = {
  position: TeamOfRoundPosition;
  playerId: string;
  delta: number;
};

const FORMATION: Record<TeamOfRoundPosition, number> = {
  Goleiro: 1,
  Zagueiro: 2,
  Meia: 2,
  Atacante: 1,
};

/**
 * Monta o "Time da Rodada": 1 Goleiro, 2 Zagueiros, 2 Meias e 1 Atacante,
 * escolhidos pelo maior ΔOVR somado na rodada. Posições fora dessa
 * formação (Lateral, Volante) não entram, seguindo a especificação.
 * Jogadores sem posição reconhecida são ignorados.
 */
export function computeTeamOfTheRound(entries: RoundOvrEntry[]): TeamOfRoundSlot[] {
  const totals = new Map<string, { position: string; delta: number }>();
  for (const entry of entries) {
    const existing = totals.get(entry.playerId);
    if (existing) {
      existing.delta += entry.delta;
    } else {
      totals.set(entry.playerId, { position: entry.position, delta: entry.delta });
    }
  }

  const result: TeamOfRoundSlot[] = [];
  for (const position of Object.keys(FORMATION) as TeamOfRoundPosition[]) {
    const slots = FORMATION[position];
    const candidates = [...totals.entries()]
      .filter(([, value]) => value.position === position)
      .sort((a, b) => b[1].delta - a[1].delta)
      .slice(0, slots);

    for (const [playerId, value] of candidates) {
      result.push({ position, playerId, delta: value.delta });
    }
  }

  return result;
}
