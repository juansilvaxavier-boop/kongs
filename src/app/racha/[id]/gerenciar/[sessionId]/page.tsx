import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BrandMark, Card, PageHeader } from "@/components/ui";
import { SocialLinks } from "@/components/social-links";
import { ThemeToggle } from "@/components/theme-toggle";
import type { RachaClockStatus } from "@/lib/racha-clock";
import { RachaSessionPanel } from "./racha-session-panel";

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
  });
}

export default async function RachaSessionGerenciarPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const { id, sessionId } = await params;
  const supabase = await createClient();

  const [{ data: championship }, { data: isAdmin }, { data: session }] = await Promise.all([
    supabase.from("championships").select("id, name, kind").eq("id", id).maybeSingle(),
    supabase.rpc("is_championship_admin", { p_championship_id: id }),
    supabase
      .from("racha_sessions")
      .select("id, session_date, status, clock_status, clock_started_at, clock_accumulated_seconds, game_id")
      .eq("id", sessionId)
      .eq("championship_id", id)
      .maybeSingle(),
  ]);

  if (!championship || championship.kind !== "racha" || !session) notFound();
  if (!isAdmin) {
    return (
      <main className="pitch-lines flex min-h-dvh flex-1 flex-col">
        <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
          <PageHeader eyebrow="Racha" title={championship.name} />
          <Card className="p-5 text-sm text-muted">Você não tem permissão para gerenciar este racha.</Card>
        </div>
      </main>
    );
  }

  const [{ data: teams }, { data: players }, { data: confirmations }, { data: game }] = await Promise.all([
    supabase.from("teams").select("id, name").eq("championship_id", id).order("name"),
    supabase.from("players").select("id, name, position, team_id").eq("championship_id", id),
    supabase
      .from("racha_session_confirmations")
      .select("player_id, confirmed")
      .eq("session_id", sessionId)
      .eq("confirmed", true),
    session.game_id
      ? supabase.from("games").select("id, score_a, score_b").eq("id", session.game_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const [{ data: goalEvents }, { data: cardEvents }] = await Promise.all([
    session.game_id
      ? supabase.from("goal_events").select("id, player_id").eq("game_id", session.game_id)
      : Promise.resolve({ data: [] }),
    session.game_id
      ? supabase.from("card_events").select("id, player_id, card_type").eq("game_id", session.game_id)
      : Promise.resolve({ data: [] }),
  ]);

  const [teamA, teamB] = teams ?? [];

  return (
    <main className="pitch-lines flex min-h-dvh flex-1 flex-col">
      <header className="border-b border-border bg-surface/70 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 px-4 py-4 sm:px-6">
          <Link href={`/racha/${id}/gerenciar`} className="flex items-center gap-2">
            <BrandMark />
            <span className="font-display text-lg font-bold uppercase tracking-wide">Kong&apos;s Game</span>
          </Link>
          <div className="flex items-center gap-2">
            <SocialLinks />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-4xl flex-1 space-y-6 px-4 py-8 sm:px-6">
        <PageHeader
          eyebrow={championship.name}
          title={formatDate(session.session_date)}
          action={
            <Link
              href={`/racha/${id}/gerenciar`}
              className="font-display text-sm font-bold uppercase tracking-wide text-accent hover:underline"
            >
              ← Sessões
            </Link>
          }
        />

        {!teamA || !teamB ? (
          <Card className="p-5 text-sm text-muted">Times não encontrados para este racha.</Card>
        ) : (
          <RachaSessionPanel
            championshipId={id}
            sessionId={sessionId}
            sessionStatus={session.status}
            clockStatus={session.clock_status as RachaClockStatus}
            clockStartedAt={session.clock_started_at}
            clockAccumulatedSeconds={session.clock_accumulated_seconds}
            teamAId={teamA.id}
            teamAName={teamA.name}
            teamBId={teamB.id}
            teamBName={teamB.name}
            players={players ?? []}
            goalEvents={goalEvents ?? []}
            cardEvents={cardEvents ?? []}
            confirmedCount={(confirmations ?? []).length}
            scoreA={game?.score_a ?? null}
            scoreB={game?.score_b ?? null}
          />
        )}
      </div>
    </main>
  );
}
