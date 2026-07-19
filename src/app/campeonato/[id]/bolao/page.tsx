import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, EmptyState, Input, Label } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { TeamCell } from "@/components/team-cell";
import { naturalCompare } from "@/lib/datetime";
import { computeBolaoStandings } from "@/lib/bolao";
import { upsertPrediction } from "./actions";

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

  const [{ data: teams }, { data: gamesData }, { data: predictions }] = await Promise.all([
    supabase
      .from("teams")
      .select("id, name, crest_url")
      .eq("championship_id", id)
      .order("name"),
    supabase
      .from("games")
      .select("id, round, team_a_id, team_b_id, date, played, score_a, score_b")
      .eq("championship_id", id),
    supabase
      .from("bolao_predictions")
      .select("id, game_id, user_id, predicted_score_a, predicted_score_b")
      .eq("championship_id", id),
  ]);

  const games = (gamesData ?? []).slice().sort((a, b) => naturalCompare(a.round, b.round));
  const teamName = (teamId: string) => teams?.find((t) => t.id === teamId)?.name ?? "?";
  const teamCrest = (teamId: string) => teams?.find((t) => t.id === teamId)?.crest_url ?? null;

  const userIds = [...new Set((predictions ?? []).map((p) => p.user_id))];
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
  const standings = computeBolaoStandings(
    (predictions ?? []).map((p) => ({
      userId: p.user_id,
      gameId: p.game_id,
      predictedScoreA: p.predicted_score_a,
      predictedScoreB: p.predicted_score_b,
    })),
    playedGames.map((g) => ({ id: g.id, scoreA: g.score_a!, scoreB: g.score_b! }))
  );

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
                      action={(formData) => upsertPrediction(id, game.id, formData)}
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

      <div>
        <h2 className="mb-3 font-display text-lg font-bold uppercase tracking-wide text-foreground">
          Ranking do bolão
        </h2>
        {standings.length === 0 ? (
          <EmptyState>Ninguém pontuou ainda — os pontos aparecem conforme os jogos acontecem.</EmptyState>
        ) : (
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[24rem] text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2/60 text-left text-xs uppercase tracking-wide text-muted">
                  <th className="w-10 px-4 py-3">#</th>
                  <th className="px-4 py-3">Torcedor</th>
                  <th className="px-4 py-3 text-center">Cravadas</th>
                  <th className="px-4 py-3 text-center">Acertos</th>
                  <th className="px-4 py-3 text-center">Pontos</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((row, index) => {
                  const profile = profileByUserId.get(row.userId);
                  return (
                    <tr key={row.userId} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 text-muted">{index + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {profile?.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={profile.avatar_url}
                              alt=""
                              className="h-7 w-7 rounded-full object-cover"
                            />
                          ) : (
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-2 text-xs font-bold text-muted">
                              {profileName(row.userId).slice(0, 2).toUpperCase()}
                            </span>
                          )}
                          <span className="font-medium text-foreground">
                            {profileName(row.userId)}
                            {row.userId === user?.id ? " (você)" : ""}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-foreground">{row.exactCount}</td>
                      <td className="px-4 py-3 text-center text-foreground">{row.correctCount}</td>
                      <td className="px-4 py-3 text-center font-display text-base font-semibold text-accent">
                        {row.points}
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
