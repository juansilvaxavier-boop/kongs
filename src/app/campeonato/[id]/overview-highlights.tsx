import { Card, EmptyState } from "@/components/ui";
import { TeamCell } from "@/components/team-cell";
import type { ScorerRow } from "@/lib/stats";
import type { TeamStreaks } from "@/lib/streaks";

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

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-accent sm:text-3xl">{value}</p>
    </Card>
  );
}

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
      <table className="w-full min-w-[20rem] text-sm">
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

const STREAK_DEFINITIONS: {
  key: keyof Pick<TeamStreaks, "winStreak" | "unbeatenStreak" | "scoringDroughtStreak">;
  icon: string;
  label: string;
  unit: (count: number) => string;
}[] = [
  {
    key: "winStreak",
    icon: "🔥",
    label: "Sequência de vitórias",
    unit: (count) => (count === 1 ? "vitória seguida" : "vitórias seguidas"),
  },
  {
    key: "unbeatenStreak",
    icon: "🛡️",
    label: "Melhor invencibilidade",
    unit: (count) => (count === 1 ? "jogo invicto" : "jogos invicto"),
  },
  {
    key: "scoringDroughtStreak",
    icon: "🚧",
    label: "Maior jejum de gols",
    unit: (count) => (count === 1 ? "jogo sem marcar" : "jogos sem marcar"),
  },
];

function StreaksCard({ streaks }: { streaks: TeamStreaks[] }) {
  const highlights = STREAK_DEFINITIONS.map((def) => {
    const leader = [...streaks]
      .filter((s) => s[def.key] >= 2)
      .sort((a, b) => b[def.key] - a[def.key])[0];
    return { ...def, leader };
  }).filter((h) => h.leader);

  if (highlights.length === 0) {
    return <EmptyState>Nenhuma sequência relevante ainda.</EmptyState>;
  }

  return (
    <Card className="divide-y divide-border">
      {highlights.map((highlight) => (
        <div key={highlight.key} className="flex items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {highlight.icon} {highlight.label}
            </p>
            <div className="mt-1">
              <TeamCell name={highlight.leader!.teamName} crestUrl={highlight.leader!.teamCrestUrl} />
            </div>
          </div>
          <p className="shrink-0 text-right font-display text-xl font-bold text-accent">
            {highlight.leader![highlight.key]}
            <span className="block text-[0.65rem] font-semibold uppercase tracking-wide text-muted">
              {highlight.unit(highlight.leader![highlight.key])}
            </span>
          </p>
        </div>
      ))}
    </Card>
  );
}

export function OverviewHighlights({
  playedGamesCount,
  totalGoals,
  avgGoalsPerGame,
  avgCardsPerGame,
  topScorers,
  positionHighlights,
  bestAttacks,
  bestDefenses,
  streaks,
}: {
  playedGamesCount: number;
  totalGoals: number;
  avgGoalsPerGame: number | null;
  avgCardsPerGame: number | null;
  topScorers: ScorerRow[];
  positionHighlights: PositionHighlight[];
  bestAttacks: TeamGoalsRow[];
  bestDefenses: TeamGoalsRow[];
  streaks: TeamStreaks[];
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Jogos disputados" value={String(playedGamesCount)} />
        <KpiCard label="Gols marcados" value={String(totalGoals)} />
        <KpiCard
          label="Gols por jogo"
          value={avgGoalsPerGame === null ? "—" : avgGoalsPerGame.toFixed(1)}
        />
        <KpiCard
          label="Cartões por jogo"
          value={avgCardsPerGame === null ? "—" : avgCardsPerGame.toFixed(1)}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 font-display text-base font-bold uppercase tracking-wide text-foreground">
            Top 3 artilheiros
          </h3>
          {topScorers.length === 0 ? (
            <EmptyState>Nenhum gol lançado ainda.</EmptyState>
          ) : (
            <Card className="overflow-x-auto">
              <table className="w-full min-w-[20rem] text-sm">
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
            Sequências
          </h3>
          <StreaksCard streaks={streaks} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
          Melhores por posição (overall)
        </h3>
        {positionHighlights.every((entry) => !entry.player) ? (
          <EmptyState>Nenhum jogador cadastrado ainda.</EmptyState>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
