import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { BracketView } from "@/components/bracket-view";

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

  return (
    <div>
      <PageHeader eyebrow="Fases eliminatórias" title="Chaveamento" />
      <BracketView games={games ?? []} teamName={teamName} />
    </div>
  );
}
