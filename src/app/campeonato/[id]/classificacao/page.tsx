import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState, PageHeader } from "@/components/ui";
import { StandingsTable } from "@/components/standings-table";
import { computeStandings, computeYellowCardCounts } from "@/lib/standings";
import { naturalCompare } from "@/lib/datetime";
import { gamesWithinTeams, groupTeamsByFormat } from "@/lib/groups";
import { ExportImageButton } from "@/components/export-image-button";
import { ExportTableButtons } from "@/components/export-table-buttons";
import { BracketView } from "@/components/bracket-view";
import { Tabs } from "@/components/tabs";
import { isKnockoutRound } from "@/lib/bracket";

export default async function ClassificacaoPublicaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: championship }, { data: teams }, { data: gamesData }, { data: cardEvents }, { data: players }] =
    await Promise.all([
      supabase
        .from("championships")
        .select("format, has_knockout_stage")
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
        .eq("championship_id", id)
        .order("date", { ascending: true, nullsFirst: false }),
      supabase
        .from("card_events")
        .select("card_type, game_id, player_id")
        .eq("championship_id", id)
        .eq("card_type", "yellow"),
      supabase.from("players").select("id, team_id").eq("championship_id", id),
    ]);

  const games = gamesData
    ? [...gamesData].sort((a, b) => naturalCompare(a.round, b.round))
    : [];
  const groups = groupTeamsByFormat(championship?.format ?? "liga", teams ?? []);
  const teamName = (teamId: string) => teams?.find((t) => t.id === teamId)?.name ?? "?";

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
    "CA",
  ];
  const standingsRows = groups.flatMap((group) => {
    const groupGames = gamesWithinTeams(games, group.teams);
    const yellowCards = computeYellowCardCounts(
      cardEvents ?? [],
      players ?? [],
      new Set(groupGames.map((g) => g.id))
    );
    return computeStandings(group.teams, groupGames).map((row) => [
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
      yellowCards.get(row.teamId) ?? 0,
    ]);
  });

  let content: ReactNode = null;
  if (!teams || teams.length === 0) {
    content = <EmptyState>Ainda não há times cadastrados.</EmptyState>;
  } else {
    const groupStageContent = (
      <div id="classificacao-export" className="space-y-8 bg-background p-1">
        {groups.map((group) => {
          const groupGames = gamesWithinTeams(games, group.teams);
          return (
            <div key={group.groupName ?? "geral"}>
              {group.groupName && (
                <h2 className="mb-3 font-display text-base font-bold uppercase tracking-wide text-foreground">
                  {group.groupName}
                </h2>
              )}
              <StandingsTable
                standings={computeStandings(group.teams, groupGames)}
                teamHref={(teamId) => `/campeonato/${id}/time/${teamId}`}
                yellowCardsByTeam={computeYellowCardCounts(
                  cardEvents ?? [],
                  players ?? [],
                  new Set(groupGames.map((g) => g.id))
                )}
              />
            </div>
          );
        })}
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
      const groupStageGames = games.filter((g) => !isKnockoutRound(g.round));
      tabs.push({
        id: "geral",
        label: "Classificação Geral",
        content: (
          <StandingsTable
            standings={computeStandings(teams, groupStageGames)}
            teamHref={(teamId) => `/campeonato/${id}/time/${teamId}`}
            yellowCardsByTeam={computeYellowCardCounts(
              cardEvents ?? [],
              players ?? [],
              new Set(groupStageGames.map((g) => g.id))
            )}
          />
        ),
      });
    }

    if (championship?.has_knockout_stage) {
      tabs.push({
        id: "mata-mata",
        label: "Mata-mata",
        content: <BracketView games={games} teamName={teamName} />,
      });
    }

    content = tabs.length > 1 ? <Tabs tabs={tabs} /> : groupStageContent;
  }

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
      {content}
    </div>
  );
}
