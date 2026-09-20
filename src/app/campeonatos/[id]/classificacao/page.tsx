import { createClient } from "@/lib/supabase/server";
import { EmptyState, PageHeader } from "@/components/ui";
import { StandingsTable } from "@/components/standings-table";
import { computeStandings } from "@/lib/standings";
import { gamesWithinTeams, groupTeamsByFormat } from "@/lib/groups";
import { ExportTableButtons } from "@/components/export-table-buttons";
import { BracketView } from "@/components/bracket-view";
import { Tabs } from "@/components/tabs";
import { isKnockoutRound } from "@/lib/bracket";
import { SortearGruposButton } from "./sortear-grupos-button";

export default async function ClassificacaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: championship }, { data: teams }, { data: games }] = await Promise.all([
    supabase
      .from("championships")
      .select("format, group_count, has_knockout_stage")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("teams")
      .select("id, name, crest_url, group_name")
      .eq("championship_id", id)
      .order("name"),
    supabase
      .from("games")
      .select(
        "id, round, team_a_id, team_b_id, date, score_a, score_b, penalty_score_a, penalty_score_b, played"
      )
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
  const teamName = (teamId: string) => teams.find((t) => t.id === teamId)?.name ?? "?";
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
    computeStandings(group.teams, gamesWithinTeams(games ?? [], group.teams)).map((row) => [
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

  const groupStageContent = (
    <div className="space-y-10">
      {groups.map((group) => (
        <div key={group.groupName ?? "geral"}>
          {group.groupName && (
            <h2 className="mb-3 font-display text-lg font-bold uppercase tracking-wide text-foreground">
              {group.groupName}
            </h2>
          )}
          <StandingsTable
            standings={computeStandings(group.teams, gamesWithinTeams(games ?? [], group.teams))}
          />
        </div>
      ))}
    </div>
  );

  const tabs = [
    {
      id: "grupos",
      label: hasMultipleGroups ? "Fase de Grupos" : "Classificação",
      content: groupStageContent,
    },
  ];

  if (hasMultipleGroups) {
    const groupStageGames = (games ?? []).filter((g) => !isKnockoutRound(g.round));
    tabs.push({
      id: "geral",
      label: "Classificação Geral",
      content: <StandingsTable standings={computeStandings(teams, groupStageGames)} />,
    });
  }

  if (championship?.has_knockout_stage) {
    tabs.push({
      id: "mata-mata",
      label: "Mata-mata",
      content: <BracketView games={games ?? []} teamName={teamName} />,
    });
  }

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Tabela do campeonato"
        title="Classificação"
        action={
          championship?.format === "copa" ? (
            <SortearGruposButton championshipId={id} />
          ) : undefined
        }
      />

      <ExportTableButtons
        fileName={`classificacao-${id}`}
        title="Classificação"
        columns={standingsColumns}
        rows={standingsRows}
      />

      {tabs.length > 1 ? <Tabs tabs={tabs} /> : groupStageContent}
    </div>
  );
}
