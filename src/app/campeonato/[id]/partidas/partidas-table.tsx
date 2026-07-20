"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import { TeamCell } from "@/components/team-cell";
import { FavoriteButton } from "@/components/favorite-button";

type Team = { id: string; name: string; crest_url: string | null };
type Game = {
  id: string;
  round: string;
  team_a_id: string;
  team_b_id: string;
  date: string | null;
  score_a: number | null;
  score_b: number | null;
  played: boolean;
  venue_id: string | null;
};
type Venue = { id: string; name: string };

function outcomeLabel(game: Game, perspectiveTeamId: string) {
  if (!game.played || game.score_a === null || game.score_b === null) return null;
  const isTeamA = game.team_a_id === perspectiveTeamId;
  const own = isTeamA ? game.score_a : game.score_b;
  const other = isTeamA ? game.score_b : game.score_a;
  if (own > other) return "V";
  if (own < other) return "D";
  return "E";
}

function H2HPanel({
  game,
  allGames,
  teamName,
  teamCrest,
}: {
  game: Game;
  allGames: Game[];
  teamName: (id: string) => string;
  teamCrest: (id: string) => string | null;
}) {
  const priorGames = allGames
    .filter(
      (g) =>
        g.played &&
        g.id !== game.id &&
        ((g.team_a_id === game.team_a_id && g.team_b_id === game.team_b_id) ||
          (g.team_a_id === game.team_b_id && g.team_b_id === game.team_a_id))
    )
    .sort((a, b) => (a.date && b.date ? (a.date < b.date ? 1 : -1) : 0));

  if (priorGames.length === 0) {
    return (
      <p className="text-sm text-muted">
        Primeiro confronto entre {teamName(game.team_a_id)} e {teamName(game.team_b_id)}{" "}
        neste campeonato.
      </p>
    );
  }

  let winsA = 0;
  let winsB = 0;
  let draws = 0;
  for (const g of priorGames) {
    const outcome = outcomeLabel(g, game.team_a_id);
    if (outcome === "V") winsA++;
    else if (outcome === "D") winsB++;
    else if (outcome === "E") draws++;
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-4 text-sm">
        <span className="flex items-center gap-1.5">
          <TeamCell name={teamName(game.team_a_id)} crestUrl={teamCrest(game.team_a_id)} />
          <span className="font-display font-bold text-foreground">{winsA}</span>
        </span>
        <span className="text-muted">{draws} empate(s)</span>
        <span className="flex items-center gap-1.5">
          <span className="font-display font-bold text-foreground">{winsB}</span>
          <TeamCell name={teamName(game.team_b_id)} crestUrl={teamCrest(game.team_b_id)} />
        </span>
      </div>
      <ul className="space-y-1 text-sm text-muted">
        {priorGames.slice(0, 5).map((g) => (
          <li key={g.id} className="flex items-center gap-2">
            <span className="w-20 shrink-0">
              {g.date
                ? new Date(g.date).toLocaleDateString("pt-BR")
                : g.round}
            </span>
            <span className="text-foreground">
              {teamName(g.team_a_id)} {g.score_a} x {g.score_b} {teamName(g.team_b_id)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PartidasTable({
  championshipId,
  games,
  allGames,
  teams,
  venues,
  favoritedGameIds,
}: {
  championshipId: string;
  games: Game[];
  allGames: Game[];
  teams: Team[];
  venues: Venue[];
  favoritedGameIds: string[];
}) {
  const favoritedGameIdSet = new Set(favoritedGameIds);
  const [openId, setOpenId] = useState<string | null>(null);
  const teamName = (teamId: string) => teams.find((t) => t.id === teamId)?.name ?? "?";
  const teamCrest = (teamId: string) => teams.find((t) => t.id === teamId)?.crest_url ?? null;
  const venueName = (venueId: string | null) =>
    venueId ? venues.find((v) => v.id === venueId)?.name ?? null : null;

  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[42rem] text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-2/60 text-left text-xs uppercase tracking-wide text-muted">
            <th className="px-4 py-3">Rodada</th>
            <th className="px-4 py-3">Data</th>
            <th className="px-4 py-3">Confronto</th>
            <th className="px-4 py-3">Local</th>
            <th className="px-4 py-3">Placar</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {games.map((game) => (
            <Fragment key={game.id}>
              <tr
                className="cursor-pointer border-b border-border last:border-0 hover:bg-surface-2/40"
                onClick={() => setOpenId(openId === game.id ? null : game.id)}
              >
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
                  <div className="flex items-center gap-2">
                    <TeamCell name={teamName(game.team_a_id)} crestUrl={teamCrest(game.team_a_id)} />
                    <span className="text-muted">x</span>
                    <TeamCell name={teamName(game.team_b_id)} crestUrl={teamCrest(game.team_b_id)} />
                  </div>
                </td>
                <td className="px-4 py-3 text-muted">{venueName(game.venue_id) ?? "—"}</td>
                <td className="px-4 py-3 text-foreground">
                  {game.played ? `${game.score_a} - ${game.score_b}` : "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={game.played ? "success" : "warning"}>
                    {game.played ? "Realizado" : "Agendado"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/campeonato/${championshipId}/partidas/${game.id}`}
                      onClick={(event) => event.stopPropagation()}
                      className="text-xs text-accent hover:underline"
                    >
                      Ver jogo →
                    </Link>
                    <FavoriteButton
                      kind="game"
                      entityId={game.id}
                      initialFavorited={favoritedGameIdSet.has(game.id)}
                      size="sm"
                    />
                  </div>
                </td>
              </tr>
              {openId === game.id && (
                <tr className="border-b border-border last:border-0">
                  <td colSpan={7} className="bg-surface-2/40 px-4 py-4">
                    <h3 className="mb-2 font-display text-xs font-bold uppercase tracking-wide text-muted">
                      Retrospecto
                    </h3>
                    <H2HPanel
                      game={game}
                      allGames={allGames}
                      teamName={teamName}
                      teamCrest={teamCrest}
                    />
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
