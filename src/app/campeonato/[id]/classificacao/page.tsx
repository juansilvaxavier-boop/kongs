import { createClient } from "@/lib/supabase/server";
import { EmptyState, PageHeader } from "@/components/ui";
import { StandingsTable } from "@/components/standings-table";
import { computeStandings } from "@/lib/standings";
import { naturalCompare } from "@/lib/datetime";
import { gamesWithinTeams, groupTeamsByFormat } from "@/lib/groups";
import { ExportImageButton } from "@/components/export-image-button";
import { ExportTableButtons } from "@/components/export-table-buttons";

export default async function ClassificacaoPublicaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: championship }, { data: teams }, { data: gamesData }] = await Promise.all([
    supabase
      .from("championships")
      .select("format")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("teams")
      .select("id, name, crest_url, group_name")
      .eq("championship_id", id)
      .order("name"),
    supabase
      .from("games")
      .select("id, round, team_a_id, team_b_id, date, score_a, score_b, played")
      .eq("championship_id", id)
      .order("date", { ascending: true, nullsFirst: false }),
  ]);

  const games = gamesData
    ? [...gamesData].sort((a, b) => naturalCompare(a.round, b.round))
    : [];
  const groups = groupTeamsByFormat(championship?.format ?? "liga", teams ?? []);

  const hasMultipleGroups = groups.length > 1;
  const standingsColumns = [
    ...(hasMultipleGroups ? ["Grupo"] : []),
    "Pos",
    "Time",
    "Pts",
    "J",
    "V",
    "E",
    "D",
    "GP",
    "GC",
    "SG",
  ];
  const standingsRows = groups.flatMap((group) =>
    computeStandings(group.teams, gamesWithinTeams(games, group.teams)).map((row) => [
      ...(hasMultipleGroups ? [group.groupName ?? "Geral"] : []),
      row.pos,
      row.teamName,
      row.pts,
      row.j,
      row.v,
      row.e,
      row.d,
      row.gp,
      row.gc,
      row.sg,
    ])
  );

  return (
    <div>
      <PageHeader
        eyebrow="Tabela do campeonato"
        title="Classificação"
        action={
          teams && teams.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <ExportImageButton
                targetId="classificacao-export"
                fileName={`classificacao-${id}`}
              />
              <ExportTableButtons
                fileName={`classificacao-${id}`}
                title="Classificação"
                columns={standingsColumns}
                rows={standingsRows}
              />
            </div>
          ) : undefined
        }
      />
      {!teams || teams.length === 0 ? (
        <EmptyState>Ainda não há times cadastrados.</EmptyState>
      ) : (
        <div id="classificacao-export" className="space-y-8 bg-background p-1">
          {groups.map((group) => (
            <div key={group.groupName ?? "geral"}>
              {group.groupName && (
                <h2 className="mb-3 font-display text-base font-bold uppercase tracking-wide text-foreground">
                  {group.groupName}
                </h2>
              )}
              <StandingsTable
                standings={computeStandings(group.teams, gamesWithinTeams(games, group.teams))}
                teamHref={(teamId) => `/campeonato/${id}/time/${teamId}`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
