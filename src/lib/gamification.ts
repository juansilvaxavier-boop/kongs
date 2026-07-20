export type Position = "Goleiro" | "Zagueiro" | "Meia" | "Atacante";
export type Rarity = "bronze" | "prata" | "ouro" | "legend";

export const OVR_WEIGHTS = {
  gol: 0.3,
  vitoria: 0.2,
  amarelo: 0.15,
  vermelho: 0.5,
  impactoZagueiro: 0.15,
  impactoGoleiro: 0.25,
  constanteGols: 3.5,
};

export type PlayerGameStats = {
  goals: number;
  won: boolean;
  yellowCards: number;
  redCards: number;
  goalsConceded: number;
  position: Position;
};

export type OvrLedgerEntry = {
  reason: string;
  delta: number;
};

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Gera os lançamentos de evolução de OVR de um jogador para uma partida,
 * um item por motivo (gol, vitória, cartões, impacto defensivo), seguindo
 * os pesos e fórmulas do sistema de gamificação. Zagueiros e goleiros têm
 * um termo extra ligado aos gols sofridos pelo time; atacantes e meias
 * seguem apenas a fórmula base.
 */
export function computeOvrLedger(stats: PlayerGameStats): OvrLedgerEntry[] {
  const entries: OvrLedgerEntry[] = [];

  if (stats.goals > 0) {
    entries.push({
      reason: stats.goals === 1 ? "1 gol" : `${stats.goals} gols`,
      delta: round2(stats.goals * OVR_WEIGHTS.gol),
    });
  }

  if (stats.won) {
    entries.push({ reason: "Vitória", delta: OVR_WEIGHTS.vitoria });
  }

  if (stats.yellowCards > 0) {
    entries.push({
      reason: stats.yellowCards === 1 ? "Cartão amarelo" : `${stats.yellowCards} cartões amarelos`,
      delta: round2(-stats.yellowCards * OVR_WEIGHTS.amarelo),
    });
  }

  if (stats.redCards > 0) {
    entries.push({
      reason: stats.redCards === 1 ? "Cartão vermelho" : `${stats.redCards} cartões vermelhos`,
      delta: round2(-stats.redCards * OVR_WEIGHTS.vermelho),
    });
  }

  if (stats.position === "Zagueiro" || stats.position === "Goleiro") {
    const weight =
      stats.position === "Zagueiro" ? OVR_WEIGHTS.impactoZagueiro : OVR_WEIGHTS.impactoGoleiro;
    const impact = round2((OVR_WEIGHTS.constanteGols - stats.goalsConceded) * weight);
    if (impact !== 0) {
      entries.push({
        reason: `Impacto defensivo (${stats.goalsConceded} gols sofridos)`,
        delta: impact,
      });
    }
  }

  return entries;
}

export function sumLedger(entries: OvrLedgerEntry[]): number {
  return round2(entries.reduce((sum, entry) => sum + entry.delta, 0));
}

export function computeRarity(ovr: number): Rarity {
  if (ovr >= 96) return "legend";
  if (ovr >= 80) return "ouro";
  if (ovr >= 70) return "prata";
  return "bronze";
}

export function clampAttribute(value: number): number {
  return round2(Math.max(0, Math.min(99, value)));
}
