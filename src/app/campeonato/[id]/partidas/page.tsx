import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EmptyState, PageHeader } from "@/components/ui";
import { naturalCompare } from "@/lib/datetime";
import { TeamFilter } from "../team-filter";
import { PartidasTable } from "./partidas-table";

export default async function PartidasPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ time?: string }>;
}) {
  const { id } = await params;
  const { time: teamFilter } = await searchParams;
  const supabase = await createClient();

  const [{ data: championship }, { data: teams }, { data: gamesData }, { data: venues }] =
    await Promise.all([
      supabase
        .from("championships")
        .select("has_knockout_stage")
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("teams")
        .select("id, name, crest_url")
        .eq("championship_id", id)
        .order("name"),
      supabase
        .from("games")
        .select("id, round, team_a_id, team_b_id, date, score_a, score_b, played, venue_id")
        .eq("championship_id", id)
        .order("date", { ascending: true, nullsFirst: false }),
      supabase
        .from("venues")
        .select("id, name")
        .eq("championship_id", id),
    ]);

  const allGames = gamesData
    ? [...gamesData].sort((a, b) => naturalCompare(a.round, b.round))
    : [];
  const games = teamFilter
    ? allGames.filter((g) => g.team_a_id === teamFilter || g.team_b_id === teamFilter)
    : allGames;

  return (
    <div>
      <PageHeader
        eyebrow="Resultados e agenda"
        title="Partidas"
        action={
          championship?.has_knockout_stage ? (
            <Link
              href={`/campeonato/${id}/chaveamento`}
              className="text-sm text-accent hover:underline"
            >
              Ver chaveamento →
            </Link>
          ) : undefined
        }
      />

      {allGames.length > 0 && (
        <p className="-mt-4 mb-4">
          <Link
            href={`/telao/${id}`}
            target="_blank"
            className="text-sm text-accent hover:underline"
          >
            Abrir modo telão (placar ao vivo) →
          </Link>
        </p>
      )}

      {teams && teams.length > 0 && (
        <div className="mb-4">
          <TeamFilter teams={teams} />
        </div>
      )}

      {games.length === 0 ? (
        <EmptyState>Nenhum jogo agendado ainda.</EmptyState>
      ) : (
        <>
          <p className="mb-3 text-xs text-muted">
            Clique em um jogo para ver o retrospecto entre os dois times.
          </p>
          <PartidasTable
            games={games}
            allGames={allGames}
            teams={teams ?? []}
            venues={venues ?? []}
          />
        </>
      )}
    </div>
  );
}
