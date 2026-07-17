import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { StandingsTable } from "@/components/standings-table";
import { computeStandings } from "@/lib/standings";
import { computeTopScorers } from "@/lib/stats";
import { naturalCompare } from "@/lib/datetime";
import { gamesWithinTeams, groupTeamsByFormat } from "@/lib/groups";
import { ExportImageButton } from "@/components/export-image-button";
import { CommentsSection } from "./comments-section";

export default async function PublicChampionshipPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: championship }, { data: teams }, { data: gamesData }, { data: players }, { data: goals }, { data: comments }] =
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
        .select("id, round, team_a_id, team_b_id, date, score_a, score_b, played")
        .eq("championship_id", id)
        .order("date", { ascending: true, nullsFirst: false }),
      supabase.from("players").select("id, name, team_id").eq("championship_id", id),
      supabase.from("goal_events").select("player_id").eq("championship_id", id),
      supabase
        .from("championship_comments")
        .select("id, user_id, body, created_at")
        .eq("championship_id", id)
        .order("created_at", { ascending: false }),
    ]);

  const commenterIds = [...new Set((comments ?? []).map((c) => c.user_id))];
  const { data: commentProfiles } =
    commenterIds.length > 0
      ? await supabase
          .from("profiles")
          .select("user_id, display_name, avatar_url, persona")
          .in("user_id", commenterIds)
      : { data: [] };

  const games = gamesData
    ? [...gamesData].sort((a, b) => naturalCompare(a.round, b.round))
    : [];

  const scorers = computeTopScorers(players ?? [], goals ?? [], teams ?? []);
  const teamName = (teamId: string) =>
    teams?.find((t) => t.id === teamId)?.name ?? "?";
  const groups = groupTeamsByFormat(championship?.format ?? "liga", teams ?? []);

  return (
    <div className="space-y-10">
      <div className="space-y-8">
        <PageHeader
          eyebrow="Tabela do campeonato"
          title="Classificação"
          action={
            teams && teams.length > 0 ? (
              <ExportImageButton
                targetId="classificacao-export"
                fileName={`classificacao-${id}`}
              />
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

      <div>
        <PageHeader
          eyebrow="Resultados e agenda"
          title="Jogos"
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
                      {teamName(game.team_a_id)} x {teamName(game.team_b_id)}
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

      {scorers.length > 0 && (
        <div>
          <PageHeader eyebrow="Estatísticas" title="Artilharia" />
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
        </div>
      )}

      <div>
        <PageHeader eyebrow="Clubes" title="Times" />
        {teams && teams.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <Link key={team.id} href={`/campeonato/${id}/time/${team.id}`}>
                <Card className="flex items-center gap-3 p-4 transition hover:border-accent/50">
                  {team.crest_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={team.crest_url}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-sm font-bold text-muted">
                      {team.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <span className="font-medium text-foreground">{team.name}</span>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState>Nenhum time cadastrado ainda.</EmptyState>
        )}
      </div>

      <CommentsSection
        championshipId={id}
        comments={comments ?? []}
        profiles={commentProfiles ?? []}
        currentUserId={user?.id ?? null}
      />
    </div>
  );
}
