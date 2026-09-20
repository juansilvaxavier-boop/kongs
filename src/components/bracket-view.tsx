import { Badge, Card, EmptyState } from "@/components/ui";
import { buildBracketColumns } from "@/lib/bracket";
import { gameWinnerId } from "@/lib/game-result";

type Game = {
  id: string;
  round: string;
  team_a_id: string;
  team_b_id: string;
  date: string | null;
  score_a: number | null;
  score_b: number | null;
  penalty_score_a: number | null;
  penalty_score_b: number | null;
  played: boolean;
};

/** Visualização do chaveamento das fases eliminatórias, em colunas por
 * fase — compartilhada entre a página dedicada de Chaveamento e a aba
 * "Mata-mata" da Classificação. */
export function BracketView({
  games,
  teamName,
}: {
  games: Game[];
  teamName: (teamId: string) => string;
}) {
  const columns = buildBracketColumns(games);

  if (columns.length === 0) {
    return <EmptyState>Nenhum jogo agendado ainda.</EmptyState>;
  }

  return (
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
  );
}
