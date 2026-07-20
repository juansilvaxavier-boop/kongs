import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui";
import { ExportPdfButton } from "@/components/export-pdf-button";
import { FavoriteButton } from "@/components/favorite-button";
import { computeSuspensions } from "@/lib/discipline";
import { isBirthdayToday } from "@/lib/datetime";
import { PlayerRosterGrid, type RosterPlayer } from "./player-roster-grid";

export default async function PublicTeamPage({
  params,
}: {
  params: Promise<{ id: string; teamId: string }>;
}) {
  const { id, teamId } = await params;
  const supabase = await createClient();

  const [
    { data: championship },
    { data: team },
    { data: players },
    { data: cardEvents },
    { data: games },
    {
      data: { user },
    },
  ] = await Promise.all([
    supabase
      .from("championships")
      .select("yellow_cards_for_suspension")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("teams")
      .select("id, name, crest_url, coach_id")
      .eq("championship_id", id)
      .eq("id", teamId)
      .maybeSingle(),
    supabase
      .from("players")
      .select("id, name, number, position, team_id, photo_url, birth_date")
      .eq("team_id", teamId)
      .order("number", { ascending: true, nullsFirst: false }),
    supabase
      .from("card_events")
      .select("player_id, card_type, game_id")
      .eq("championship_id", id),
    supabase
      .from("games")
      .select("id, team_a_id, team_b_id, date, round, played")
      .eq("championship_id", id),
    supabase.auth.getUser(),
  ]);

  if (!team) notFound();

  const playerIds = (players ?? []).map((p) => p.id);

  const { data: favoriteRows } = user
    ? await supabase
        .from("favorites")
        .select("kind, entity_id")
        .in("kind", ["team", "player"])
    : { data: [] };
  const teamFavorited = (favoriteRows ?? []).some(
    (f) => f.kind === "team" && f.entity_id === teamId
  );
  const favoritedPlayerIds = (favoriteRows ?? [])
    .filter((f) => f.kind === "player")
    .map((f) => f.entity_id);

  const [{ data: attributesRows }, { data: historyRows }, { data: mvpGames }] =
    await Promise.all([
      playerIds.length > 0
        ? supabase
            .from("player_attributes")
            .select("player_id, ovr, ritmo, finalizacao, passe, drible, defesa, fisico")
            .in("player_id", playerIds)
        : Promise.resolve({ data: [] }),
      playerIds.length > 0
        ? supabase
            .from("ovr_history")
            .select("id, player_id, round, reason, delta, created_at")
            .in("player_id", playerIds)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] }),
      playerIds.length > 0
        ? supabase.from("games").select("mvp_player_id").in("mvp_player_id", playerIds)
        : Promise.resolve({ data: [] }),
    ]);

  const suspensions = computeSuspensions(
    players ?? [],
    cardEvents ?? [],
    games ?? [],
    championship?.yellow_cards_for_suspension ?? 3
  );

  const { data: coachRow } = team.coach_id
    ? await supabase.from("coaches").select("name").eq("id", team.coach_id).maybeSingle()
    : { data: null };

  const attributesByPlayer = new Map((attributesRows ?? []).map((a) => [a.player_id, a]));
  const mvpCounts = new Map<string, number>();
  for (const game of mvpGames ?? []) {
    if (!game.mvp_player_id) continue;
    mvpCounts.set(game.mvp_player_id, (mvpCounts.get(game.mvp_player_id) ?? 0) + 1);
  }

  const rosterPlayers: RosterPlayer[] = (players ?? []).map((player) => {
    const attrs = attributesByPlayer.get(player.id);
    return {
      id: player.id,
      name: player.name,
      number: player.number,
      position: player.position,
      photoUrl: player.photo_url,
      suspended: suspensions.get(player.id)?.suspended ?? false,
      pendingSuspension: suspensions.get(player.id)?.pendingSuspension ?? false,
      isBirthday: isBirthdayToday(player.birth_date),
      attributes: {
        ovr: attrs?.ovr ?? 70,
        ritmo: attrs?.ritmo ?? 70,
        finalizacao: attrs?.finalizacao ?? 70,
        passe: attrs?.passe ?? 70,
        drible: attrs?.drible ?? 70,
        defesa: attrs?.defesa ?? 70,
        fisico: attrs?.fisico ?? 70,
      },
      history: (historyRows ?? [])
        .filter((h) => h.player_id === player.id)
        .map((h) => ({
          id: h.id,
          round: h.round,
          reason: h.reason,
          delta: h.delta,
          created_at: h.created_at,
        })),
      mvpCount: mvpCounts.get(player.id) ?? 0,
    };
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {team.crest_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={team.crest_url}
              alt=""
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-2 text-lg font-bold text-muted">
              {team.name.slice(0, 2).toUpperCase()}
            </span>
          )}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Elenco
            </p>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-foreground">
                {team.name}
              </h1>
              {user && (
                <FavoriteButton kind="team" entityId={team.id} initialFavorited={teamFavorited} />
              )}
            </div>
            {coachRow?.name && (
              <p className="text-sm text-muted">Técnico: {coachRow.name}</p>
            )}
          </div>
        </div>

        {rosterPlayers.length > 0 && (
          <ExportPdfButton
            fileName={`elenco-${team.name}`}
            title={`Elenco — ${team.name}`}
            columns={["Nº", "Nome", "Posição", "Overall"]}
            rows={rosterPlayers.map((player) => [
              player.number ?? "—",
              player.name,
              player.position ?? "—",
              Math.round(player.attributes.ovr),
            ])}
          />
        )}
      </div>

      {rosterPlayers.length > 0 ? (
        <PlayerRosterGrid
          players={rosterPlayers}
          crestUrl={team.crest_url}
          favoritedPlayerIds={user ? favoritedPlayerIds : null}
        />
      ) : (
        <EmptyState>Nenhum jogador cadastrado ainda.</EmptyState>
      )}
    </div>
  );
}
