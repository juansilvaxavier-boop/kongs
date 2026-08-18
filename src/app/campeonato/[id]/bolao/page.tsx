import Link from "next/link";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, EmptyState, Input, Label, Select } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { SearchableSelect } from "@/components/searchable-select";
import { TeamCell } from "@/components/team-cell";
import { naturalCompare } from "@/lib/datetime";
import { BolaoTabs } from "./bolao-tabs";
import { RankingPanel } from "./ranking-panel";
import {
  computeBolaoPredictionTier,
  computeBolaoStandings,
  computeChampionPredictionPoints,
  computeGroupPredictionPoints,
  computeTopscorerPredictionPoints,
  type FinishedGroupStanding,
} from "@/lib/bolao";
import { computeStandings } from "@/lib/standings";
import { computeChampionTeamId } from "@/lib/champion";
import { computeTopScorers } from "@/lib/stats";
import { gamesWithinTeams, groupTeamsByFormat } from "@/lib/groups";
import {
  upsertChampionPrediction,
  upsertGroupPrediction,
  upsertPrediction,
  upsertTopscorerPrediction,
} from "./actions";

export default async function BolaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: championship },
    { data: teams },
    { data: gamesData },
    { data: predictions },
    { data: groupPredictions },
    { data: players },
    { data: goals },
    { data: topscorerPredictions },
    { data: championPredictions },
  ] = await Promise.all([
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
        "id, round, team_a_id, team_b_id, date, played, score_a, score_b, penalty_score_a, penalty_score_b"
      )
      .eq("championship_id", id),
    supabase
      .from("bolao_predictions")
      .select("id, game_id, user_id, predicted_score_a, predicted_score_b")
      .eq("championship_id", id),
    supabase
      .from("bolao_group_predictions")
      .select("id, group_name, position, team_id, user_id")
      .eq("championship_id", id),
    supabase.from("players").select("id, name, team_id").eq("championship_id", id),
    supabase.from("goal_events").select("player_id").eq("championship_id", id),
    supabase
      .from("bolao_topscorer_predictions")
      .select("id, player_id, user_id, points")
      .eq("championship_id", id),
    supabase
      .from("bolao_champion_predictions")
      .select("id, team_id, user_id, points")
      .eq("championship_id", id),
  ]);

  const games = (gamesData ?? []).slice().sort((a, b) => naturalCompare(a.round, b.round));
  const teamName = (teamId: string) => teams?.find((t) => t.id === teamId)?.name ?? "?";
  const teamCrest = (teamId: string) => teams?.find((t) => t.id === teamId)?.crest_url ?? null;

  const userIds = [
    ...new Set([
      ...(predictions ?? []).map((p) => p.user_id),
      ...(groupPredictions ?? []).map((p) => p.user_id),
      ...(topscorerPredictions ?? []).map((p) => p.user_id),
      ...(championPredictions ?? []).map((p) => p.user_id),
    ]),
  ];
  const { data: profiles } =
    userIds.length > 0
      ? await supabase
          .from("profiles")
          .select("user_id, first_name, last_name, avatar_url")
          .in("user_id", userIds)
      : { data: [] };
  const profileByUserId = new Map((profiles ?? []).map((p) => [p.user_id, p]));
  const profileName = (userId: string) => {
    const profile = profileByUserId.get(userId);
    const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ");
    return name || "Torcedor";
  };

  const myPredictionByGameId = new Map(
    (predictions ?? []).filter((p) => p.user_id === user?.id).map((p) => [p.game_id, p])
  );

  const playedGames = games.filter((g) => g.played && g.score_a !== null && g.score_b !== null);
  const scoreStandings = computeBolaoStandings(
    (predictions ?? []).map((p) => ({
      userId: p.user_id,
      gameId: p.game_id,
      predictedScoreA: p.predicted_score_a,
      predictedScoreB: p.predicted_score_b,
    })),
    playedGames.map((g) => ({ id: g.id, scoreA: g.score_a!, scoreB: g.score_b! }))
  );

  const format = championship?.format ?? "liga";
  const groupsDrawn = format !== "copa" || (teams ?? []).some((t) => t.group_name?.trim());
  const groups = groupTeamsByFormat(format, teams ?? []);
  const groupInfos = groups.map((group) => {
    const groupGames = gamesWithinTeams(games, group.teams);
    const hasGames = groupGames.length > 0;
    const allPlayed = hasGames && groupGames.every((g) => g.played);
    const anyPlayed = groupGames.some((g) => g.played);
    const finalOrder = allPlayed
      ? computeStandings(group.teams, groupGames).map((row) => row.teamId)
      : null;
    return { ...group, hasGames, allPlayed, anyPlayed, finalOrder };
  });

  const finishedGroups: FinishedGroupStanding[] = groupInfos
    .filter((g) => g.finalOrder)
    .map((g) => ({ groupName: g.groupName, order: g.finalOrder! }));

  const groupStandings = computeGroupPredictionPoints(
    (groupPredictions ?? []).map((p) => ({
      userId: p.user_id,
      groupName: p.group_name,
      position: p.position,
      teamId: p.team_id,
    })),
    finishedGroups
  );

  const seasonStarted = games.some((g) => g.played);
  const seasonOver = games.length > 0 && games.every((g) => g.played);
  const currentPredictionTier = computeBolaoPredictionTier(
    championship?.has_knockout_stage ?? false,
    games
  );

  const allPlayers = players ?? [];
  const topscorerOptions = [...allPlayers]
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
    .map((p) => ({
      value: p.id,
      label: p.team_id ? `${p.name} (${teamName(p.team_id)})` : p.name,
    }));
  const championOptions = [...(teams ?? [])]
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
    .map((t) => ({ value: t.id, label: t.name }));
  const topScorers = computeTopScorers(allPlayers, goals ?? [], teams ?? []);
  const topScorerPlayerIds =
    seasonOver && topScorers.length > 0
      ? topScorers.filter((row) => row.goals === topScorers[0].goals).map((row) => row.playerId)
      : [];

  const championTeamId = computeChampionTeamId(
    championship?.has_knockout_stage ?? false,
    format,
    teams ?? [],
    games
  );

  const topscorerStandings = computeTopscorerPredictionPoints(
    (topscorerPredictions ?? []).map((p) => ({
      userId: p.user_id,
      playerId: p.player_id,
      points: p.points,
    })),
    topScorerPlayerIds
  );
  const championStandings = computeChampionPredictionPoints(
    (championPredictions ?? []).map((p) => ({
      userId: p.user_id,
      teamId: p.team_id,
      points: p.points,
    })),
    championTeamId
  );

  const merged = new Map<
    string,
    {
      points: number;
      exactCount: number;
      correctCount: number;
      groupExactCount: number;
      topscorerHit: boolean;
      championHit: boolean;
    }
  >();
  const emptyRow = () => ({
    points: 0,
    exactCount: 0,
    correctCount: 0,
    groupExactCount: 0,
    topscorerHit: false,
    championHit: false,
  });
  for (const row of scoreStandings) {
    const entry = merged.get(row.userId) ?? emptyRow();
    entry.points += row.points;
    entry.exactCount += row.exactCount;
    entry.correctCount += row.correctCount;
    merged.set(row.userId, entry);
  }
  for (const row of groupStandings) {
    const entry = merged.get(row.userId) ?? emptyRow();
    entry.points += row.points;
    entry.groupExactCount += row.exactCount;
    merged.set(row.userId, entry);
  }
  for (const row of topscorerStandings) {
    const entry = merged.get(row.userId) ?? emptyRow();
    entry.points += row.points;
    entry.topscorerHit = true;
    merged.set(row.userId, entry);
  }
  for (const row of championStandings) {
    const entry = merged.get(row.userId) ?? emptyRow();
    entry.points += row.points;
    entry.championHit = true;
    merged.set(row.userId, entry);
  }
  // Todo mundo que já palpitou em qualquer categoria entra no ranking, mesmo
  // com 0 pontos até agora (ex.: só apostou em jogos que ainda não rolaram) —
  // `merged` só tem entradas pra quem já tem algo resolvido, então a lista
  // completa vem de `userIds` e cai no `emptyRow()` quando falta em `merged`.
  const standings = userIds
    .map((userId) => ({ userId, ...(merged.get(userId) ?? emptyRow()) }))
    .sort((a, b) => b.points - a.points || b.exactCount - a.exactCount);

  const myTopscorerPrediction = (topscorerPredictions ?? []).find((p) => p.user_id === user?.id);
  const myChampionPrediction = (championPredictions ?? []).find((p) => p.user_id === user?.id);
  const playerName = (playerId: string) => allPlayers.find((p) => p.id === playerId)?.name ?? "?";

  const myGroupPicks = new Map<string, Map<number, string>>();
  for (const p of groupPredictions ?? []) {
    if (p.user_id !== user?.id) continue;
    const key = p.group_name ?? "";
    if (!myGroupPicks.has(key)) myGroupPicks.set(key, new Map());
    myGroupPicks.get(key)!.set(p.position, p.team_id);
  }

  const gamePredictionsByUser = new Map<string, typeof predictions>();
  for (const p of predictions ?? []) {
    if (!gamePredictionsByUser.has(p.user_id)) gamePredictionsByUser.set(p.user_id, []);
    gamePredictionsByUser.get(p.user_id)!.push(p);
  }

  const groupPredictionsByUser = new Map<string, Map<string, Map<number, string>>>();
  for (const p of groupPredictions ?? []) {
    const key = p.group_name ?? "";
    if (!groupPredictionsByUser.has(p.user_id)) groupPredictionsByUser.set(p.user_id, new Map());
    const userGroups = groupPredictionsByUser.get(p.user_id)!;
    if (!userGroups.has(key)) userGroups.set(key, new Map());
    userGroups.get(key)!.set(p.position, p.team_id);
  }

  const topscorerPredictionByUser = new Map(
    (topscorerPredictions ?? []).map((p) => [p.user_id, p.player_id])
  );
  const championPredictionByUser = new Map(
    (championPredictions ?? []).map((p) => [p.user_id, p.team_id])
  );

  function userPredictionDetail(userId: string): ReactNode {
    const userGames = gamePredictionsByUser.get(userId) ?? [];
    const userGroups = groupPredictionsByUser.get(userId) ?? new Map<string, Map<number, string>>();
    const userTopscorer = topscorerPredictionByUser.get(userId);
    const userChampion = championPredictionByUser.get(userId);

    return (
      <div className="space-y-4">
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Jogos</h4>
          {userGames.length === 0 ? (
            <p className="text-sm text-muted">Nenhum palpite de jogo.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {userGames.map((p) => {
                const game = games.find((g) => g.id === p.game_id);
                if (!game) return null;
                return (
                  <li key={p.id} className="flex items-center justify-between gap-2">
                    <span className="text-foreground">
                      {teamName(game.team_a_id)} x {teamName(game.team_b_id)}
                    </span>
                    <span className="text-muted">
                      {p.predicted_score_a} - {p.predicted_score_b}
                      {game.played ? ` (real: ${game.score_a} - ${game.score_b})` : ""}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {groups.length > 0 && (
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              Classificação
            </h4>
            {userGroups.size === 0 ? (
              <p className="text-sm text-muted">Nenhum palpite de classificação.</p>
            ) : (
              [...userGroups.entries()].map(([groupName, picks]) => (
                <div key={groupName || "geral"} className="mb-2">
                  <p className="mb-1 text-xs font-semibold text-foreground">
                    {groupName || "Tabela geral"}
                  </p>
                  <ul className="space-y-0.5 text-sm text-muted">
                    {[...picks.entries()]
                      .sort((a, b) => a[0] - b[0])
                      .map(([pos, teamId]) => (
                        <li key={pos}>
                          {pos}º — {teamName(teamId)}
                        </li>
                      ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        )}

        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Artilheiro</h4>
          <p className="text-sm text-muted">
            {userTopscorer ? playerName(userTopscorer) : "Nenhum palpite."}
          </p>
        </div>

        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Campeão</h4>
          <p className="text-sm text-muted">
            {userChampion ? teamName(userChampion) : "Nenhum palpite."}
          </p>
        </div>
      </div>
    );
  }

  const tabs: { id: string; label: string; content: ReactNode }[] = [
    {
      id: "jogos",
      label: "Jogos",
      content: (
        <div>
          <h2 className="mb-3 font-display text-lg font-bold uppercase tracking-wide text-foreground">
            Seus palpites
          </h2>
          {games.length === 0 ? (
            <EmptyState>Nenhum jogo agendado ainda.</EmptyState>
          ) : (
            <div className="flex flex-col gap-3">
              {games.map((game) => {
                const mine = myPredictionByGameId.get(game.id);
                const locked = game.played;
                return (
                  <Card key={game.id} className="p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <TeamCell name={teamName(game.team_a_id)} crestUrl={teamCrest(game.team_a_id)} />
                        <span className="text-muted">x</span>
                        <TeamCell name={teamName(game.team_b_id)} crestUrl={teamCrest(game.team_b_id)} />
                      </div>
                      <Badge tone={locked ? "success" : "warning"}>
                        {locked ? "Realizado" : "Agendado"}
                      </Badge>
                    </div>
                    <p className="mb-3 text-xs text-muted">
                      {game.round}
                      {game.date
                        ? ` · ${new Date(game.date).toLocaleString("pt-BR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}`
                        : ""}
                    </p>

                    {locked ? (
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <span className="font-display text-lg font-bold text-foreground">
                          {game.score_a} - {game.score_b}
                        </span>
                        {mine ? (
                          <span className="text-muted">
                            Seu palpite: {mine.predicted_score_a} - {mine.predicted_score_b}
                          </span>
                        ) : (
                          <span className="text-muted">Você não deu palpite neste jogo.</span>
                        )}
                      </div>
                    ) : user ? (
                      <ActionForm
                        action={upsertPrediction.bind(null, id, game.id)}
                        className="flex flex-wrap items-end gap-3"
                        successMessage="Palpite salvo."
                      >
                        <div className="w-20">
                          <Label>{teamName(game.team_a_id)}</Label>
                          <Input
                            name="predicted_score_a"
                            type="number"
                            min={0}
                            required
                            defaultValue={mine?.predicted_score_a ?? ""}
                          />
                        </div>
                        <div className="w-20">
                          <Label>{teamName(game.team_b_id)}</Label>
                          <Input
                            name="predicted_score_b"
                            type="number"
                            min={0}
                            required
                            defaultValue={mine?.predicted_score_b ?? ""}
                          />
                        </div>
                        <SubmitButton pendingText="Salvando…">
                          {mine ? "Atualizar palpite" : "Salvar palpite"}
                        </SubmitButton>
                      </ActionForm>
                    ) : (
                      <p className="text-sm text-muted">Entre na sua conta para dar seu palpite.</p>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      ),
    },
  ];

  if (teams && teams.length > 1 && groupsDrawn) {
    tabs.push({
      id: "classificacao",
      label: "Classificação",
      content: (
        <div>
          <h2 className="mb-1 font-display text-lg font-bold uppercase tracking-wide text-foreground">
            Palpite de classificação
          </h2>
          <p className="mb-3 text-sm text-muted">
            Palpite quem termina em cada posição {groups.length > 1 ? "de cada grupo" : "da tabela"}
            . Cada posição certeira vale 5 pontos no ranking geral do bolão.
          </p>
          <div className="flex flex-col gap-4">
            {groupInfos.map((group) => {
              const key = group.groupName ?? "";
              const myPicks = myGroupPicks.get(key) ?? new Map<number, string>();
              const positions = Array.from({ length: group.teams.length }, (_, i) => i + 1);

              return (
                <Card key={key || "geral"} className="p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h3 className="font-display text-sm font-bold uppercase tracking-wide text-foreground">
                      {group.groupName ?? "Tabela geral"}
                    </h3>
                    <Badge tone={group.allPlayed ? "success" : group.anyPlayed ? "warning" : "default"}>
                      {group.allPlayed ? "Encerrado" : group.anyPlayed ? "Em andamento" : "Aguardando início"}
                    </Badge>
                  </div>

                  {!user ? (
                    <p className="text-sm text-muted">Entre na sua conta para dar seu palpite.</p>
                  ) : group.anyPlayed ? (
                    <ul className="space-y-1 text-sm">
                      {positions.map((pos) => {
                        const teamId = myPicks.get(pos);
                        const actualTeamId = group.finalOrder?.[pos - 1];
                        const scored = group.allPlayed && Boolean(teamId);
                        const hit = scored && actualTeamId === teamId;
                        return (
                          <li key={pos} className="flex items-center gap-2">
                            <span className="w-6 text-muted">{pos}º</span>
                            <span className="flex-1 text-foreground">
                              {teamId ? teamName(teamId) : "— (sem palpite)"}
                            </span>
                            {scored && (
                              <Badge tone={hit ? "success" : "warning"}>
                                {hit ? "Acertou" : "Errou"}
                              </Badge>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <ActionForm
                      action={upsertGroupPrediction.bind(null, id, group.groupName)}
                      successMessage="Palpite salvo."
                    >
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {positions.map((pos) => (
                          <div key={pos}>
                            <Label>{pos}º lugar</Label>
                            <Select name={`position_${pos}`} defaultValue={myPicks.get(pos) ?? ""}>
                              <option value="">—</option>
                              {group.teams.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.name}
                                </option>
                              ))}
                            </Select>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3">
                        <SubmitButton pendingText="Salvando…">Salvar palpite do grupo</SubmitButton>
                      </div>
                    </ActionForm>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      ),
    });
  }

  if (allPlayers.length > 0) {
    tabs.push({
      id: "artilheiro",
      label: "Artilheiro",
      content: (
        <div>
          <h2 className="mb-1 font-display text-lg font-bold uppercase tracking-wide text-foreground">
            Palpite de artilheiro
          </h2>
          <p className="mb-3 text-sm text-muted">
            Palpite quem será o artilheiro do campeonato. Dá pra palpitar (ou trocar o palpite) até
            o campeonato terminar, mas quanto mais cedo, mais pontos: 10 antes de começar, 5 na fase
            de grupos/liga, 3 já no mata-mata.
          </p>
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-sm text-muted">
                {seasonOver
                  ? "Campeonato encerrado"
                  : `Palpite agora vale ${currentPredictionTier} pontos`}
              </span>
              <Badge tone={seasonOver ? "success" : seasonStarted ? "warning" : "default"}>
                {seasonOver ? "Encerrado" : seasonStarted ? "Em andamento" : "Aguardando início"}
              </Badge>
            </div>

            {!user ? (
              <p className="text-sm text-muted">Entre na sua conta para dar seu palpite.</p>
            ) : seasonOver ? (
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="text-foreground">
                  {myTopscorerPrediction
                    ? playerName(myTopscorerPrediction.player_id)
                    : "Você não deu palpite."}
                </span>
                {myTopscorerPrediction && (
                  <Badge tone={topScorerPlayerIds.includes(myTopscorerPrediction.player_id) ? "success" : "warning"}>
                    {topScorerPlayerIds.includes(myTopscorerPrediction.player_id) ? "Acertou" : "Errou"}
                  </Badge>
                )}
              </div>
            ) : (
              <ActionForm
                action={upsertTopscorerPrediction.bind(null, id)}
                className="flex flex-wrap items-end gap-3"
                successMessage="Palpite salvo."
              >
                <SearchableSelect
                  name="player_id"
                  options={topscorerOptions}
                  defaultValue={myTopscorerPrediction?.player_id ?? ""}
                  placeholder="Digite o nome do jogador…"
                  className="max-w-xs"
                />
                <SubmitButton pendingText="Salvando…">
                  {myTopscorerPrediction ? "Atualizar palpite" : "Salvar palpite"}
                </SubmitButton>
              </ActionForm>
            )}
          </Card>
        </div>
      ),
    });
  }

  if (teams && teams.length > 1) {
    tabs.push({
      id: "campeao",
      label: "Campeão",
      content: (
        <div>
          <h2 className="mb-1 font-display text-lg font-bold uppercase tracking-wide text-foreground">
            Palpite de campeão
          </h2>
          <p className="mb-3 text-sm text-muted">
            Palpite qual time será o campeão. Dá pra palpitar (ou trocar o palpite) até o
            campeonato terminar, mas quanto mais cedo, mais pontos: 10 antes de começar, 5 na fase
            de grupos/liga, 3 já no mata-mata.
          </p>
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-sm text-muted">
                {seasonOver
                  ? "Campeão definido"
                  : `Palpite agora vale ${currentPredictionTier} pontos`}
              </span>
              <Badge tone={championTeamId ? "success" : seasonStarted ? "warning" : "default"}>
                {championTeamId ? "Definido" : seasonStarted ? "Em andamento" : "Aguardando início"}
              </Badge>
            </div>

            {!user ? (
              <p className="text-sm text-muted">Entre na sua conta para dar seu palpite.</p>
            ) : seasonOver ? (
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="text-foreground">
                  {myChampionPrediction ? teamName(myChampionPrediction.team_id) : "Você não deu palpite."}
                </span>
                {championTeamId && myChampionPrediction && (
                  <Badge tone={myChampionPrediction.team_id === championTeamId ? "success" : "warning"}>
                    {myChampionPrediction.team_id === championTeamId ? "Acertou" : "Errou"}
                  </Badge>
                )}
              </div>
            ) : (
              <ActionForm
                action={upsertChampionPrediction.bind(null, id)}
                className="flex flex-wrap items-end gap-3"
                successMessage="Palpite salvo."
              >
                <SearchableSelect
                  name="team_id"
                  options={championOptions}
                  defaultValue={myChampionPrediction?.team_id ?? ""}
                  placeholder="Digite o nome do time…"
                  className="max-w-xs"
                />
                <SubmitButton pendingText="Salvando…">
                  {myChampionPrediction ? "Atualizar palpite" : "Salvar palpite"}
                </SubmitButton>
              </ActionForm>
            )}
          </Card>
        </div>
      ),
    });
  }

  tabs.push({
    id: "ranking",
    label: "Ranking",
    content: (
      <div>
        <h2 className="mb-1 font-display text-lg font-bold uppercase tracking-wide text-foreground">
          Ranking do bolão
        </h2>
        <p className="mb-3 text-sm text-muted">
          Clique num torcedor pra ver os palpites dele em cada categoria.
        </p>
        <RankingPanel
          rows={standings.map((row) => {
            const profile = profileByUserId.get(row.userId);
            return {
              userId: row.userId,
              name: profileName(row.userId),
              avatarUrl: profile?.avatar_url ?? null,
              isMe: row.userId === user?.id,
              exactCount: row.exactCount,
              correctCount: row.correctCount,
              groupExactCount: row.groupExactCount,
              topscorerHit: row.topscorerHit,
              championHit: row.championHit,
              points: row.points,
              detail: userPredictionDetail(row.userId),
            };
          })}
        />
      </div>
    ),
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2 font-display text-2xl font-bold uppercase tracking-wide text-foreground">
          Bolão
        </h1>
        <p className="text-sm text-muted">
          Palpite o placar dos próximos jogos. Placar exato vale 3 pontos, acertar o vencedor (ou
          o empate) sem cravar o placar vale 1 ponto.
        </p>
      </div>

      {!user && (
        <Card className="p-4 text-sm text-muted">
          <Link href={`/login?redirectTo=/campeonato/${id}/bolao`} className="text-accent hover:underline">
            Entre na sua conta
          </Link>{" "}
          para participar do bolão.
        </Card>
      )}

      <BolaoTabs tabs={tabs} />
    </div>
  );
}
