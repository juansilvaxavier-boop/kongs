"use client";

import { Fragment, useState } from "react";
import { Badge, Button, Card, EmptyState, Input, Select } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { deleteAllGames, deleteGame, updateGame } from "./actions";
import { GameDateField } from "./game-date-field";
import { SumulaPanel } from "./sumula-panel";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível concluir a ação.";
}

type Team = { id: string; name: string };
type Player = { id: string; name: string; team_id: string | null };
type GoalEvent = { id: string; player_id: string; minute: number | null; game_id: string };
type CardEvent = {
  id: string;
  player_id: string;
  card_type: string;
  minute: number | null;
  game_id: string;
};
type Game = {
  id: string;
  round: string;
  team_a_id: string;
  team_b_id: string;
  date: string | null;
  score_a: number | null;
  score_b: number | null;
  played: boolean;
};

function toDatetimeLocal(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function GameTable({
  championshipId,
  games,
  teams,
  players,
  goalEvents,
  cardEvents,
}: {
  championshipId: string;
  games: Game[];
  teams: Team[];
  players: Player[];
  goalEvents: GoalEvent[];
  cardEvents: CardEvent[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [eventingId, setEventingId] = useState<string | null>(null);
  const teamName = (teamId: string) =>
    teams.find((t) => t.id === teamId)?.name ?? "?";

  if (games.length === 0) {
    return <EmptyState>Nenhum jogo agendado ainda.</EmptyState>;
  }

  return (
    <>
    <div className="mb-3 flex justify-end">
      <form
        action={async () => {
          if (
            window.confirm(
              `Excluir todos os ${games.length} jogos deste campeonato? Os gols e cartões lançados também serão apagados. Essa ação não pode ser desfeita.`
            )
          ) {
            try {
              await deleteAllGames(championshipId);
            } catch (error) {
              alert(errorMessage(error));
            }
          }
        }}
      >
        <Button type="submit" variant="danger">
          Excluir todos os jogos
        </Button>
      </form>
    </div>
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[52rem] text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-2/60 text-left text-xs uppercase tracking-wide text-muted">
            <th className="px-4 py-3">Rodada</th>
            <th className="px-4 py-3">Data</th>
            <th className="px-4 py-3">Confronto</th>
            <th className="px-4 py-3">Placar</th>
            <th className="px-4 py-3">Status</th>
            <th className="w-48 px-4 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {games.map((game) => (
            <Fragment key={game.id}>
            <tr className="border-b border-border last:border-0">
              {editingId === game.id ? (
                <td colSpan={6} className="px-4 py-4">
                  <ActionForm
                    action={(formData) => updateGame(game.id, championshipId, formData)}
                    onSuccess={() => setEditingId(null)}
                    className="flex flex-col gap-3"
                  >
                    <div className="flex flex-wrap gap-2">
                      <Input
                        name="round"
                        defaultValue={game.round}
                        required
                        placeholder="Rodada"
                        className="max-w-[9rem]"
                      />
                      <GameDateField
                        defaultValue={toDatetimeLocal(game.date)}
                        className="max-w-[12rem]"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Select
                        name="team_a_id"
                        defaultValue={game.team_a_id}
                        className="max-w-[10rem]"
                      >
                        {teams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </Select>
                      <span className="text-muted">x</span>
                      <Select
                        name="team_b_id"
                        defaultValue={game.team_b_id}
                        className="max-w-[10rem]"
                      >
                        {teams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <p className="text-xs text-muted">
                      Placar e &quot;jogo realizado&quot; ficam na aba Súmula.
                    </p>
                    <div className="flex gap-2">
                      <SubmitButton pendingText="Salvando…">Salvar</SubmitButton>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setEditingId(null)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </ActionForm>
                </td>
              ) : (
                <>
                  <td className="px-4 py-3 text-foreground">{game.round}</td>
                  <td className="px-4 py-3 text-muted">
                    {game.date
                      ? new Date(game.date).toLocaleString("pt-BR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })
                      : "—"}
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {teamName(game.team_a_id)} x {teamName(game.team_b_id)}
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    {game.played
                      ? `${game.score_a} - ${game.score_b}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={game.played ? "success" : "warning"}>
                      {game.played ? "Realizado" : "Agendado"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="secondary"
                        onClick={() =>
                          setEventingId(eventingId === game.id ? null : game.id)
                        }
                      >
                        Súmula
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setEditingId(game.id)}
                      >
                        Editar
                      </Button>
                      <form
                        action={async () => {
                          if (
                            window.confirm(
                              `Excluir o jogo "${teamName(game.team_a_id)} x ${teamName(
                                game.team_b_id
                              )}"?`
                            )
                          ) {
                            try {
                              await deleteGame(game.id, championshipId);
                            } catch (error) {
                              alert(errorMessage(error));
                            }
                          }
                        }}
                      >
                        <Button type="submit" variant="danger">
                          Excluir
                        </Button>
                      </form>
                    </div>
                  </td>
                </>
              )}
            </tr>
            {eventingId === game.id && (
              <tr className="border-b border-border last:border-0">
                <td colSpan={6} className="bg-surface-2/40 px-4 py-4">
                  <SumulaPanel
                    gameId={game.id}
                    championshipId={championshipId}
                    teamAId={game.team_a_id}
                    teamAName={teamName(game.team_a_id)}
                    teamBId={game.team_b_id}
                    teamBName={teamName(game.team_b_id)}
                    scoreA={game.score_a}
                    scoreB={game.score_b}
                    played={game.played}
                    players={players}
                    goalEvents={goalEvents}
                    cardEvents={cardEvents}
                  />
                </td>
              </tr>
            )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </Card>
    </>
  );
}
