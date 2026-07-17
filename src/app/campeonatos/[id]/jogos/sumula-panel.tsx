"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Input, Select } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/action-form";
import {
  createCardEvent,
  createGoalEvent,
  deleteCardEvent,
  deleteGoalEvent,
} from "./events-actions";
import { getSumulaLink, regenerateSumulaLink, updateGameScore } from "./actions";

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

function SumulaLink({ gameId, championshipId }: { gameId: string; championshipId: string }) {
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getSumulaLink(gameId, championshipId)
      .then((url) => {
        if (!cancelled) setLink(url);
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, [gameId, championshipId]);

  async function copyLink() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Não foi possível copiar o link. Selecione e copie manualmente.");
    }
  }

  async function regenerate() {
    if (
      !window.confirm(
        "Isso invalida o link atual — quem já tiver salvo o link antigo não vai mais conseguir preencher a súmula. Continuar?"
      )
    ) {
      return;
    }
    setRegenerating(true);
    try {
      const url = await regenerateSumulaLink(gameId, championshipId);
      setLink(url);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <div className="mb-5 rounded-lg border border-border bg-surface-2/40 p-3">
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
        Link para os mesários
      </h3>
      <p className="mb-2 text-xs text-muted">
        Envie este link para quem vai preencher a súmula no dia do jogo — não
        precisa de login.
      </p>
      {error && <p className="mb-2 text-sm text-danger">{error}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <Input value={link ?? "Gerando link..."} readOnly className="max-w-sm" />
        <Button type="button" variant="secondary" onClick={copyLink} disabled={!link}>
          {copied ? "Copiado!" : "Copiar link"}
        </Button>
        <Button type="button" variant="ghost" onClick={regenerate} disabled={regenerating}>
          {regenerating ? "Gerando…" : "Gerar novo link"}
        </Button>
      </div>
    </div>
  );
}

export function SumulaPanel({
  gameId,
  championshipId,
  teamAId,
  teamBId,
  scoreA,
  scoreB,
  played,
  players,
  goalEvents,
  cardEvents,
}: {
  gameId: string;
  championshipId: string;
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
  const gameGoals = goalEvents.filter((g) => g.game_id === gameId);
  const gameCards = cardEvents.filter((c) => c.game_id === gameId);

  return (
    <div>
      <SumulaLink gameId={gameId} championshipId={championshipId} />

      <div className="mb-5 rounded-lg border border-border bg-surface-2/40 p-3">
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
          Placar final
        </h3>
        <ActionForm
          action={(formData) => updateGameScore(gameId, championshipId, formData)}
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
            Jogo realizado
          </label>
          <SubmitButton pendingText="Salvando…">Salvar placar</SubmitButton>
        </ActionForm>
      </div>

      {gamePlayers.length === 0 ? (
        <p className="text-sm text-muted">
          Cadastre jogadores nos times deste jogo para lançar gols e cartões.
        </p>
      ) : (
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
      )}
    </div>
  );
}
