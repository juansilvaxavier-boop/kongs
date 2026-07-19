import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TelaoDisplay } from "./telao-display";

export default async function TelaoGamePage({
  params,
}: {
  params: Promise<{ id: string; gameId: string }>;
}) {
  const { id, gameId } = await params;
  const supabase = await createClient();

  const { data: game } = await supabase
    .from("games")
    .select("id, round, team_a_id, team_b_id, score_a, score_b, played, venue_id")
    .eq("id", gameId)
    .eq("championship_id", id)
    .maybeSingle();

  if (!game) notFound();

  const [{ data: teams }, { data: venue }, { data: players }, { data: goalEvents }, { data: cardEvents }] =
    await Promise.all([
      supabase
        .from("teams")
        .select("id, name, crest_url")
        .in("id", [game.team_a_id, game.team_b_id]),
      game.venue_id
        ? supabase.from("venues").select("name").eq("id", game.venue_id).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("players")
        .select("id, name, team_id")
        .in("team_id", [game.team_a_id, game.team_b_id]),
      supabase
        .from("goal_events")
        .select("id, player_id, minute")
        .eq("game_id", gameId),
      supabase
        .from("card_events")
        .select("id, player_id, card_type, minute")
        .eq("game_id", gameId),
    ]);

  const teamA = teams?.find((t) => t.id === game.team_a_id);
  const teamB = teams?.find((t) => t.id === game.team_b_id);

  return (
    <TelaoDisplay
      gameId={gameId}
      round={game.round}
      venueName={venue?.name ?? null}
      teamAId={game.team_a_id}
      teamAName={teamA?.name ?? "?"}
      teamACrestUrl={teamA?.crest_url ?? null}
      teamBId={game.team_b_id}
      teamBName={teamB?.name ?? "?"}
      teamBCrestUrl={teamB?.crest_url ?? null}
      initialScoreA={game.score_a}
      initialScoreB={game.score_b}
      initialPlayed={game.played}
      players={players ?? []}
      initialGoalEvents={goalEvents ?? []}
      initialCardEvents={cardEvents ?? []}
    />
  );
}
