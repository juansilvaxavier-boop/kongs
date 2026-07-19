"use client";

import { useState } from "react";
import { Badge, Button, Card, Input, Select } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { SumulaPdfButton } from "@/components/sumula-pdf-button";
import {
  createCardEvent,
  createGoalEvent,
  deleteCardEvent,
  deleteGoalEvent,
} from "./events-actions";
import { setGamePlayed } from "./actions";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível concluir a ação.";
}

type Player = { id: string; name: string; team_id: string | null };
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
  gameId,
  championshipId,
  goalEvents,
  cardEvents,
}: {
  teamName: string;
  teamPlayers: Player[];
  allPlayers: Player[];
  gameId: string;
  championshipId: string;
  goalEvents: GoalEvent[];
  cardEvents: CardEvent[];
}) {
  const playerIds = new Set(teamPlayers.map((p) => p.id));
  const teamGoals = goalEvents.filter((g) => playerIds.has(g.player_id));
  const teamCards = cardEvents.filter((c) => playerIds.has(c.player_id));
  const playerName = (id: string) => allPlayers.find((p) => p.id === id)?.name ?? "?";

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
                    onClick={async () => {
                      try {
                        await deleteGoalEvent(goal.id, championshipId, gameId);
                      } catch (error) {
                        alert(errorMessage(error));
                      }
                    }}
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
                    {p.name}
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
                    onClick={async () => {
                      try {
                        await deleteCardEvent(card.id, championshipId, gameId);
                      } catch (error) {
                        alert(errorMessage(error));
                      }
                    }}
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
                    {p.name}
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
  played,
  players,
  goalEvents,
  cardEvents,
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
  played: boolean;
  players: Player[];
  goalEvents: GoalEvent[];
  cardEvents: CardEvent[];
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const teamAPlayers = players.filter((p) => p.team_id === teamAId);
  const teamBPlayers = players.filter((p) => p.team_id === teamBId);
  const gameGoals = goalEvents.filter((g) => g.game_id === gameId);
  const gameCards = cardEvents.filter((c) => c.game_id === gameId);

  async function togglePlayed() {
    setPending(true);
    setError(null);
    try {
      await setGamePlayed(gameId, championshipId, !played);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface-2/40 p-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Placar (gerado pelos gols lançados)</p>
          <p className="font-display text-2xl font-bold text-foreground">
            {scoreA ?? 0} - {scoreB ?? 0}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={played ? "success" : "warning"}>{played ? "Realizado" : "Agendado"}</Badge>
          <Button type="button" variant="secondary" onClick={togglePlayed} disabled={pending}>
            {pending ? "Salvando…" : played ? "Reabrir jogo" : "Marcar como realizado"}
          </Button>
          <SumulaPdfButton
            round={round}
            teamAName={teamAName}
            teamBName={teamBName}
            scoreA={scoreA}
            scoreB={scoreB}
            teamAPlayers={teamAPlayers}
            teamBPlayers={teamBPlayers}
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
          gameId={gameId}
          championshipId={championshipId}
          goalEvents={gameGoals}
          cardEvents={gameCards}
        />
        <TeamSumulaColumn
          teamName={teamBName}
          teamPlayers={teamBPlayers}
          allPlayers={players}
          gameId={gameId}
          championshipId={championshipId}
          goalEvents={gameGoals}
          cardEvents={gameCards}
        />
      </div>
    </div>
  );
}
