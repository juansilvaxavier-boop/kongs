import { Card, EmptyState } from "@/components/ui";
import { TeamCell } from "@/components/team-cell";
import type { ScorerRow } from "@/lib/stats";

export type PositionHighlight = {
  position: string;
  player: {
    id: string;
    name: string;
    teamName: string;
    teamCrestUrl: string | null;
    ovr: number;
  } | null;
};

export type TeamGoalsRow = {
  teamId: string;
  teamName: string;
  teamCrestUrl: string | null;
  goals: number;
};

function TeamGoalsTable({
  rows,
  label,
}: {
  rows: TeamGoalsRow[];
  label: { singular: string; plural: string };
}) {
  if (rows.length === 0) return <EmptyState>Nenhum jogo realizado ainda.</EmptyState>;
  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[22rem] text-sm">
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.teamId} className="border-b border-border last:border-0">
              <td className="w-10 px-4 py-3 text-muted">{index + 1}</td>
              <td className="px-4 py-3 font-medium text-foreground">
                <TeamCell name={row.teamName} crestUrl={row.teamCrestUrl} />
              </td>
              <td className="px-4 py-3 text-right font-display text-base font-semibold text-accent">
                {row.goals} {row.goals === 1 ? label.singular : label.plural}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

export function OverviewHighlights({
  avgGoalsPerGame,
  avgCardsPerGame,
  topScorers,
  positionHighlights,
  bestAttacks,
  bestDefenses,
}: {
  avgGoalsPerGame: number | null;
  avgCardsPerGame: number | null;
  topScorers: ScorerRow[];
  positionHighlights: PositionHighlight[];
  bestAttacks: TeamGoalsRow[];
  bestDefenses: TeamGoalsRow[];
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Média de gols por jogo
          </p>
          <p className="mt-1 font-display text-3xl font-bold text-accent">
            {avgGoalsPerGame === null ? "—" : avgGoalsPerGame.toFixed(1)}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Média de cartões por jogo
          </p>
          <p className="mt-1 font-display text-3xl font-bold text-accent">
            {avgCardsPerGame === null ? "—" : avgCardsPerGame.toFixed(1)}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <h3 className="mb-3 font-display text-base font-bold uppercase tracking-wide text-foreground">
            Top 3 melhores ataques
          </h3>
          <TeamGoalsTable rows={bestAttacks} label={{ singular: "gol marcado", plural: "gols marcados" }} />
        </div>
        <div>
          <h3 className="mb-3 font-display text-base font-bold uppercase tracking-wide text-foreground">
            Top 3 melhores defesas
          </h3>
          <TeamGoalsTable rows={bestDefenses} label={{ singular: "gol sofrido", plural: "gols sofridos" }} />
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-display text-base font-bold uppercase tracking-wide text-foreground">
          Top 3 artilheiros
        </h3>
        {topScorers.length === 0 ? (
          <EmptyState>Nenhum gol lançado ainda.</EmptyState>
        ) : (
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[22rem] text-sm">
              <tbody>
                {topScorers.map((row, index) => (
                  <tr key={row.playerId} className="border-b border-border last:border-0">
                    <td className="w-10 px-4 py-3 text-muted">{index + 1}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{row.playerName}</td>
                    <td className="px-4 py-3 text-muted">
                      <TeamCell name={row.teamName} crestUrl={row.teamCrestUrl} />
                    </td>
                    <td className="px-4 py-3 text-right font-display text-base font-semibold text-accent">
                      {row.goals} {row.goals === 1 ? "gol" : "gols"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      <div>
        <h3 className="mb-3 font-display text-base font-bold uppercase tracking-wide text-foreground">
          Melhores por posição (overall)
        </h3>
        {positionHighlights.every((entry) => !entry.player) ? (
          <EmptyState>Nenhum jogador cadastrado ainda.</EmptyState>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {positionHighlights.map((entry) => (
              <Card key={entry.position} className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {entry.position}
                </p>
                {entry.player ? (
                  <>
                    <p className="mt-2 truncate font-medium text-foreground">
                      {entry.player.name}
                    </p>
                    <div className="mt-1 text-sm text-muted">
                      <TeamCell name={entry.player.teamName} crestUrl={entry.player.teamCrestUrl} />
                    </div>
                    <p className="mt-2 font-display text-2xl font-bold text-accent">
                      {Math.round(entry.player.ovr)}
                    </p>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-muted">—</p>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
