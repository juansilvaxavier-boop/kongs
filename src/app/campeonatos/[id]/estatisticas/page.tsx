import { createClient } from "@/lib/supabase/server";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { computeDiscipline, computeTopScorers } from "@/lib/stats";

export default async function EstatisticasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: players }, { data: teams }, { data: goals }, { data: cards }] =
    await Promise.all([
      supabase.from("players").select("id, name, team_id").eq("championship_id", id),
      supabase.from("teams").select("id, name").eq("championship_id", id),
      supabase.from("goal_events").select("player_id").eq("championship_id", id),
      supabase.from("card_events").select("player_id, card_type").eq("championship_id", id),
    ]);

  const scorers = computeTopScorers(players ?? [], goals ?? [], teams ?? []);
  const discipline = computeDiscipline(players ?? [], cards ?? [], teams ?? []);

  return (
    <div className="space-y-10">
      <div>
        <PageHeader eyebrow="Estatísticas do campeonato" title="Artilharia" />
        {scorers.length === 0 ? (
          <EmptyState>
            Nenhum gol lançado ainda. Lance gols na aba Jogos, em &quot;Eventos&quot;.
          </EmptyState>
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
        <PageHeader eyebrow="Estatísticas do campeonato" title="Cartões" />
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
                </tr>
              </thead>
              <tbody>
                {discipline.map((row) => (
                  <tr key={row.playerId} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium text-foreground">{row.playerName}</td>
                    <td className="px-4 py-3 text-muted">{row.teamName}</td>
                    <td className="px-4 py-3 text-center text-foreground">{row.yellow}</td>
                    <td className="px-4 py-3 text-center text-danger">{row.red}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}
