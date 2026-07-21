import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { computeTopScorers } from "@/lib/stats";
import { computeStandings } from "@/lib/standings";
import { computeStreaks } from "@/lib/streaks";
import { computeChampionTeamId } from "@/lib/champion";
import { PLAYER_POSITIONS } from "@/lib/positions";
import { CommentsSection } from "../comments-section";
import { ChampionCertificate } from "@/components/champion-certificate";
import {
  OverviewHighlights,
  type PositionHighlight,
  type TeamGoalsRow,
} from "../overview-highlights";

export default async function VisaoGeralPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: championship },
    { data: teams },
    { data: comments },
    { data: games },
    { data: cards },
    { data: players },
    { data: goals },
  ] = await Promise.all([
    supabase
      .from("championships")
      .select("name, format, has_knockout_stage")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("teams")
      .select("id, name, crest_url")
      .eq("championship_id", id)
      .order("name"),
    supabase
      .from("championship_comments")
      .select("id, user_id, body, created_at")
      .eq("championship_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("games")
      .select(
        "id, round, team_a_id, team_b_id, played, score_a, score_b, penalty_score_a, penalty_score_b, date, created_at"
      )
      .eq("championship_id", id),
    supabase.from("card_events").select("game_id").eq("championship_id", id),
    supabase
      .from("players")
      .select("id, name, team_id, position")
      .eq("championship_id", id),
    supabase.from("goal_events").select("player_id").eq("championship_id", id),
  ]);

  const commenterIds = [...new Set((comments ?? []).map((c) => c.user_id))];
  const { data: commentProfiles } =
    commenterIds.length > 0
      ? await supabase
          .from("profiles")
          .select("user_id, first_name, last_name, avatar_url, persona")
          .in("user_id", commenterIds)
      : { data: [] };

  const allPlayers = players ?? [];
  const playerIds = allPlayers.map((p) => p.id);
  const { data: attributesRows } =
    playerIds.length > 0
      ? await supabase.from("player_attributes").select("player_id, ovr").in("player_id", playerIds)
      : { data: [] };

  const playedGames = (games ?? []).filter((g) => g.played);
  const totalGoals = playedGames.reduce(
    (sum, g) => sum + (g.score_a ?? 0) + (g.score_b ?? 0),
    0
  );
  const playedGameIds = new Set(playedGames.map((g) => g.id));
  const totalCards = (cards ?? []).filter((c) => playedGameIds.has(c.game_id)).length;

  const avgGoalsPerGame = playedGames.length > 0 ? totalGoals / playedGames.length : null;
  const avgCardsPerGame = playedGames.length > 0 ? totalCards / playedGames.length : null;

  const teamNameById = new Map((teams ?? []).map((t) => [t.id, t.name]));
  const teamCrestById = new Map((teams ?? []).map((t) => [t.id, t.crest_url]));
  const ovrByPlayer = new Map((attributesRows ?? []).map((a) => [a.player_id, a.ovr]));

  const topScorers = computeTopScorers(allPlayers, goals ?? [], teams ?? []).slice(0, 3);

  const standings = computeStandings(teams ?? [], games ?? []).filter((row) => row.j > 0);

  const streaks = computeStreaks(
    teams ?? [],
    (games ?? []).map((g) => ({
      team_a_id: g.team_a_id,
      team_b_id: g.team_b_id,
      score_a: g.score_a,
      score_b: g.score_b,
      played: g.played,
      orderKey: g.date ?? g.created_at,
    }))
  );

  const bestAttacks: TeamGoalsRow[] = [...standings]
    .sort((a, b) => b.gp - a.gp || a.teamName.localeCompare(b.teamName, "pt-BR"))
    .slice(0, 3)
    .map((row) => ({
      teamId: row.teamId,
      teamName: row.teamName,
      teamCrestUrl: row.teamCrestUrl,
      goals: row.gp,
    }));

  const bestDefenses: TeamGoalsRow[] = [...standings]
    .sort((a, b) => a.gc - b.gc || a.teamName.localeCompare(b.teamName, "pt-BR"))
    .slice(0, 3)
    .map((row) => ({
      teamId: row.teamId,
      teamName: row.teamName,
      teamCrestUrl: row.teamCrestUrl,
      goals: row.gc,
    }));

  const positionHighlights: PositionHighlight[] = PLAYER_POSITIONS.map((position) => {
    const best = allPlayers
      .filter((p) => p.position === position && ovrByPlayer.has(p.id))
      .sort((a, b) => (ovrByPlayer.get(b.id) ?? 0) - (ovrByPlayer.get(a.id) ?? 0))[0];

    return {
      position,
      player: best
        ? {
            id: best.id,
            name: best.name,
            teamName: teamNameById.get(best.team_id ?? "") ?? "Sem time",
            teamCrestUrl: teamCrestById.get(best.team_id ?? "") ?? null,
            ovr: ovrByPlayer.get(best.id) ?? 0,
          }
        : null,
    };
  });

  const championTeamId = computeChampionTeamId(
    championship?.has_knockout_stage ?? false,
    championship?.format ?? "liga",
    teams ?? [],
    games ?? []
  );
  const championTeam = (teams ?? []).find((t) => t.id === championTeamId) ?? null;

  return (
    <div className="space-y-10">
      {championTeam && (
        <ChampionCertificate
          championshipName={championship?.name ?? ""}
          teamName={championTeam.name}
          teamCrestUrl={championTeam.crest_url}
        />
      )}

      <div>
        <PageHeader eyebrow="Destaques" title="Visão geral do campeonato" />
        <OverviewHighlights
          playedGamesCount={playedGames.length}
          totalGoals={totalGoals}
          avgGoalsPerGame={avgGoalsPerGame}
          avgCardsPerGame={avgCardsPerGame}
          topScorers={topScorers}
          positionHighlights={positionHighlights}
          bestAttacks={bestAttacks}
          bestDefenses={bestDefenses}
          streaks={streaks}
        />
      </div>

      <CommentsSection
        championshipId={id}
        comments={comments ?? []}
        profiles={commentProfiles ?? []}
        currentUserId={user?.id ?? null}
      />
    </div>
  );
}
