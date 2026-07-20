import { createClient } from "@/lib/supabase/server";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { TeamCell } from "@/components/team-cell";
import { ExportTableButtons } from "@/components/export-table-buttons";
import { computeDiscipline, computeTopScorers } from "@/lib/stats";
import { computeSuspensions } from "@/lib/discipline";
import { computeStandings } from "@/lib/standings";
import { computeStreaks } from "@/lib/streaks";
import { computeStandingsByRound } from "@/lib/round-standings";
import { naturalCompare } from "@/lib/datetime";
import { TeamFilter } from "../team-filter";
import { PlayerComparator, type ComparablePlayer } from "./player-comparator";
import { TeamComparator } from "./team-comparator";
import { TeamOfTheRoundSection, type RoundPlayerInfo } from "./team-of-the-round-section";
import type { RoundOvrEntry } from "@/lib/team-of-the-round";

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
    supabase
      .from("players")
      .select("id, name, team_id, position, photo_url")
      .eq("championship_id", id),
    supabase
      .from("teams")
      .select("id, name, crest_url")
      .eq("championship_id", id)
      .order("name"),
    supabase.from("goal_events").select("player_id").eq("championship_id", id),
    supabase
      .from("card_events")
      .select("player_id, card_type, game_id")
      .eq("championship_id", id),
    supabase
      .from("games")
      .select("id, team_a_id, team_b_id, date, created_at, round, played, score_a, score_b")
      .eq("championship_id", id),
  ]);

  const allPlayers = playersData ?? [];
  const playerIds = allPlayers.map((p) => p.id);

  const [{ data: attributesRows }, { data: historyRows }] = await Promise.all([
    playerIds.length > 0
      ? supabase
          .from("player_attributes")
          .select("player_id, ovr, ritmo, finalizacao, passe, drible, defesa, fisico")
          .in("player_id", playerIds)
      : Promise.resolve({ data: [] }),
    playerIds.length > 0
      ? supabase
          .from("ovr_history")
          .select("player_id, round, delta")
          .in("player_id", playerIds)
      : Promise.resolve({ data: [] }),
  ]);

  const players = teamFilter
    ? allPlayers.filter((p) => p.team_id === teamFilter)
    : allPlayers;

  const scorers = computeTopScorers(players, goals ?? [], teams ?? []);
  const discipline = computeDiscipline(players, cards ?? [], teams ?? []);
  const suspensions = computeSuspensions(
    players,
    cards ?? [],
    games ?? [],
    championship?.yellow_cards_for_suspension ?? 3
  );

  const teamNameById = new Map((teams ?? []).map((t) => [t.id, t.name]));
  const teamCrestById = new Map((teams ?? []).map((t) => [t.id, t.crest_url]));
  const attributesByPlayer = new Map((attributesRows ?? []).map((a) => [a.player_id, a]));

  const comparablePlayers: ComparablePlayer[] = players.map((player) => {
    const attrs = attributesByPlayer.get(player.id);
    return {
      id: player.id,
      name: player.name,
      teamName: teamNameById.get(player.team_id ?? "") ?? "Sem time",
      position: player.position,
      photoUrl: player.photo_url,
      crestUrl: teamCrestById.get(player.team_id ?? "") ?? null,
      attributes: {
        ovr: attrs?.ovr ?? 70,
        ritmo: attrs?.ritmo ?? 70,
        finalizacao: attrs?.finalizacao ?? 70,
        passe: attrs?.passe ?? 70,
        drible: attrs?.drible ?? 70,
        defesa: attrs?.defesa ?? 70,
        fisico: attrs?.fisico ?? 70,
      },
    };
  });

  const playersById: Record<string, RoundPlayerInfo> = {};
  for (const player of comparablePlayers) {
    playersById[player.id] = {
      name: player.name,
      photoUrl: player.photoUrl,
      crestUrl: player.crestUrl,
      attributes: player.attributes,
    };
  }

  const positionByPlayer = new Map(allPlayers.map((p) => [p.id, p.position]));
  const entriesByRound: Record<string, RoundOvrEntry[]> = {};
  for (const entry of historyRows ?? []) {
    if (!entry.round) continue;
    const position = positionByPlayer.get(entry.player_id);
    if (!position) continue;
    if (!entriesByRound[entry.round]) entriesByRound[entry.round] = [];
    entriesByRound[entry.round].push({
      playerId: entry.player_id,
      position,
      delta: entry.delta,
    });
  }
  const rounds = Object.keys(entriesByRound).sort(naturalCompare);

  const topPlayersByOvr = [...comparablePlayers]
    .sort((a, b) => b.attributes.ovr - a.attributes.ovr)
    .slice(0, 10);

  const comparableTeams = computeStandings(teams ?? [], games ?? []).map((row) => ({
    teamId: row.teamId,
    teamName: row.teamName,
    teamCrestUrl: row.teamCrestUrl,
    pts: row.pts,
    j: row.j,
    v: row.v,
    e: row.e,
    d: row.d,
    gp: row.gp,
    gc: row.gc,
    sg: row.sg,
  }));

  const streaks = computeStreaks(
    teams ?? [],
    (games ?? []).map((g) => ({
      team_a_id: g.team_a_id,
      team_b_id: g.team_b_id,
      score_a: g.score_a,
      score_b: g.score_b,
      played: g.played,
      orderKey: g.date ?? g.created_at,
    }))
  ).sort((a, b) => b.unbeatenStreak - a.unbeatenStreak || b.winStreak - a.winStreak);

  const roundSnapshots = computeStandingsByRound(
    teams ?? [],
    (games ?? []).map((g) => ({
      team_a_id: g.team_a_id,
      team_b_id: g.team_b_id,
      score_a: g.score_a,
      score_b: g.score_b,
      played: g.played,
      round: g.round,
    }))
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
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide text-foreground">
            Artilharia
          </h2>
          {scorers.length > 0 && (
            <ExportTableButtons
              fileName={`artilharia-${id}`}
              title="Artilharia"
              columns={["Jogador", "Time", "Gols"]}
              rows={scorers.map((row) => [row.playerName, row.teamName, row.goals])}
            />
          )}
        </div>
        {scorers.length === 0 ? (
          <EmptyState>Nenhum gol lançado ainda.</EmptyState>
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
                    <td className="px-4 py-3 text-muted"><TeamCell name={row.teamName} crestUrl={row.teamCrestUrl} /></td>
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
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide text-foreground">
            Cartões
          </h2>
          {discipline.length > 0 && (
            <ExportTableButtons
              fileName={`cartoes-${id}`}
              title="Cartões"
              columns={["Jogador", "Time", "Amarelos", "Vermelhos", "Situação"]}
              rows={discipline.map((row) => {
                const status = suspensions.get(row.playerId);
                const situacao = status?.suspended
                  ? "Suspenso"
                  : status?.pendingSuspension
                    ? "Pendurado"
                    : "—";
                return [row.playerName, row.teamName, row.yellow, row.red, situacao];
              })}
            />
          )}
        </div>
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
                      <td className="px-4 py-3 text-muted"><TeamCell name={row.teamName} crestUrl={row.teamCrestUrl} /></td>
                      <td className="px-4 py-3 text-center text-foreground">{row.yellow}</td>
                      <td className="px-4 py-3 text-center text-danger">{row.red}</td>
                      <td className="px-4 py-3">
                        {status?.suspended ? (
                          <Badge tone="warning">Suspenso</Badge>
                        ) : status?.pendingSuspension ? (
                          <Badge tone="default">Pendurado</Badge>
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

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide text-foreground">
            Melhores jogadores (overall)
          </h2>
          {topPlayersByOvr.length > 0 && (
            <ExportTableButtons
              fileName={`melhores-jogadores-${id}`}
              title="Melhores jogadores (overall)"
              columns={["#", "Jogador", "Time", "Posição", "Overall"]}
              rows={topPlayersByOvr.map((player, index) => [
                index + 1,
                player.name,
                player.teamName,
                player.position ?? "—",
                Math.round(player.attributes.ovr),
              ])}
            />
          )}
        </div>
        {topPlayersByOvr.length === 0 ? (
          <EmptyState>Nenhum jogador cadastrado ainda.</EmptyState>
        ) : (
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[28rem] text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2/60 text-left text-xs uppercase tracking-wide text-muted">
                  <th className="w-10 px-4 py-3">#</th>
                  <th className="px-4 py-3">Jogador</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Posição</th>
                  <th className="px-4 py-3 text-center">Overall</th>
                </tr>
              </thead>
              <tbody>
                {topPlayersByOvr.map((player, index) => (
                  <tr key={player.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-muted">{index + 1}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{player.name}</td>
                    <td className="px-4 py-3 text-muted">
                      <TeamCell name={player.teamName} crestUrl={player.crestUrl} />
                    </td>
                    <td className="px-4 py-3 text-muted">{player.position ?? "—"}</td>
                    <td className="px-4 py-3 text-center font-display text-base font-semibold text-accent">
                      {Math.round(player.attributes.ovr)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide text-foreground">
            Sequências
          </h2>
          {streaks.length > 0 && (
            <ExportTableButtons
              fileName={`sequencias-${id}`}
              title="Sequências"
              columns={["Time", "Invencibilidade", "Vitórias seguidas", "Jogos sem sofrer gol", "Jejum de gols"]}
              rows={streaks.map((row) => [
                row.teamName,
                row.unbeatenStreak,
                row.winStreak,
                row.cleanSheetStreak,
                row.scoringDroughtStreak,
              ])}
            />
          )}
        </div>
        {streaks.length === 0 ? (
          <EmptyState>Nenhum jogo realizado ainda.</EmptyState>
        ) : (
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2/60 text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3 text-center">Invencibilidade</th>
                  <th className="px-4 py-3 text-center">Vitórias seguidas</th>
                  <th className="px-4 py-3 text-center">Sem sofrer gol</th>
                  <th className="px-4 py-3 text-center">Jejum de gols</th>
                </tr>
              </thead>
              <tbody>
                {streaks.map((row) => (
                  <tr key={row.teamId} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium text-foreground">
                      <TeamCell name={row.teamName} crestUrl={row.teamCrestUrl} />
                    </td>
                    <td className="px-4 py-3 text-center font-display font-semibold text-accent">
                      {row.unbeatenStreak}
                    </td>
                    <td className="px-4 py-3 text-center text-foreground">{row.winStreak}</td>
                    <td className="px-4 py-3 text-center text-foreground">{row.cleanSheetStreak}</td>
                    <td className="px-4 py-3 text-center text-muted">{row.scoringDroughtStreak}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide text-foreground">
            Comparador de rodadas
          </h2>
          {roundSnapshots.length > 0 && (
            <ExportTableButtons
              fileName={`comparador-rodadas-${id}`}
              title="Comparador de rodadas"
              columns={["Time", ...roundSnapshots.map((s) => s.round)]}
              rows={(teams ?? []).map((team) => [
                team.name,
                ...roundSnapshots.map((s) => s.positionByTeamId[team.id] ?? "—"),
              ])}
            />
          )}
        </div>
        {roundSnapshots.length === 0 ? (
          <EmptyState>A evolução aparece aqui após a primeira rodada com jogos realizados.</EmptyState>
        ) : (
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2/60 text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3">Time</th>
                  {roundSnapshots.map((snapshot) => (
                    <th key={snapshot.round} className="px-4 py-3 text-center">
                      {snapshot.round}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(teams ?? [])
                  .slice()
                  .sort((a, b) => {
                    const last = roundSnapshots[roundSnapshots.length - 1];
                    return (last.positionByTeamId[a.id] ?? 999) - (last.positionByTeamId[b.id] ?? 999);
                  })
                  .map((team) => (
                    <tr key={team.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-medium text-foreground">
                        <TeamCell name={team.name} crestUrl={team.crest_url} />
                      </td>
                      {roundSnapshots.map((snapshot) => (
                        <td key={snapshot.round} className="px-4 py-3 text-center text-foreground">
                          {snapshot.positionByTeamId[team.id] ?? "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-bold uppercase tracking-wide text-foreground">
          Time da Rodada
        </h2>
        <TeamOfTheRoundSection
          rounds={rounds}
          entriesByRound={entriesByRound}
          playersById={playersById}
        />
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-bold uppercase tracking-wide text-foreground">
          Comparador de jogadores
        </h2>
        <PlayerComparator players={comparablePlayers} />
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-bold uppercase tracking-wide text-foreground">
          Comparador de times
        </h2>
        <TeamComparator teams={comparableTeams} />
      </div>
    </div>
  );
}
