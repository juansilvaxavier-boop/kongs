export type OvrHistoryEntry = {
  round: string | null;
  delta: number;
  created_at: string;
};

export type OvrPoint = {
  label: string;
  ovr: number;
};

export function computeOvrEvolution(
  history: OvrHistoryEntry[],
  currentOvr: number
): OvrPoint[] {
  if (history.length === 0) return [];

  const chronological = [...history].sort((a, b) =>
    a.created_at.localeCompare(b.created_at)
  );
  const totalDelta = chronological.reduce((sum, entry) => sum + entry.delta, 0);
  const baseline = currentOvr - totalDelta;

  const roundDeltas = new Map<string, number>();
  const roundOrder: string[] = [];
  for (const entry of chronological) {
    const label = entry.round ?? "—";
    if (!roundDeltas.has(label)) {
      roundDeltas.set(label, 0);
      roundOrder.push(label);
    }
    roundDeltas.set(label, roundDeltas.get(label)! + entry.delta);
  }

  let running = baseline;
  const points: OvrPoint[] = [{ label: "Início", ovr: Math.round(baseline * 100) / 100 }];
  for (const label of roundOrder) {
    running += roundDeltas.get(label)!;
    points.push({ label, ovr: Math.round(running * 100) / 100 });
  }
  return points;
}
