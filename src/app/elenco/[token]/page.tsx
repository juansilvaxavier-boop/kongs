import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BrandMark, PageHeader } from "@/components/ui";
import { RosterPanel } from "./roster-panel";

export default async function ElencoTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const [{ data: teamRows, error: teamError }, { data: players, error: playersError }] =
    await Promise.all([
      supabase.rpc("roster_get_team", { p_token: token }),
      supabase.rpc("roster_list_players", { p_token: token }),
    ]);

  if (teamError || !teamRows || teamRows.length === 0) notFound();
  const team = teamRows[0];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        <BrandMark />
        <span className="font-display text-sm font-bold uppercase tracking-wide text-muted">
          {team.championship_name}
        </span>
      </div>
      <PageHeader eyebrow="Cadastro de elenco" title={team.team_name} />
      <RosterPanel
        token={token}
        teamName={team.team_name}
        crestUrl={team.crest_url}
        coachName={team.coach_name}
        playerCount={team.player_count}
        submitted={Boolean(team.submitted_at)}
        players={playersError ? [] : players ?? []}
      />
    </div>
  );
}
