import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { computeTopScorers } from "@/lib/stats";
import { PLAYER_POSITIONS } from "@/lib/positions";
import { CommentsSection } from "../comments-section";
import { OverviewHighlights, type PositionHighlight } from "../overview-highlights";

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
    { data: teams },
    { data: comments },
    { data: games },
    { data: cards },
    { data: players },
    { data: goals },
  ] = await Promise.all([
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
      .select("id, played, score_a, score_b")
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

  return (
    <div className="space-y-10">
      <div>
        <PageHeader eyebrow="Destaques" title="Visão geral do campeonato" />
        <OverviewHighlights
          avgGoalsPerGame={avgGoalsPerGame}
          avgCardsPerGame={avgCardsPerGame}
          topScorers={topScorers}
          positionHighlights={positionHighlights}
        />
      </div>

      <div>
        <PageHeader eyebrow="Clubes" title="Times" />
        {teams && teams.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <Link key={team.id} href={`/campeonato/${id}/time/${team.id}`}>
                <Card className="flex items-center gap-3 p-4 transition hover:border-accent/50">
                  {team.crest_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={team.crest_url}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-sm font-bold text-muted">
                      {team.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <span className="font-medium text-foreground">{team.name}</span>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState>Nenhum time cadastrado ainda.</EmptyState>
        )}
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
