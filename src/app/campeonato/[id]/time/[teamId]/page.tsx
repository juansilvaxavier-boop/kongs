import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, EmptyState } from "@/components/ui";
import { computeSuspensions } from "@/lib/discipline";

export default async function PublicTeamPage({
  params,
}: {
  params: Promise<{ id: string; teamId: string }>;
}) {
  const { id, teamId } = await params;
  const supabase = await createClient();

  const [{ data: championship }, { data: team }, { data: players }, { data: cardEvents }, { data: games }] =
    await Promise.all([
      supabase
        .from("championships")
        .select("yellow_cards_for_suspension")
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("teams")
        .select("id, name, crest_url, coach_id")
        .eq("championship_id", id)
        .eq("id", teamId)
        .maybeSingle(),
      supabase
        .from("players")
        .select("id, name, number, position, team_id")
        .eq("team_id", teamId)
        .order("number", { ascending: true, nullsFirst: false }),
      supabase
        .from("card_events")
        .select("player_id, card_type, game_id")
        .eq("championship_id", id),
      supabase
        .from("games")
        .select("id, team_a_id, team_b_id, date, round, played")
        .eq("championship_id", id),
    ]);

  if (!team) notFound();

  const suspensions = computeSuspensions(
    players ?? [],
    cardEvents ?? [],
    games ?? [],
    championship?.yellow_cards_for_suspension ?? 3
  );

  const { data: coachRow } = team.coach_id
    ? await supabase.from("coaches").select("name").eq("id", team.coach_id).maybeSingle()
    : { data: null };

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        {team.crest_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={team.crest_url}
            alt=""
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-2 text-lg font-bold text-muted">
            {team.name.slice(0, 2).toUpperCase()}
          </span>
        )}
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Elenco
          </p>
          <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-foreground">
            {team.name}
          </h1>
          {coachRow?.name && (
            <p className="text-sm text-muted">Técnico: {coachRow.name}</p>
          )}
        </div>
      </div>

      {players && players.length > 0 ? (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2/60 text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3">Nº</th>
                <th className="px-4 py-3">Jogador</th>
                <th className="px-4 py-3">Posição</th>
                <th className="px-4 py-3">Situação</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => {
                const status = suspensions.get(player.id);
                return (
                  <tr key={player.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-center font-display text-base font-semibold text-accent">
                      {player.number ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {player.name}
                    </td>
                    <td className="px-4 py-3">
                      {player.position ? (
                        <Badge>{player.position}</Badge>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {status?.suspended ? (
                        <Badge tone="warning">Suspenso</Badge>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      ) : (
        <EmptyState>Nenhum jogador cadastrado ainda.</EmptyState>
      )}
    </div>
  );
}
