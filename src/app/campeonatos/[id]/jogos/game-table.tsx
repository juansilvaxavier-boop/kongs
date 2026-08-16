"use client";

import { Fragment, useState } from "react";
import { Badge, Button, Card, EmptyState, Input, Select } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { useConfirm } from "@/components/confirm-provider";
import { useDeleteAction } from "@/components/use-delete-action";
import { deleteAllGames, deleteGame, updateGame } from "./actions";
import { GameDateField } from "./game-date-field";
import { SumulaPanel } from "./sumula-panel";

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
  penalty_score_a: number | null;
  penalty_score_b: number | null;
  played: boolean;
  venue_id: string | null;
  referee_id: string | null;
  referee_payment_amount: number | null;
  referee_paid: boolean;
};
type Venue = { id: string; name: string };
type Referee = { id: string; name: string; cpf: string | null };
type Lineup = { game_id: string; player_id: string };
type Signature = {
  game_id: string;
  team_id: string;
  captain_name: string;
  signature_data_url: string;
  signed_at: string;
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
  venues,
  lineups,
  signatures,
  referees,
}: {
  championshipId: string;
  games: Game[];
  teams: Team[];
  players: Player[];
  goalEvents: GoalEvent[];
  cardEvents: CardEvent[];
  venues: Venue[];
  lineups: Lineup[];
  signatures: Signature[];
  referees: Referee[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [eventingId, setEventingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [roundFilter, setRoundFilter] = useState("");
  const confirm = useConfirm();
  const runDelete = useDeleteAction();
  const teamName = (teamId: string) =>
    teams.find((t) => t.id === teamId)?.name ?? "?";
  const venueName = (venueId: string | null) =>
    venueId ? venues.find((v) => v.id === venueId)?.name ?? null : null;
  const refereeName = (refereeId: string | null) =>
    refereeId ? referees.find((r) => r.id === refereeId)?.name ?? null : null;

  if (games.length === 0) {
    return <EmptyState>Nenhum jogo agendado ainda.</EmptyState>;
  }

  const rounds = [...new Set(games.map((g) => g.round))];
  const q = query.trim().toLowerCase();
  const filteredGames = games.filter((game) => {
    if (roundFilter && game.round !== roundFilter) return false;
    if (!q) return true;
    return (
      game.round.toLowerCase().includes(q) ||
      teamName(game.team_a_id).toLowerCase().includes(q) ||
      teamName(game.team_b_id).toLowerCase().includes(q) ||
      (venueName(game.venue_id) ?? "").toLowerCase().includes(q) ||
      (refereeName(game.referee_id) ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <>
    <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="w-56">
          <Input
            placeholder="Pesquisar jogo, time, local, árbitro…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="w-44">
          <Select value={roundFilter} onChange={(event) => setRoundFilter(event.target.value)}>
            <option value="">Todas as rodadas</option>
            {rounds.map((round) => (
              <option key={round} value={round}>
                {round}
              </option>
            ))}
          </Select>
        </div>
        {(query || roundFilter) && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setQuery("");
              setRoundFilter("");
            }}
          >
            Limpar filtros
          </Button>
        )}
      </div>
      <form
        action={async () => {
          const ok = await confirm({
            title: `Excluir todos os ${games.length} jogos deste campeonato?`,
            description:
              "Os gols e cartões lançados também serão apagados. Essa ação não pode ser desfeita.",
            confirmLabel: "Excluir tudo",
            danger: true,
          });
          if (ok) {
            await runDelete(() => deleteAllGames(championshipId));
          }
        }}
      >
        <Button type="submit" variant="danger">
          Excluir todos os jogos
        </Button>
      </form>
    </div>
    {filteredGames.length === 0 ? (
      <EmptyState>Nenhum jogo encontrado com esses filtros.</EmptyState>
    ) : (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[52rem] text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-2/60 text-left text-xs uppercase tracking-wide text-muted">
            <th className="px-4 py-3">Rodada</th>
            <th className="px-4 py-3">Data</th>
            <th className="px-4 py-3">Confronto</th>
            <th className="px-4 py-3">Local</th>
            <th className="px-4 py-3">Árbitro</th>
            <th className="px-4 py-3">Placar</th>
            <th className="px-4 py-3">Status</th>
            <th className="w-48 px-4 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {filteredGames.map((game) => (
            <Fragment key={game.id}>
            <tr className="border-b border-border last:border-0">
              {editingId === game.id ? (
                <td colSpan={8} className="px-4 py-4">
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
                      {venues.length > 0 && (
                        <Select
                          name="venue_id"
                          defaultValue={game.venue_id ?? ""}
                          className="max-w-[10rem]"
                        >
                          <option value="">Sem local</option>
                          {venues.map((venue) => (
                            <option key={venue.id} value={venue.id}>
                              {venue.name}
                            </option>
                          ))}
                        </Select>
                      )}
                      {referees.length > 0 && (
                        <Select
                          name="referee_id"
                          defaultValue={game.referee_id ?? ""}
                          className="max-w-[10rem]"
                        >
                          <option value="">Sem árbitro</option>
                          {referees.map((referee) => (
                            <option key={referee.id} value={referee.id}>
                              {referee.name}
                            </option>
                          ))}
                        </Select>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Input
                        name="referee_payment_amount"
                        type="number"
                        step="0.01"
                        min={0}
                        placeholder="Valor pago ao árbitro (R$)"
                        defaultValue={game.referee_payment_amount ?? ""}
                        className="max-w-[12rem]"
                      />
                      <label className="flex items-center gap-2 text-xs text-muted">
                        <input
                          type="checkbox"
                          name="referee_paid"
                          defaultChecked={game.referee_paid}
                        />
                        Árbitro pago
                      </label>
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
                  <td className="px-4 py-3 text-muted">
                    {venueName(game.venue_id) ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {refereeName(game.referee_id) ? (
                      <div className="flex flex-col gap-1">
                        <span>{refereeName(game.referee_id)}</span>
                        {game.referee_payment_amount !== null && (
                          <Badge tone={game.referee_paid ? "success" : "warning"}>
                            {game.referee_paid ? "Pago" : "A pagar"} · R${" "}
                            {game.referee_payment_amount.toFixed(2)}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      "—"
                    )}
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
                          const ok = await confirm({
                            title: `Excluir o jogo "${teamName(game.team_a_id)} x ${teamName(
                              game.team_b_id
                            )}"?`,
                            confirmLabel: "Excluir",
                            danger: true,
                          });
                          if (ok) {
                            await runDelete(() => deleteGame(game.id, championshipId));
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
                <td colSpan={8} className="bg-surface-2/40 px-4 py-4">
                  <SumulaPanel
                    gameId={game.id}
                    championshipId={championshipId}
                    round={game.round}
                    teamAId={game.team_a_id}
                    teamAName={teamName(game.team_a_id)}
                    teamBId={game.team_b_id}
                    teamBName={teamName(game.team_b_id)}
                    scoreA={game.score_a}
                    scoreB={game.score_b}
                    penaltyScoreA={game.penalty_score_a}
                    penaltyScoreB={game.penalty_score_b}
                    played={game.played}
                    players={players}
                    goalEvents={goalEvents}
                    cardEvents={cardEvents}
                    confirmedPlayerIds={
                      new Set(
                        lineups.filter((l) => l.game_id === game.id).map((l) => l.player_id)
                      )
                    }
                    signatures={Object.fromEntries(
                      signatures
                        .filter((s) => s.game_id === game.id)
                        .map((s) => [
                          s.team_id,
                          {
                            captainName: s.captain_name,
                            signatureDataUrl: s.signature_data_url,
                            signedAt: s.signed_at,
                          },
                        ])
                    )}
                  />
                </td>
              </tr>
            )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </Card>
    )}
    </>
  );
}
