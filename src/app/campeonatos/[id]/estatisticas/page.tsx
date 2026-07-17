import { createClient } from "@/lib/supabase/server";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { TeamCell } from "@/components/team-cell";
import { computeDiscipline, computeTopScorers } from "@/lib/stats";
import { computeSuspensions } from "@/lib/discipline";

export default async function EstatisticasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: championship },
    { data: players },
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
    supabase.from("teams").select("id, name, crest_url").eq("championship_id", id),
    supabase.from("goal_events").select("player_id").eq("championship_id", id),
    supabase.from("card_events").select("player_id, card_type, game_id").eq("championship_id", id),
    supabase
      .from("games")
      .select("id, team_a_id, team_b_id, date, round, played")
      .eq("championship_id", id),
  ]);

  const scorers = computeTopScorers(players ?? [], goals ?? [], teams ?? []);
  const discipline = computeDiscipline(players ?? [], cards ?? [], teams ?? []);
  const suspensions = computeSuspensions(
    players ?? [],
    cards ?? [],
    games ?? [],
    championship?.yellow_cards_for_suspension ?? 3
  );

  return (
    <div className="space-y-10">
      <div>
        <PageHeader eyebrow="Estatísticas do campeonato" title="Artilharia" />
        {scorers.length === 0 ? (
          <EmptyState>
            Nenhum gol lançado ainda. Lance gols na aba Jogos, em &quot;Súmula&quot;.
          </EmptyState>
        ) : (
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[24rem] text-sm">
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
                    <td className="px-4 py-3 text-muted">
                      <TeamCell name={row.teamName} crestUrl={row.teamCrestUrl} />
                    </td>
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
        <p className="mb-4 text-sm text-muted">
          Suspende automaticamente ao acumular{" "}
          {championship?.yellow_cards_for_suspension ?? 3} cartões amarelos, ou
          com 1 cartão vermelho. A situação é apenas informativa e considera o
          último jogo disputado pelo time.
        </p>
        {discipline.length === 0 ? (
          <EmptyState>Nenhum cartão lançado ainda.</EmptyState>
        ) : (
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[32rem] text-sm">
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
                      <td className="px-4 py-3 text-muted">
                      <TeamCell name={row.teamName} crestUrl={row.teamCrestUrl} />
                    </td>
                      <td className="px-4 py-3 text-center text-foreground">{row.yellow}</td>
                      <td className="px-4 py-3 text-center text-danger">{row.red}</td>
                      <td className="px-4 py-3">
                        {status?.suspended ? (
                          <Badge tone="warning">
                            {status.reason === "red"
                              ? "Suspenso (vermelho)"
                              : "Suspenso (amarelos)"}
                          </Badge>
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
