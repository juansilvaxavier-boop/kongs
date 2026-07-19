import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BrandMark, Card, EmptyState, PageHeader } from "@/components/ui";
import { TeamCell } from "@/components/team-cell";
import { naturalCompare } from "@/lib/datetime";

export default async function TelaoPickerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: championship }, { data: teams }, { data: gamesData }] = await Promise.all([
    supabase.from("championships").select("name").eq("id", id).maybeSingle(),
    supabase
      .from("teams")
      .select("id, name, crest_url")
      .eq("championship_id", id),
    supabase
      .from("games")
      .select("id, round, team_a_id, team_b_id, played")
      .eq("championship_id", id),
  ]);

  const games = (gamesData ?? []).slice().sort((a, b) => naturalCompare(a.round, b.round));
  const teamName = (teamId: string) => teams?.find((t) => t.id === teamId)?.name ?? "?";
  const teamCrest = (teamId: string) => teams?.find((t) => t.id === teamId)?.crest_url ?? null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        <BrandMark />
        <span className="font-display text-sm font-bold uppercase tracking-wide text-muted">
          {championship?.name}
        </span>
      </div>
      <PageHeader eyebrow="Modo telão" title="Escolha um jogo" />
      {games.length === 0 ? (
        <EmptyState>Nenhum jogo agendado ainda.</EmptyState>
      ) : (
        <div className="flex flex-col gap-2">
          {games.map((game) => (
            <Link key={game.id} href={`/telao/${id}/${game.id}`}>
              <Card className="flex items-center justify-between gap-3 p-4 transition hover:border-accent/50">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted">{game.round}</p>
                  <div className="mt-1 flex items-center gap-2 font-medium text-foreground">
                    <TeamCell name={teamName(game.team_a_id)} crestUrl={teamCrest(game.team_a_id)} />
                    <span className="text-muted">x</span>
                    <TeamCell name={teamName(game.team_b_id)} crestUrl={teamCrest(game.team_b_id)} />
                  </div>
                </div>
                <span className="text-sm text-accent">
                  {game.played ? "Ver placar →" : "Abrir telão →"}
                </span>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
