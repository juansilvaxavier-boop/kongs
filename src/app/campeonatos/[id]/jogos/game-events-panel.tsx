"use client";

import { Badge, Input, Select } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/action-form";
import {
  createCardEvent,
  createGoalEvent,
  deleteCardEvent,
  deleteGoalEvent,
} from "./events-actions";

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

export function GameEventsPanel({
  gameId,
  championshipId,
  teamAId,
  teamBId,
  players,
  goalEvents,
  cardEvents,
}: {
  gameId: string;
  championshipId: string;
  teamAId: string;
  teamBId: string;
  players: Player[];
  goalEvents: GoalEvent[];
  cardEvents: CardEvent[];
}) {
  const gamePlayers = players.filter(
    (p) => p.team_id === teamAId || p.team_id === teamBId
  );
  const playerName = (id: string) => players.find((p) => p.id === id)?.name ?? "?";
  const gameGoals = goalEvents.filter((g) => g.game_id === gameId);
  const gameCards = cardEvents.filter((c) => c.game_id === gameId);

  if (gamePlayers.length === 0) {
    return (
      <p className="text-sm text-muted">
        Cadastre jogadores nos times deste jogo para lançar gols e cartões.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
          Gols
        </h3>
        <ul className="mb-3 space-y-1">
          {gameGoals.map((goal) => (
            <li
              key={goal.id}
              className="flex items-center justify-between text-sm text-foreground"
            >
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
          {gameGoals.length === 0 && (
            <li className="text-sm text-muted">Nenhum gol lançado.</li>
          )}
        </ul>
        <ActionForm
          action={(formData) => createGoalEvent(gameId, championshipId, formData)}
          className="flex flex-wrap items-center gap-2"
        >
          <Select name="player_id" required defaultValue="" className="max-w-[10rem]">
            <option value="" disabled>
              Jogador
            </option>
            {gamePlayers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
          <Input name="minute" type="number" min={0} placeholder="Min." className="max-w-[4.5rem]" />
          <SubmitButton variant="secondary" pendingText="Adicionando…">
            Adicionar gol
          </SubmitButton>
        </ActionForm>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
          Cartões
        </h3>
        <ul className="mb-3 space-y-1">
          {gameCards.map((card) => (
            <li
              key={card.id}
              className="flex items-center justify-between text-sm text-foreground"
            >
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
          {gameCards.length === 0 && (
            <li className="text-sm text-muted">Nenhum cartão lançado.</li>
          )}
        </ul>
        <ActionForm
          action={(formData) => createCardEvent(gameId, championshipId, formData)}
          className="flex flex-wrap items-center gap-2"
        >
          <Select name="player_id" required defaultValue="" className="max-w-[10rem]">
            <option value="" disabled>
              Jogador
            </option>
            {gamePlayers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
          <Select name="card_type" required defaultValue="" className="max-w-[8rem]">
            <option value="" disabled>
              Cartão
            </option>
            <option value="yellow">Amarelo</option>
            <option value="red">Vermelho</option>
          </Select>
          <Input name="minute" type="number" min={0} placeholder="Min." className="max-w-[4.5rem]" />
          <SubmitButton variant="secondary" pendingText="Adicionando…">
            Adicionar cartão
          </SubmitButton>
        </ActionForm>
      </div>
    </div>
  );
}
