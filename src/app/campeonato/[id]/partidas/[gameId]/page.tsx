import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, PageHeader } from "@/components/ui";
import { TeamCell } from "@/components/team-cell";
import { FavoriteButton } from "@/components/favorite-button";
import { StandingsTable } from "@/components/standings-table";
import { computeStandings } from "@/lib/standings";
import { groupTeamsByFormat, gamesWithinTeams } from "@/lib/groups";
import { computeAutoLineup, type LineupPlayer } from "@/lib/lineup";
import { GameDetailTabs } from "./game-detail-tabs";
import { FormationsSection, type TeamLineup } from "./formations-section";
import { BolaoTab } from "./bolao-tab";
import { RefereeRatingSection } from "./referee-rating-section";

type FullAttributes = {
  ovr: number;
  ritmo: number;
  finalizacao: number;
  passe: number;
  drible: number;
  defesa: number;
  fisico: number;
};

function buildTeamLineup(
  teamName: string,
  crestUrl: string | null,
  players: LineupPlayer[],
  attributesByPlayer: Map<string, FullAttributes>
): TeamLineup {
  const lineup = computeAutoLineup(players);
  const withAttrs = (list: LineupPlayer[]) =>
    list.map((p) => ({
      id: p.id,
      name: p.name,
      position: p.position,
      number: p.number,
      photoUrl: p.photoUrl,
      attributes: attributesByPlayer.get(p.id) ?? {
        ovr: p.ovr,
        ritmo: 70,
        finalizacao: 70,
        passe: 70,
        drible: 70,
        defesa: 70,
        fisico: 70,
      },
    }));

  return {
    teamName,
    crestUrl,
    formation: lineup.formation,
    starters: {
      Goleiro: withAttrs(lineup.starters.Goleiro),
      Zagueiro: withAttrs(lineup.starters.Zagueiro),
      Meia: withAttrs(lineup.starters.Meia),
      Atacante: withAttrs(lineup.starters.Atacante),
    },
    bench: withAttrs(lineup.bench),
  };
}

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ id: string; gameId: string }>;
}) {
  const { id, gameId } = await params;
  const supabase = await createClient();

  const [{ data: game }, { data: championship }, { data: allTeams }, { data: allGames }] =
    await Promise.all([
      supabase
        .from("games")
        .select(
          "id, round, date, played, score_a, score_b, team_a_id, team_b_id, venue_id, championship_id, referee_id"
        )
        .eq("id", gameId)
        .eq("championship_id", id)
        .maybeSingle(),
      supabase.from("championships").select("format").eq("id", id).maybeSingle(),
      supabase
        .from("teams")
        .select("id, name, crest_url, group_name, owner_user_id")
        .eq("championship_id", id)
        .order("name"),
      supabase
        .from("games")
        .select("id, team_a_id, team_b_id, score_a, score_b, played")
        .eq("championship_id", id),
    ]);

  if (!game) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const teamA = (allTeams ?? []).find((t) => t.id === game.team_a_id);
  const teamB = (allTeams ?? []).find((t) => t.id === game.team_b_id);
  const myTeamId =
    user && teamA?.owner_user_id === user.id
      ? teamA.id
      : user && teamB?.owner_user_id === user.id
        ? teamB.id
        : null;

  const [
    { data: venue },
    { data: players },
    { data: favoriteRow },
    { data: myPrediction },
    { data: referee },
    { data: myRefereeRating },
  ] = await Promise.all([
    game.venue_id
      ? supabase.from("venues").select("name").eq("id", game.venue_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("players")
      .select("id, name, position, photo_url, team_id")
      .in("team_id", [game.team_a_id, game.team_b_id]),
    user
      ? supabase
          .from("favorites")
          .select("id")
          .eq("kind", "game")
          .eq("entity_id", gameId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    user
      ? supabase
          .from("bolao_predictions")
          .select("predicted_score_a, predicted_score_b")
          .eq("game_id", gameId)
          .eq("user_id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    game.referee_id
      ? supabase.from("referees").select("name").eq("id", game.referee_id).maybeSingle()
      : Promise.resolve({ data: null }),
    myTeamId
      ? supabase
          .from("referee_ratings")
          .select("rating, comment")
          .eq("game_id", gameId)
          .eq("team_id", myTeamId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const playerIds = (players ?? []).map((p) => p.id);
  const { data: attributesRows } =
    playerIds.length > 0
      ? await supabase
          .from("player_attributes")
          .select("player_id, ovr, ritmo, finalizacao, passe, drible, defesa, fisico")
          .in("player_id", playerIds)
      : { data: [] };
  const attributesByPlayer = new Map((attributesRows ?? []).map((a) => [a.player_id, a]));
  const ovrByPlayer = new Map((attributesRows ?? []).map((a) => [a.player_id, a.ovr]));

  const lineupPlayers = (teamId: string): LineupPlayer[] =>
    (players ?? [])
      .filter((p) => p.team_id === teamId)
      .map((p) => ({
        id: p.id,
        name: p.name,
        position: p.position,
        number: null,
        photoUrl: p.photo_url,
        ovr: ovrByPlayer.get(p.id) ?? 70,
      }));

  const teamALineup = buildTeamLineup(
    teamA?.name ?? "?",
    teamA?.crest_url ?? null,
    lineupPlayers(game.team_a_id),
    attributesByPlayer
  );
  const teamBLineup = buildTeamLineup(
    teamB?.name ?? "?",
    teamB?.crest_url ?? null,
    lineupPlayers(game.team_b_id),
    attributesByPlayer
  );

  const groups = groupTeamsByFormat(championship?.format ?? "liga", allTeams ?? []);
  const group = groups.find((g) => g.teams.some((t) => t.id === game.team_a_id)) ?? groups[0];
  const groupStandings = group
    ? computeStandings(group.teams, gamesWithinTeams(allGames ?? [], group.teams))
    : [];
  const gameStandings = groupStandings.filter(
    (row) => row.teamId === game.team_a_id || row.teamId === game.team_b_id
  );

  return (
    <div>
      <PageHeader eyebrow={game.round} title={`${teamA?.name ?? "?"} x ${teamB?.name ?? "?"}`} />

      <Card className="mb-6 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-sm font-medium text-foreground">
            <TeamCell name={teamA?.name ?? "?"} crestUrl={teamA?.crest_url ?? null} />
            {game.played ? (
              <span className="font-display text-lg font-bold text-foreground">
                {game.score_a} - {game.score_b}
              </span>
            ) : (
              <span className="text-muted">x</span>
            )}
            <TeamCell name={teamB?.name ?? "?"} crestUrl={teamB?.crest_url ?? null} />
          </div>
          <div className="flex items-center gap-3">
            <Badge tone={game.played ? "success" : "warning"}>
              {game.played ? "Realizado" : "Agendado"}
            </Badge>
            {user && (
              <FavoriteButton kind="game" entityId={game.id} initialFavorited={Boolean(favoriteRow)} />
            )}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted">
          <span>
            {game.date
              ? new Date(game.date).toLocaleString("pt-BR", {
                  dateStyle: "long",
                  timeStyle: "short",
                })
              : "Data a definir"}
          </span>
          <span>Local: {venue?.name ?? "A definir"}</span>
        </div>
      </Card>

      {game.played && game.referee_id && myTeamId && (
        <div className="mb-6">
          <RefereeRatingSection
            championshipId={id}
            gameId={gameId}
            teamId={myTeamId}
            refereeId={game.referee_id}
            refereeName={referee?.name ?? "Árbitro"}
            existingRating={myRefereeRating ?? null}
          />
        </div>
      )}

      <GameDetailTabs
        formacoes={<FormationsSection teamA={teamALineup} teamB={teamBLineup} />}
        classificacao={
          <StandingsTable
            standings={gameStandings}
            teamHref={(teamId) => `/campeonato/${id}/time/${teamId}`}
          />
        }
        bolao={
          <BolaoTab
            championshipId={id}
            gameId={gameId}
            teamAName={teamA?.name ?? "?"}
            teamBName={teamB?.name ?? "?"}
            played={game.played}
            scoreA={game.score_a}
            scoreB={game.score_b}
            myPrediction={myPrediction ?? null}
            isLoggedIn={Boolean(user)}
          />
        }
      />
    </div>
  );
}
