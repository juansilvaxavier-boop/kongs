"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card } from "@/components/ui";
import { useToast } from "@/components/toast-provider";
import { computeElapsedSeconds, formatClock, type RachaClockStatus } from "@/lib/racha-clock";
import {
  endRachaSession,
  logRachaCard,
  logRachaGoal,
  pauseRachaClock,
  runRachaDraft,
  startRachaClock,
  undoLastRachaGoal,
} from "../actions";

type Player = { id: string; name: string; position: string | null; team_id: string | null };
type GoalEvent = { id: string; player_id: string };
type CardEvent = { id: string; player_id: string; card_type: string };

function ClockDisplay({
  status,
  startedAt,
  accumulatedSeconds,
}: {
  status: RachaClockStatus;
  startedAt: string | null;
  accumulatedSeconds: number;
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (status !== "rodando") return;
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, [status]);

  const elapsed = computeElapsedSeconds(status, startedAt, accumulatedSeconds, now);
  return (
    <p className="font-display text-4xl font-bold tabular-nums text-foreground">{formatClock(elapsed)}</p>
  );
}

function TeamColumn({
  championshipId,
  sessionId,
  teamName,
  teamPlayers,
  goalEvents,
  cardEvents,
  canLog,
}: {
  championshipId: string;
  sessionId: string;
  teamName: string;
  teamPlayers: Player[];
  goalEvents: GoalEvent[];
  cardEvents: CardEvent[];
  canLog: boolean;
}) {
  const toast = useToast();
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function withPending(playerId: string, fn: () => Promise<{ ok: boolean; error?: string }>) {
    setPendingId(playerId);
    const result = await fn();
    setPendingId(null);
    if (!result.ok) toast.error(result.error ?? "Erro ao salvar.");
    else router.refresh();
  }

  return (
    <Card className="p-4">
      <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-foreground">
        {teamName}
      </h3>
      {teamPlayers.length === 0 ? (
        <p className="text-sm text-muted">Nenhum jogador sorteado para este time.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {teamPlayers.map((player) => {
            const goals = goalEvents.filter((g) => g.player_id === player.id).length;
            const yellows = cardEvents.filter(
              (c) => c.player_id === player.id && c.card_type === "yellow"
            ).length;
            const reds = cardEvents.filter(
              (c) => c.player_id === player.id && c.card_type === "red"
            ).length;
            const busy = pendingId === player.id;
            return (
              <li key={player.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-2 text-foreground">
                  {player.name}
                  {goals > 0 && <Badge tone="success">{goals}⚽</Badge>}
                  {yellows > 0 && <Badge>{yellows}🟨</Badge>}
                  {reds > 0 && <Badge tone="warning">{reds}🟥</Badge>}
                </span>
                {canLog && (
                  <span className="flex gap-1">
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={busy}
                      onClick={() =>
                        withPending(player.id, () => logRachaGoal(championshipId, sessionId, player.id))
                      }
                    >
                      +Gol
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={busy || goals === 0}
                      onClick={() =>
                        withPending(player.id, () => undoLastRachaGoal(championshipId, sessionId, player.id))
                      }
                    >
                      -Gol
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={busy}
                      onClick={() =>
                        withPending(player.id, () => logRachaCard(championshipId, sessionId, player.id, "yellow"))
                      }
                    >
                      🟨
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      disabled={busy}
                      onClick={() =>
                        withPending(player.id, () => logRachaCard(championshipId, sessionId, player.id, "red"))
                      }
                    >
                      🟥
                    </Button>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

export function RachaSessionPanel({
  championshipId,
  sessionId,
  sessionStatus,
  clockStatus,
  clockStartedAt,
  clockAccumulatedSeconds,
  teamAId,
  teamAName,
  teamBId,
  teamBName,
  players,
  goalEvents,
  cardEvents,
  confirmedCount,
  scoreA,
  scoreB,
}: {
  championshipId: string;
  sessionId: string;
  sessionStatus: string;
  clockStatus: RachaClockStatus;
  clockStartedAt: string | null;
  clockAccumulatedSeconds: number;
  teamAId: string;
  teamAName: string;
  teamBId: string;
  teamBName: string;
  players: Player[];
  goalEvents: GoalEvent[];
  cardEvents: CardEvent[];
  confirmedCount: number;
  scoreA: number | null;
  scoreB: number | null;
}) {
  const toast = useToast();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function runWithPending(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setPending(true);
    const result = await fn();
    setPending(false);
    if (!result.ok) toast.error(result.error ?? "Erro ao salvar.");
    else router.refresh();
  }

  const draftDone = sessionStatus !== "agendado";
  const encerrado = sessionStatus === "encerrado";
  const teamAPlayers = players.filter((p) => p.team_id === teamAId);
  const teamBPlayers = players.filter((p) => p.team_id === teamBId);

  return (
    <div className="space-y-4">
      {!draftDone && (
        <Card className="p-5">
          <p className="mb-3 text-sm text-muted">
            {confirmedCount} jogador(es) confirmado(s) para esta sessão.
          </p>
          <Button
            type="button"
            disabled={pending || confirmedCount === 0}
            onClick={() => runWithPending(() => runRachaDraft(championshipId, sessionId))}
          >
            {pending ? "Sorteando…" : "Sortear times"}
          </Button>
        </Card>
      )}

      {draftDone && (
        <>
          <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-muted">Placar</p>
              <p className="font-display text-2xl font-bold text-foreground">
                {scoreA ?? 0} - {scoreB ?? 0}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-wide text-muted">Cronômetro</p>
              <ClockDisplay
                status={clockStatus}
                startedAt={clockStartedAt}
                accumulatedSeconds={clockAccumulatedSeconds}
              />
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={encerrado ? "success" : "warning"}>
                {encerrado ? "Encerrado" : "Em andamento"}
              </Badge>
              {!encerrado && clockStatus !== "rodando" && (
                <Button
                  type="button"
                  disabled={pending}
                  onClick={() => runWithPending(() => startRachaClock(championshipId, sessionId))}
                >
                  {clockStatus === "pausado" ? "Retomar" : "Iniciar"}
                </Button>
              )}
              {!encerrado && clockStatus === "rodando" && (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={pending}
                  onClick={() => runWithPending(() => pauseRachaClock(championshipId, sessionId))}
                >
                  Pausar
                </Button>
              )}
              {!encerrado && (
                <Button
                  type="button"
                  variant="danger"
                  disabled={pending}
                  onClick={() => runWithPending(() => endRachaSession(championshipId, sessionId))}
                >
                  Encerrar
                </Button>
              )}
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TeamColumn
              championshipId={championshipId}
              sessionId={sessionId}
              teamName={teamAName}
              teamPlayers={teamAPlayers}
              goalEvents={goalEvents}
              cardEvents={cardEvents}
              canLog={!encerrado}
            />
            <TeamColumn
              championshipId={championshipId}
              sessionId={sessionId}
              teamName={teamBName}
              teamPlayers={teamBPlayers}
              goalEvents={goalEvents}
              cardEvents={cardEvents}
              canLog={!encerrado}
            />
          </div>
        </>
      )}
    </div>
  );
}
