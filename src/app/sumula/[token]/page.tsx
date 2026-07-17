import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BrandMark, Card, PageHeader } from "@/components/ui";
import { SumulaPublicPanel } from "./sumula-public-panel";

export default async function SumulaPublicPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: gameRows, error: gameError } = await supabase.rpc("sumula_get_game", {
    p_token: token,
  });
  if (gameError || !gameRows || gameRows.length === 0) notFound();

  const game = gameRows[0];

  const [{ data: players }, { data: goalEvents }, { data: cardEvents }] = await Promise.all([
    supabase
      .from("players")
      .select("id, name, team_id, number")
      .in("team_id", [game.team_a_id, game.team_b_id]),
    supabase
      .from("goal_events")
      .select("id, player_id, minute, game_id")
      .eq("game_id", game.game_id),
    supabase
      .from("card_events")
      .select("id, player_id, card_type, minute, game_id")
      .eq("game_id", game.game_id),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        <BrandMark />
        <span className="font-display text-sm font-bold uppercase tracking-wide text-muted">
          {game.championship_name}
        </span>
      </div>
      <PageHeader
        eyebrow={`Súmula digital · ${game.round}`}
        title={`${game.team_a_name} x ${game.team_b_name}`}
      />
      <Card className="p-5">
        <SumulaPublicPanel
          token={token}
          teamAId={game.team_a_id}
          teamBId={game.team_b_id}
          scoreA={game.score_a}
          scoreB={game.score_b}
          played={game.played}
          players={players ?? []}
          goalEvents={goalEvents ?? []}
          cardEvents={cardEvents ?? []}
        />
      </Card>
    </div>
  );
}
