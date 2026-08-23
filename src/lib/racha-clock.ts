export type RachaClockStatus = "parado" | "rodando" | "pausado";

/**
 * Tempo decorrido do cronômetro é sempre calculado, nunca guardado
 * segundo a segundo — evita qualquer escrita/polling constante. Enquanto
 * "rodando", soma o que já tinha acumulado com o tempo desde que foi
 * iniciado; parado ou pausado, é só o acumulado.
 */
export function computeElapsedSeconds(
  status: RachaClockStatus,
  startedAt: string | null,
  accumulatedSeconds: number,
  now: Date = new Date()
): number {
  if (status !== "rodando" || !startedAt) return accumulatedSeconds;

  const elapsedSinceStart = Math.max(0, (now.getTime() - new Date(startedAt).getTime()) / 1000);
  return accumulatedSeconds + Math.floor(elapsedSinceStart);
}

export function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}
