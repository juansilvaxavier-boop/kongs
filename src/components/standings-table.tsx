import Link from "next/link";
import { Card } from "./ui";
import type { StandingRow } from "@/lib/standings";

export function StandingsTable({
  standings,
  teamHref,
}: {
  standings: StandingRow[];
  teamHref?: (teamId: string) => string;
}) {
  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[36rem] text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-2/60 text-left text-xs uppercase tracking-wide text-muted">
            <th className="px-4 py-3 text-center">Pos</th>
            <th className="px-4 py-3">Time</th>
            <th className="px-4 py-3 text-center">Pts</th>
            <th className="px-4 py-3 text-center">J</th>
            <th className="px-4 py-3 text-center">V</th>
            <th className="px-4 py-3 text-center">E</th>
            <th className="px-4 py-3 text-center">D</th>
            <th className="px-4 py-3 text-center">GP</th>
            <th className="px-4 py-3 text-center">GC</th>
            <th className="px-4 py-3 text-center">SG</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row) => (
            <tr key={row.teamId} className="border-b border-border last:border-0">
              <td className="px-4 py-3 text-center font-display text-base font-semibold text-accent">
                {row.pos}
              </td>
              <td className="px-4 py-3 font-medium text-foreground">
                {teamHref ? (
                  <Link href={teamHref(row.teamId)} className="hover:underline">
                    {row.teamName}
                  </Link>
                ) : (
                  row.teamName
                )}
              </td>
              <td className="px-4 py-3 text-center font-semibold text-foreground">
                {row.pts}
              </td>
              <td className="px-4 py-3 text-center text-muted">{row.j}</td>
              <td className="px-4 py-3 text-center text-muted">{row.v}</td>
              <td className="px-4 py-3 text-center text-muted">{row.e}</td>
              <td className="px-4 py-3 text-center text-muted">{row.d}</td>
              <td className="px-4 py-3 text-center text-muted">{row.gp}</td>
              <td className="px-4 py-3 text-center text-muted">{row.gc}</td>
              <td className="px-4 py-3 text-center text-muted">{row.sg}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
