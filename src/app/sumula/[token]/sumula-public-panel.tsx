"use client";

import { Badge, Input, Select } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/action-form";
import {
  sumulaAddCard,
  sumulaAddGoal,
  sumulaDeleteCard,
  sumulaDeleteGoal,
  sumulaUpdateScore,
} from "./actions";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível concluir a ação.";
}

type Player = { id: string; name: string; team_id: string | null; number: number | null };
type GoalEvent = { id: string; player_id: string; minute: number | null; game_id: string };
type CardEvent = {
  id: string;
  player_id: string;
  card_type: string;
  minute: number | null;
  game_id: string;
};

export function SumulaPublicPanel({
  token,
  teamAId,
  teamBId,
  scoreA,
  scoreB,
  played,
  players,
  goalEvents,
  cardEvents,
}: {
  token: string;
  teamAId: string;
  teamBId: string;
  scoreA: number | null;
  scoreB: number | null;
  played: boolean;
  players: Player[];
  goalEvents: GoalEvent[];
  cardEvents: CardEvent[];
}) {
  const gamePlayers = players.filter(
    (p) => p.team_id === teamAId || p.team_id === teamBId
  );
  const playerName = (id: string) => players.find((p) => p.id === id)?.name ?? "?";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 font-display text-sm font-bold uppercase tracking-wide text-foreground">
          Placar final
        </h2>
        <ActionForm
          action={(formData) => sumulaUpdateScore(token, formData)}
          className="flex flex-wrap items-center gap-2"
        >
          <Input
            name="score_a"
            type="number"
            min={0}
            defaultValue={scoreA ?? ""}
            placeholder="Placar"
            className="max-w-[4.5rem] text-center"
          />
          <span className="text-muted">x</span>
          <Input
            name="score_b"
            type="number"
            min={0}
            defaultValue={scoreB ?? ""}
            placeholder="Placar"
            className="max-w-[4.5rem] text-center"
          />
          <label className="flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              name="played"
              defaultChecked={played}
              className="h-4 w-4 rounded border-border accent-accent"
            />
            Jogo encerrado
          </label>
          <SubmitButton pendingText="Salvando…">Salvar placar</SubmitButton>
        </ActionForm>
      </div>

      {gamePlayers.length === 0 ? (
        <p className="text-sm text-muted">
          Nenhum jogador cadastrado nos times deste jogo.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <h2 className="mb-2 font-display text-sm font-bold uppercase tracking-wide text-foreground">
              Gols
            </h2>
            <ul className="mb-3 space-y-1">
              {goalEvents.map((goal) => (
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
                        await sumulaDeleteGoal(token, goal.id);
                      } catch (error) {
                        alert(errorMessage(error));
                      }
                    }}
                  >
                    remover
                  </button>
                </li>
              ))}
              {goalEvents.length === 0 && (
                <li className="text-sm text-muted">Nenhum gol lançado.</li>
              )}
            </ul>
            <ActionForm
              action={(formData) => sumulaAddGoal(token, formData)}
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
            <h2 className="mb-2 font-display text-sm font-bold uppercase tracking-wide text-foreground">
              Cartões
            </h2>
            <ul className="mb-3 space-y-1">
              {cardEvents.map((card) => (
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
                        await sumulaDeleteCard(token, card.id);
                      } catch (error) {
                        alert(errorMessage(error));
                      }
                    }}
                  >
                    remover
                  </button>
                </li>
              ))}
              {cardEvents.length === 0 && (
                <li className="text-sm text-muted">Nenhum cartão lançado.</li>
              )}
            </ul>
            <ActionForm
              action={(formData) => sumulaAddCard(token, formData)}
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
      )}
    </div>
  );
}
