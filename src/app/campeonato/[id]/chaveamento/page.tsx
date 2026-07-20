import { createClient } from "@/lib/supabase/server";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { buildBracketColumns } from "@/lib/bracket";
import { gameWinnerId } from "@/lib/game-result";

export default async function ChaveamentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: games }, { data: teams }] = await Promise.all([
    supabase
      .from("games")
      .select(
        "id, round, team_a_id, team_b_id, date, score_a, score_b, penalty_score_a, penalty_score_b, played"
      )
      .eq("championship_id", id),
    supabase.from("teams").select("id, name").eq("championship_id", id),
  ]);

  const teamName = (teamId: string) =>
    teams?.find((t) => t.id === teamId)?.name ?? "?";
  const columns = buildBracketColumns(games ?? []);

  return (
    <div>
      <PageHeader eyebrow="Fases eliminatórias" title="Chaveamento" />

      {columns.length === 0 ? (
        <EmptyState>Nenhum jogo agendado ainda.</EmptyState>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {columns.map((column) => (
            <div key={column.round} className="w-64 flex-none">
              <h2 className="mb-3 text-center font-display text-sm font-bold uppercase tracking-wide text-muted">
                {column.round}
              </h2>
              <div className="flex flex-col gap-3">
                {column.games.map((game) => {
                  const winnerId = gameWinnerId({
                    teamAId: game.team_a_id,
                    teamBId: game.team_b_id,
                    scoreA: game.score_a,
                    scoreB: game.score_b,
                    penaltyScoreA: game.penalty_score_a,
                    penaltyScoreB: game.penalty_score_b,
                    played: game.played,
                  });
                  const hadPenalties = game.penalty_score_a !== null && game.penalty_score_b !== null;

                  return (
                    <Card key={game.id} className="p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span
                          className={
                            winnerId === game.team_a_id
                              ? "font-bold text-accent"
                              : "font-medium text-foreground"
                          }
                        >
                          {teamName(game.team_a_id)}
                        </span>
                        <span className="text-muted">{game.played ? game.score_a : ""}</span>
                      </div>
                      <div className="my-1 h-px bg-border" />
                      <div className="flex items-center justify-between text-sm">
                        <span
                          className={
                            winnerId === game.team_b_id
                              ? "font-bold text-accent"
                              : "font-medium text-foreground"
                          }
                        >
                          {teamName(game.team_b_id)}
                        </span>
                        <span className="text-muted">{game.played ? game.score_b : ""}</span>
                      </div>
                      {hadPenalties && (
                        <p className="mt-1 text-center text-xs text-muted">
                          Pênaltis: {game.penalty_score_a} - {game.penalty_score_b}
                        </p>
                      )}
                      <div className="mt-2 text-center">
                        <Badge tone={game.played ? "success" : "warning"}>
                          {game.played ? "Realizado" : "Agendado"}
                        </Badge>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
