import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BrandMark, Card, PageHeader } from "@/components/ui";
import { SumulaGamePanel } from "./sumula-game-panel";

export default async function SumulaGamePage({
  params,
}: {
  params: Promise<{ token: string; gameId: string }>;
}) {
  const { token, gameId } = await params;
  const supabase = await createClient();

  const [{ data: championshipRows }, { data: gameRows, error: gameError }] = await Promise.all([
    supabase.rpc("sumula_get_championship", { p_token: token }),
    supabase.rpc("sumula_get_game", { p_token: token, p_game_id: gameId }),
  ]);

  if (gameError || !gameRows || gameRows.length === 0) notFound();
  const game = gameRows[0];
  const championshipName = championshipRows?.[0]?.championship_name ?? "";

  const [
    { data: players },
    { data: goalEvents },
    { data: cardEvents },
    { data: lineups },
    { data: signatures },
  ] = await Promise.all([
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
    supabase
      .from("game_lineups")
      .select("player_id, confirmed, shirt_number")
      .eq("game_id", game.game_id),
    supabase
      .from("game_captain_signatures")
      .select("team_id, captain_name, signature_data_url, signed_at")
      .eq("game_id", game.game_id),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        <BrandMark />
        <span className="font-display text-sm font-bold uppercase tracking-wide text-muted">
          {championshipName}
        </span>
      </div>
      <Link href={`/sumula/${token}`} className="mb-4 inline-block text-sm text-accent hover:underline">
        ← Escolher outro jogo
      </Link>
      <PageHeader
        eyebrow={`Súmula digital · ${game.round}`}
        title={`${game.team_a_name} x ${game.team_b_name}`}
      />
      <Card className="p-5">
        <SumulaGamePanel
          token={token}
          gameId={game.game_id}
          round={game.round}
          teamAId={game.team_a_id}
          teamAName={game.team_a_name}
          teamBId={game.team_b_id}
          teamBName={game.team_b_name}
          scoreA={game.score_a}
          scoreB={game.score_b}
          penaltyScoreA={game.penalty_score_a}
          penaltyScoreB={game.penalty_score_b}
          walkoverTeamId={game.walkover_team_id}
          played={game.played}
          players={players ?? []}
          goalEvents={goalEvents ?? []}
          cardEvents={cardEvents ?? []}
          confirmedPlayerIds={new Set((lineups ?? []).filter((l) => l.confirmed).map((l) => l.player_id))}
          shirtNumbers={Object.fromEntries(
            (lineups ?? [])
              .filter((l) => l.shirt_number !== null)
              .map((l) => [l.player_id, l.shirt_number as number])
          )}
          signatures={Object.fromEntries(
            (signatures ?? []).map((s) => [
              s.team_id,
              {
                captainName: s.captain_name,
                signatureDataUrl: s.signature_data_url,
                signedAt: s.signed_at,
              },
            ])
          )}
        />
      </Card>
    </div>
  );
}
