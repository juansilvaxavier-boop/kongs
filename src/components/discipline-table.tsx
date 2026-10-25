import type { ReactNode } from "react";
import { Badge, Card, EmptyState } from "./ui";
import { TeamCell } from "./team-cell";
import type { DisciplineRow } from "@/lib/stats";
import type { SuspensionStatus } from "@/lib/discipline";

function defaultSituacao(status: SuspensionStatus | undefined): ReactNode {
  if (status?.suspended) return <Badge tone="warning">Suspenso</Badge>;
  if (status?.pendingSuspension) return <Badge tone="default">Pendurado</Badge>;
  return <span className="text-muted">—</span>;
}

export function DisciplineTable({
  rows,
  suspensions,
  renderSituacao = defaultSituacao,
  emptyMessage = "Nenhum cartão lançado ainda.",
}: {
  rows: DisciplineRow[];
  suspensions?: Map<string, SuspensionStatus>;
  renderSituacao?: (status: SuspensionStatus | undefined) => ReactNode;
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return <EmptyState>{emptyMessage}</EmptyState>;
  }

  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[32rem] text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-2/60 text-left text-xs uppercase tracking-wide text-muted">
            <th className="px-4 py-3">Jogador</th>
            <th className="px-4 py-3">Time</th>
            <th className="px-4 py-3 text-center">Amarelos</th>
            <th className="px-4 py-3 text-center">Vermelhos</th>
            {suspensions && <th className="px-4 py-3">Situação</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.playerId} className="border-b border-border last:border-0">
              <td className="px-4 py-3 font-medium text-foreground">{row.playerName}</td>
              <td className="px-4 py-3 text-muted">
                <TeamCell name={row.teamName} crestUrl={row.teamCrestUrl} />
              </td>
              <td className="px-4 py-3 text-center text-foreground">{row.yellow}</td>
              <td className="px-4 py-3 text-center text-danger">{row.red}</td>
              {suspensions && (
                <td className="px-4 py-3">{renderSituacao(suspensions.get(row.playerId))}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
