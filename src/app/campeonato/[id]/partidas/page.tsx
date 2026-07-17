import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { TeamCell } from "@/components/team-cell";
import { naturalCompare } from "@/lib/datetime";
import { TeamFilter } from "../team-filter";

export default async function PartidasPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ time?: string }>;
}) {
  const { id } = await params;
  const { time: teamFilter } = await searchParams;
  const supabase = await createClient();

  const [{ data: championship }, { data: teams }, { data: gamesData }] = await Promise.all([
    supabase
      .from("championships")
      .select("has_knockout_stage")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("teams")
      .select("id, name, crest_url")
      .eq("championship_id", id)
      .order("name"),
    supabase
      .from("games")
      .select("id, round, team_a_id, team_b_id, date, score_a, score_b, played")
      .eq("championship_id", id)
      .order("date", { ascending: true, nullsFirst: false }),
  ]);

  const allGames = gamesData
    ? [...gamesData].sort((a, b) => naturalCompare(a.round, b.round))
    : [];
  const games = teamFilter
    ? allGames.filter((g) => g.team_a_id === teamFilter || g.team_b_id === teamFilter)
    : allGames;

  const teamName = (teamId: string) => teams?.find((t) => t.id === teamId)?.name ?? "?";
  const teamCrest = (teamId: string) => teams?.find((t) => t.id === teamId)?.crest_url ?? null;

  return (
    <div>
      <PageHeader
        eyebrow="Resultados e agenda"
        title="Partidas"
        action={
          championship?.has_knockout_stage ? (
            <Link
              href={`/campeonato/${id}/chaveamento`}
              className="text-sm text-accent hover:underline"
            >
              Ver chaveamento →
            </Link>
          ) : undefined
        }
      />

      {teams && teams.length > 0 && (
        <div className="mb-4">
          <TeamFilter teams={teams} />
        </div>
      )}

      {games.length === 0 ? (
        <EmptyState>Nenhum jogo agendado ainda.</EmptyState>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2/60 text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3">Rodada</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Confronto</th>
                <th className="px-4 py-3">Placar</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {games.map((game) => (
                <tr key={game.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-foreground">{game.round}</td>
                  <td className="px-4 py-3 text-muted">
                    {game.date
                      ? new Date(game.date).toLocaleString("pt-BR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })
                      : "—"}
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <TeamCell name={teamName(game.team_a_id)} crestUrl={teamCrest(game.team_a_id)} />
                      <span className="text-muted">x</span>
                      <TeamCell name={teamName(game.team_b_id)} crestUrl={teamCrest(game.team_b_id)} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    {game.played ? `${game.score_a} - ${game.score_b}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={game.played ? "success" : "warning"}>
                      {game.played ? "Realizado" : "Agendado"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
