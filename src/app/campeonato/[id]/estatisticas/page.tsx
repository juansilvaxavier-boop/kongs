import { createClient } from "@/lib/supabase/server";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { computeDiscipline, computeTopScorers } from "@/lib/stats";
import { computeSuspensions } from "@/lib/discipline";
import { TeamFilter } from "../team-filter";

export default async function EstatisticasPublicasPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ time?: string }>;
}) {
  const { id } = await params;
  const { time: teamFilter } = await searchParams;
  const supabase = await createClient();

  const [
    { data: championship },
    { data: playersData },
    { data: teams },
    { data: goals },
    { data: cards },
    { data: games },
  ] = await Promise.all([
    supabase
      .from("championships")
      .select("yellow_cards_for_suspension")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("players").select("id, name, team_id").eq("championship_id", id),
    supabase.from("teams").select("id, name").eq("championship_id", id).order("name"),
    supabase.from("goal_events").select("player_id").eq("championship_id", id),
    supabase
      .from("card_events")
      .select("player_id, card_type, game_id")
      .eq("championship_id", id),
    supabase
      .from("games")
      .select("id, team_a_id, team_b_id, date, round, played")
      .eq("championship_id", id),
  ]);

  const players = teamFilter
    ? (playersData ?? []).filter((p) => p.team_id === teamFilter)
    : playersData ?? [];

  const scorers = computeTopScorers(players, goals ?? [], teams ?? []);
  const discipline = computeDiscipline(players, cards ?? [], teams ?? []);
  const suspensions = computeSuspensions(
    players,
    cards ?? [],
    games ?? [],
    championship?.yellow_cards_for_suspension ?? 3
  );

  return (
    <div className="space-y-10">
      <PageHeader eyebrow="Estatísticas do campeonato" title="Estatísticas" />

      {teams && teams.length > 0 && (
        <div className="-mt-6">
          <TeamFilter teams={teams} />
        </div>
      )}

      <div>
        <h2 className="mb-3 font-display text-lg font-bold uppercase tracking-wide text-foreground">
          Artilharia
        </h2>
        {scorers.length === 0 ? (
          <EmptyState>Nenhum gol lançado ainda.</EmptyState>
        ) : (
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2/60 text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3">Jogador</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3 text-center">Gols</th>
                </tr>
              </thead>
              <tbody>
                {scorers.map((row) => (
                  <tr key={row.playerId} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium text-foreground">{row.playerName}</td>
                    <td className="px-4 py-3 text-muted">{row.teamName}</td>
                    <td className="px-4 py-3 text-center font-display text-base font-semibold text-accent">
                      {row.goals}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-bold uppercase tracking-wide text-foreground">
          Cartões
        </h2>
        {discipline.length === 0 ? (
          <EmptyState>Nenhum cartão lançado ainda.</EmptyState>
        ) : (
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2/60 text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3">Jogador</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3 text-center">Amarelos</th>
                  <th className="px-4 py-3 text-center">Vermelhos</th>
                  <th className="px-4 py-3">Situação</th>
                </tr>
              </thead>
              <tbody>
                {discipline.map((row) => {
                  const status = suspensions.get(row.playerId);
                  return (
                    <tr key={row.playerId} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-medium text-foreground">{row.playerName}</td>
                      <td className="px-4 py-3 text-muted">{row.teamName}</td>
                      <td className="px-4 py-3 text-center text-foreground">{row.yellow}</td>
                      <td className="px-4 py-3 text-center text-danger">{row.red}</td>
                      <td className="px-4 py-3">
                        {status?.suspended ? (
                          <Badge tone="warning">Suspenso</Badge>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}
