import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge, BrandMark, Card, EmptyState, PageHeader } from "@/components/ui";
import { TeamCell } from "@/components/team-cell";
import { FavoriteButton } from "@/components/favorite-button";

export default async function FavoritosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/favoritos");

  const { data: favorites } = await supabase
    .from("favorites")
    .select("id, kind, entity_id, created_at")
    .order("created_at", { ascending: false });

  const gameIds = (favorites ?? []).filter((f) => f.kind === "game").map((f) => f.entity_id);
  const favTeamIds = (favorites ?? []).filter((f) => f.kind === "team").map((f) => f.entity_id);
  const playerIds = (favorites ?? []).filter((f) => f.kind === "player").map((f) => f.entity_id);

  const [{ data: games }, { data: players }] = await Promise.all([
    gameIds.length > 0
      ? supabase
          .from("games")
          .select(
            "id, championship_id, round, date, played, score_a, score_b, team_a_id, team_b_id"
          )
          .in("id", gameIds)
      : Promise.resolve({ data: [] as never[] }),
    playerIds.length > 0
      ? supabase
          .from("players")
          .select("id, championship_id, name, position, photo_url, team_id")
          .in("id", playerIds)
      : Promise.resolve({ data: [] as never[] }),
  ]);

  const allTeamIds = [
    ...new Set([
      ...favTeamIds,
      ...(games ?? []).flatMap((g) => [g.team_a_id, g.team_b_id]),
      ...(players ?? []).map((p) => p.team_id).filter((id): id is string => Boolean(id)),
    ]),
  ];

  const { data: teams } =
    allTeamIds.length > 0
      ? await supabase
          .from("teams")
          .select("id, name, crest_url, championship_id")
          .in("id", allTeamIds)
      : { data: [] };

  const teamById = new Map((teams ?? []).map((t) => [t.id, t]));

  const championshipIds = [
    ...new Set([
      ...(games ?? []).map((g) => g.championship_id),
      ...(teams ?? []).map((t) => t.championship_id),
      ...(players ?? []).map((p) => p.championship_id),
    ]),
  ];

  const { data: championships } =
    championshipIds.length > 0
      ? await supabase.from("championships").select("id, name").in("id", championshipIds)
      : { data: [] };
  const championshipNameById = new Map((championships ?? []).map((c) => [c.id, c.name]));

  const favoritedTeams = (teams ?? []).filter((t) => favTeamIds.includes(t.id));

  return (
    <div className="pitch-lines flex min-h-dvh flex-1 flex-col">
      <header className="border-b border-border bg-surface/70 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-4 sm:px-6">
          <BrandMark />
          <span className="font-display text-lg font-bold uppercase tracking-wide">
            Kongs Campeonatos
          </span>
        </div>
      </header>
      <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
        <PageHeader eyebrow="Meus favoritos" title="Favoritos" />

        <div className="space-y-10">
        <div>
          <h2 className="mb-3 font-display text-lg font-bold uppercase tracking-wide text-foreground">
            Jogos
          </h2>
          {!games || games.length === 0 ? (
            <EmptyState>Nenhum jogo favoritado ainda.</EmptyState>
          ) : (
            <div className="space-y-2">
              {games.map((game) => {
                const teamA = teamById.get(game.team_a_id);
                const teamB = teamById.get(game.team_b_id);
                return (
                  <Card key={game.id} className="flex items-center justify-between gap-3 p-4">
                    <Link
                      href={`/campeonato/${game.championship_id}/partidas/${game.id}`}
                      className="min-w-0 flex-1"
                    >
                      <p className="text-xs text-muted">
                        {championshipNameById.get(game.championship_id) ?? "—"} · {game.round}
                      </p>
                      <p className="font-medium text-foreground">
                        {teamA?.name ?? "?"} x {teamB?.name ?? "?"}
                      </p>
                      <p className="text-xs text-muted">
                        {game.date
                          ? new Date(game.date).toLocaleString("pt-BR", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })
                          : "Data a definir"}
                      </p>
                    </Link>
                    <div className="flex items-center gap-3">
                      <Badge tone={game.played ? "success" : "warning"}>
                        {game.played ? `${game.score_a} - ${game.score_b}` : "Agendado"}
                      </Badge>
                      <FavoriteButton kind="game" entityId={game.id} initialFavorited size="sm" />
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-3 font-display text-lg font-bold uppercase tracking-wide text-foreground">
            Times
          </h2>
          {favoritedTeams.length === 0 ? (
            <EmptyState>Nenhum time favoritado ainda.</EmptyState>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {favoritedTeams.map((team) => (
                <Card key={team.id} className="flex items-center justify-between gap-3 p-4">
                  <Link
                    href={`/campeonato/${team.championship_id}/time/${team.id}`}
                    className="min-w-0 flex-1"
                  >
                    <p className="text-xs text-muted">
                      {championshipNameById.get(team.championship_id) ?? "—"}
                    </p>
                    <TeamCell name={team.name} crestUrl={team.crest_url} />
                  </Link>
                  <FavoriteButton kind="team" entityId={team.id} initialFavorited size="sm" />
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-3 font-display text-lg font-bold uppercase tracking-wide text-foreground">
            Jogadores
          </h2>
          {!players || players.length === 0 ? (
            <EmptyState>Nenhum jogador favoritado ainda.</EmptyState>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {players.map((player) => {
                const team = player.team_id ? teamById.get(player.team_id) : null;
                return (
                  <Card key={player.id} className="flex items-center justify-between gap-3 p-4">
                    <Link
                      href={team ? `/campeonato/${player.championship_id}/time/${team.id}` : "#"}
                      className="flex min-w-0 flex-1 items-center gap-3"
                    >
                      {player.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={player.photo_url}
                          alt=""
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-xs font-bold text-muted">
                          {player.name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                      <span className="min-w-0">
                        <p className="truncate font-medium text-foreground">{player.name}</p>
                        <p className="truncate text-xs text-muted">
                          {player.position ?? "—"} · {team?.name ?? "Sem time"}
                        </p>
                      </span>
                    </Link>
                    <FavoriteButton kind="player" entityId={player.id} initialFavorited size="sm" />
                  </Card>
                );
              })}
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
