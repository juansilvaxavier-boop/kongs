import { createClient } from "@/lib/supabase/server";
import { EmptyState, PageHeader } from "@/components/ui";
import { StandingsTable } from "@/components/standings-table";
import { computeStandings } from "@/lib/standings";
import { gamesWithinTeams, groupTeamsByFormat } from "@/lib/groups";

export default async function ClassificacaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: championship }, { data: teams }, { data: games }] = await Promise.all([
    supabase.from("championships").select("format").eq("id", id).maybeSingle(),
    supabase
      .from("teams")
      .select("id, name, group_name")
      .eq("championship_id", id)
      .order("name"),
    supabase
      .from("games")
      .select("team_a_id, team_b_id, score_a, score_b, played")
      .eq("championship_id", id),
  ]);

  if (!teams || teams.length === 0) {
    return (
      <div>
        <PageHeader eyebrow="Tabela do campeonato" title="Classificação" />
        <EmptyState>
          Cadastre times e lance placares de jogos para ver a classificação.
        </EmptyState>
      </div>
    );
  }

  const groups = groupTeamsByFormat(championship?.format ?? "liga", teams);

  return (
    <div className="space-y-10">
      <PageHeader eyebrow="Tabela do campeonato" title="Classificação" />

      {groups.map((group) => (
        <div key={group.groupName ?? "geral"}>
          {group.groupName && (
            <h2 className="mb-3 font-display text-lg font-bold uppercase tracking-wide text-foreground">
              {group.groupName}
            </h2>
          )}
          <StandingsTable
            standings={computeStandings(
              group.teams,
              gamesWithinTeams(games ?? [], group.teams)
            )}
          />
        </div>
      ))}
    </div>
  );
}
