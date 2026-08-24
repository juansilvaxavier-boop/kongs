"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, Button, Card, Input, Select } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { useDeleteAction } from "@/components/use-delete-action";
import { useToast } from "@/components/toast-provider";
import { SumulaPdfButton } from "@/components/sumula-pdf-button";
import { PreSumulaPanel, type CaptainSignature } from "@/components/pre-sumula-panel";
import { PenaltyShootoutPanel } from "@/components/penalty-shootout-panel";
import {
  createCardEvent,
  createGoalEvent,
  deleteCardEvent,
  deleteGoalEvent,
} from "./events-actions";
import { setGamePenaltyScore, setGamePlayed, setGameWalkover } from "./actions";
import { setShirtNumber, signCaptain, toggleLineupPlayer } from "./lineup-actions";

type Player = { id: string; name: string; team_id: string | null; number: number | null };
type GoalEvent = { id: string; player_id: string; minute: number | null; game_id: string };
type CardEvent = {
  id: string;
  player_id: string;
  card_type: string;
  minute: number | null;
  game_id: string;
};

function TeamSumulaColumn({
  teamName,
  teamPlayers,
  allPlayers,
  shirtNumberEdits,
  gameId,
  championshipId,
  goalEvents,
  cardEvents,
}: {
  teamName: string;
  teamPlayers: Player[];
  allPlayers: Player[];
  shirtNumberEdits: Record<string, string>;
  gameId: string;
  championshipId: string;
  goalEvents: GoalEvent[];
  cardEvents: CardEvent[];
}) {
  const playerIds = new Set(teamPlayers.map((p) => p.id));
  const teamGoals = goalEvents.filter((g) => playerIds.has(g.player_id));
  const teamCards = cardEvents.filter((c) => playerIds.has(c.player_id));
  const playerLabel = (player: Player) => {
    const shirtNumber = shirtNumberEdits[player.id]?.trim();
    return shirtNumber ? `${shirtNumber} ${player.name}` : player.name;
  };
  const playerName = (id: string) => {
    const player = allPlayers.find((p) => p.id === id);
    return player ? playerLabel(player) : "?";
  };
  const runDelete = useDeleteAction();

  return (
    <Card className="p-3">
      <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-foreground">
        {teamName}
      </h3>

      {teamPlayers.length === 0 ? (
        <p className="text-sm text-muted">Cadastre jogadores neste time para lançar gols e cartões.</p>
      ) : (
        <>
          <div className="mb-4">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Gols</h4>
            <ul className="mb-2 space-y-1">
              {teamGoals.map((goal) => (
                <li key={goal.id} className="flex items-center justify-between text-sm text-foreground">
                  <span>
                    {playerName(goal.player_id)}
                    {goal.minute !== null ? ` (${goal.minute}')` : ""}
                  </span>
                  <button
                    type="button"
                    className="text-xs text-muted underline hover:text-danger"
                    onClick={() => runDelete(() => deleteGoalEvent(goal.id, championshipId, gameId))}
                  >
                    remover
                  </button>
                </li>
              ))}
              {teamGoals.length === 0 && <li className="text-sm text-muted">Nenhum gol lançado.</li>}
            </ul>
            <ActionForm
              action={(formData) => createGoalEvent(gameId, championshipId, formData)}
              className="flex flex-wrap items-center gap-2"
            >
              <Select name="player_id" required defaultValue="" className="max-w-[9rem]">
                <option value="" disabled>
                  Jogador
                </option>
                {teamPlayers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {playerLabel(p)}
                  </option>
                ))}
              </Select>
              <Input name="minute" type="number" min={0} placeholder="Min." className="max-w-[4rem]" />
              <SubmitButton variant="secondary" pendingText="Adicionando…">
                + Gol
              </SubmitButton>
            </ActionForm>
          </div>

          <div>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Cartões</h4>
            <ul className="mb-2 space-y-1">
              {teamCards.map((card) => (
                <li key={card.id} className="flex items-center justify-between text-sm text-foreground">
                  <span className="flex items-center gap-2">
                    {playerName(card.player_id)}
                    <Badge tone={card.card_type === "red" ? "warning" : "default"}>
                      {card.card_type === "red" ? "Vermelho" : "Amarelo"}
                    </Badge>
                    {card.minute !== null ? `${card.minute}'` : ""}
                  </span>
                  <button
                    type="button"
                    className="text-xs text-muted underline hover:text-danger"
                    onClick={() => runDelete(() => deleteCardEvent(card.id, championshipId, gameId))}
                  >
                    remover
                  </button>
                </li>
              ))}
              {teamCards.length === 0 && <li className="text-sm text-muted">Nenhum cartão lançado.</li>}
            </ul>
            <ActionForm
              action={(formData) => createCardEvent(gameId, championshipId, formData)}
              className="flex flex-wrap items-center gap-2"
            >
              <Select name="player_id" required defaultValue="" className="max-w-[9rem]">
                <option value="" disabled>
                  Jogador
                </option>
                {teamPlayers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {playerLabel(p)}
                  </option>
                ))}
              </Select>
              <Select name="card_type" required defaultValue="" className="max-w-[7rem]">
                <option value="" disabled>
                  Cartão
                </option>
                <option value="yellow">Amarelo</option>
                <option value="red">Vermelho</option>
              </Select>
              <Input name="minute" type="number" min={0} placeholder="Min." className="max-w-[4rem]" />
              <SubmitButton variant="secondary" pendingText="Adicionando…">
                + Cartão
              </SubmitButton>
            </ActionForm>
          </div>
        </>
      )}
    </Card>
  );
}

export function SumulaPanel({
  gameId,
  championshipId,
  round,
  teamAId,
  teamAName,
  teamBId,
  teamBName,
  scoreA,
  scoreB,
  penaltyScoreA,
  penaltyScoreB,
  walkoverTeamId,
  played,
  players,
  goalEvents,
  cardEvents,
  confirmedPlayerIds,
  shirtNumbers,
  signatures,
}: {
  gameId: string;
  championshipId: string;
  round?: string;
  teamAId: string;
  teamAName: string;
  teamBId: string;
  teamBName: string;
  scoreA: number | null;
  scoreB: number | null;
  penaltyScoreA: number | null;
  penaltyScoreB: number | null;
  walkoverTeamId: string | null;
  played: boolean;
  players: Player[];
  goalEvents: GoalEvent[];
  cardEvents: CardEvent[];
  confirmedPlayerIds: Set<string>;
  shirtNumbers: Record<string, number>;
  signatures: Record<string, CaptainSignature>;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingSumula, setSavingSumula] = useState(false);
  const [shirtNumberEdits, setShirtNumberEdits] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      players.map((p) => [p.id, (shirtNumbers[p.id] ?? p.number ?? "").toString()])
    )
  );
  const toast = useToast();
  const router = useRouter();
  const teamAPlayers = players.filter((p) => p.team_id === teamAId);
  const teamBPlayers = players.filter((p) => p.team_id === teamBId);
  const gameGoals = goalEvents.filter((g) => g.game_id === gameId);
  const gameCards = cardEvents.filter((c) => c.game_id === gameId);

  async function togglePlayed() {
    setPending(true);
    setError(null);
    const result = await setGamePlayed(gameId, championshipId, !played);
    if (!result.ok) setError(result.error);
    setPending(false);
  }

  async function handleWalkoverChange(teamId: string) {
    setPending(true);
    setError(null);
    const result = await setGameWalkover(gameId, championshipId, teamId || null);
    if (!result.ok) setError(result.error);
    setPending(false);
  }

  async function saveSumula() {
    setSavingSumula(true);
    try {
      const results = await Promise.all(
        players.map((player) => {
          const raw = shirtNumberEdits[player.id] ?? "";
          const parsed = raw.trim() === "" ? null : Number(raw);
          return setShirtNumber(
            gameId,
            championshipId,
            player.id,
            parsed !== null && Number.isFinite(parsed) ? parsed : null
          );
        })
      );
      const failed = results.find((r) => !r.ok);
      if (failed && !failed.ok) {
        toast.error(failed.error);
      } else {
        toast.success("Súmula salva.");
        router.refresh();
      }
    } catch {
      toast.error("Não foi possível salvar a súmula. Atualize a página (F5) e tente novamente.");
    } finally {
      setSavingSumula(false);
    }
  }

  return (
    <div>
      <PreSumulaPanel
        teamAId={teamAId}
        teamAName={teamAName}
        teamBId={teamBId}
        teamBName={teamBName}
        players={players}
        confirmedPlayerIds={confirmedPlayerIds}
        shirtNumberEdits={shirtNumberEdits}
        onShirtNumberChange={(playerId, value) =>
          setShirtNumberEdits((prev) => ({ ...prev, [playerId]: value }))
        }
        signatures={signatures}
        onToggleLineup={(playerId, confirmed) =>
          toggleLineupPlayer(gameId, championshipId, playerId, confirmed)
        }
        onSignCaptain={(teamId, captainName, signatureDataUrl) =>
          signCaptain(gameId, championshipId, teamId, captainName, signatureDataUrl)
        }
      />

      {played && scoreA !== null && scoreB !== null && scoreA === scoreB && (
        <PenaltyShootoutPanel
          teamAName={teamAName}
          teamBName={teamBName}
          penaltyScoreA={penaltyScoreA}
          penaltyScoreB={penaltyScoreB}
          onSave={(a, b) => setGamePenaltyScore(gameId, championshipId, a, b)}
        />
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface-2/40 p-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted">
            {walkoverTeamId ? "Placar (vitória por W.O.)" : "Placar (gerado pelos gols lançados)"}
          </p>
          <p className="font-display text-2xl font-bold text-foreground">
            {scoreA ?? 0} - {scoreB ?? 0}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={played ? "success" : "warning"}>{played ? "Realizado" : "Agendado"}</Badge>
          {walkoverTeamId && <Badge tone="warning">W.O.</Badge>}
          <Select
            value={walkoverTeamId ?? ""}
            onChange={(event) => handleWalkoverChange(event.target.value)}
            disabled={pending}
            className="w-auto"
          >
            <option value="">Sem W.O.</option>
            <option value={teamAId}>W.O. — vitória do {teamAName}</option>
            <option value={teamBId}>W.O. — vitória do {teamBName}</option>
          </Select>
          <Button type="button" variant="secondary" onClick={saveSumula} disabled={savingSumula}>
            {savingSumula ? "Salvando…" : "Salvar súmula"}
          </Button>
          <Button type="button" variant="secondary" onClick={togglePlayed} disabled={pending}>
            {pending ? "Salvando…" : played ? "Reabrir jogo" : "Marcar como realizado"}
          </Button>
          <SumulaPdfButton
            round={round}
            teamAName={teamAName}
            teamBName={teamBName}
            scoreA={scoreA}
            scoreB={scoreB}
            teamAPlayers={teamAPlayers.filter((p) => confirmedPlayerIds.has(p.id))}
            teamBPlayers={teamBPlayers.filter((p) => confirmedPlayerIds.has(p.id))}
            goalEvents={gameGoals}
            cardEvents={gameCards}
          />
        </div>
      </div>
      {error && <p className="mb-3 text-sm text-danger">{error}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TeamSumulaColumn
          teamName={teamAName}
          teamPlayers={teamAPlayers}
          allPlayers={players}
          shirtNumberEdits={shirtNumberEdits}
          gameId={gameId}
          championshipId={championshipId}
          goalEvents={gameGoals}
          cardEvents={gameCards}
        />
        <TeamSumulaColumn
          teamName={teamBName}
          teamPlayers={teamBPlayers}
          allPlayers={players}
          shirtNumberEdits={shirtNumberEdits}
          gameId={gameId}
          championshipId={championshipId}
          goalEvents={gameGoals}
          cardEvents={gameCards}
        />
      </div>
    </div>
  );
}
