import { createClient } from "@/lib/supabase/server";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { computeStandings } from "@/lib/standings";

export default async function ClassificacaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: teams }, { data: games }] = await Promise.all([
    supabase
      .from("teams")
      .select("id, name")
      .eq("championship_id", id)
      .order("name"),
    supabase
      .from("games")
      .select("team_a_id, team_b_id, score_a, score_b, played")
      .eq("championship_id", id),
  ]);

  if (!teams || teams.length === 0) {
    return (
      <div>
        <PageHeader eyebrow="Tabela do campeonato" title="Classificação" />
        <EmptyState>
          Cadastre times e lance placares de jogos para ver a classificação.
        </EmptyState>
      </div>
    );
  }

  const standings = computeStandings(teams, games ?? []);

  const columns: { key: keyof (typeof standings)[number]; label: string }[] = [
    { key: "pos", label: "Pos" },
    { key: "teamName", label: "Time" },
    { key: "pts", label: "Pts" },
    { key: "j", label: "J" },
    { key: "v", label: "V" },
    { key: "e", label: "E" },
    { key: "d", label: "D" },
    { key: "gp", label: "GP" },
    { key: "gc", label: "GC" },
    { key: "sg", label: "SG" },
  ];

  return (
    <div>
      <PageHeader eyebrow="Tabela do campeonato" title="Classificação" />

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[36rem] text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2/60 text-left text-xs uppercase tracking-wide text-muted">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 ${col.key !== "teamName" ? "text-center" : ""}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {standings.map((row) => (
              <tr
                key={row.teamId}
                className="border-b border-border last:border-0"
              >
                <td className="px-4 py-3 text-center font-display text-base font-semibold text-accent">
                  {row.pos}
                </td>
                <td className="px-4 py-3 font-medium text-foreground">
                  {row.teamName}
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
    </div>
  );
}
