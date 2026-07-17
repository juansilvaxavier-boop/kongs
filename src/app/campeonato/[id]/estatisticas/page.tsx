import { createClient } from "@/lib/supabase/server";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { computeDiscipline, computeTopScorers } from "@/lib/stats";
import { computeSuspensions } from "@/lib/discipline";
import { naturalCompare } from "@/lib/datetime";
import { TeamFilter } from "../team-filter";
import { PlayerComparator, type ComparablePlayer } from "./player-comparator";
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
  const attributesByPlayer = new Map((attributesRows ?? []).map((a) => [a.player_id, a]));

  const comparablePlayers: ComparablePlayer[] = players.map((player) => {
    const attrs = attributesByPlayer.get(player.id);
    return {
      id: player.id,
      name: player.name,
      teamName: teamNameById.get(player.team_id ?? "") ?? "Sem time",
      position: player.position,
      photoUrl: player.photo_url,
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
    </div>
  );
}
