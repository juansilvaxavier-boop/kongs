import { Badge, Card, EmptyState } from "@/components/ui";
import { bracketSideOf, buildBracketColumns, isKnockoutRound, stripBracketSide } from "@/lib/bracket";
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

function BracketColumns({
  games,
  teamName,
  stripSideFromLabel,
}: {
  games: Game[];
  teamName: (teamId: string) => string;
  stripSideFromLabel?: boolean;
}) {
  const columns = buildBracketColumns(games);

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {columns.map((column) => (
        <div key={column.round} className="w-64 flex-none">
          <h2 className="mb-3 text-center font-display text-sm font-bold uppercase tracking-wide text-muted">
            {stripSideFromLabel ? stripBracketSide(column.round) : column.round}
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

/**
 * Visualização do chaveamento das fases eliminatórias — só o mata-mata,
 * mesmo que a lista de jogos recebida inclua a fase de grupos/liga
 * também (ela é filtrada aqui). Quando as rodadas seguem a convenção
 * "Lado A - "/"Lado B - " (ver `src/lib/bracket.ts`), separa a
 * visualização em duas chaves que só se encontram na Final; campeonatos
 * sem essa convenção continuam vendo uma única sequência de colunas,
 * como antes.
 */
export function BracketView({
  games,
  teamName,
}: {
  games: Game[];
  teamName: (teamId: string) => string;
}) {
  const knockoutGames = games.filter((g) => isKnockoutRound(g.round));

  if (knockoutGames.length === 0) {
    return <EmptyState>O mata-mata ainda não começou.</EmptyState>;
  }

  const sideAGames = knockoutGames.filter((g) => bracketSideOf(g.round) === "Lado A");
  const sideBGames = knockoutGames.filter((g) => bracketSideOf(g.round) === "Lado B");
  const finalGames = knockoutGames.filter((g) => bracketSideOf(g.round) === null);

  if (sideAGames.length === 0 && sideBGames.length === 0) {
    return <BracketColumns games={knockoutGames} teamName={teamName} />;
  }

  return (
    <div className="space-y-6">
      {sideAGames.length > 0 && (
        <div>
          <h3 className="mb-2 font-display text-xs font-bold uppercase tracking-wide text-accent">
            Lado A
          </h3>
          <BracketColumns games={sideAGames} teamName={teamName} stripSideFromLabel />
        </div>
      )}
      {sideBGames.length > 0 && (
        <div>
          <h3 className="mb-2 font-display text-xs font-bold uppercase tracking-wide text-accent">
            Lado B
          </h3>
          <BracketColumns games={sideBGames} teamName={teamName} stripSideFromLabel />
        </div>
      )}
      {finalGames.length > 0 && (
        <div>
          <h3 className="mb-2 font-display text-xs font-bold uppercase tracking-wide text-accent">
            Final
          </h3>
          <BracketColumns games={finalGames} teamName={teamName} />
        </div>
      )}
    </div>
  );
}
