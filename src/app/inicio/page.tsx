import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, PageHeader } from "@/components/ui";
import { ChampionshipsGrid } from "@/components/championships-grid";

export default async function InicioCampeonatosPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: championships }, { data: linkedPlayers }] = await Promise.all([
    supabase
      .from("championships")
      .select("id, name, format, has_knockout_stage, created_at")
      .eq("kind", "campeonato")
      .order("created_at", { ascending: false }),
    user
      ? supabase
          .from("players")
          .select("id, name, team_id, teams(name, championship_id)")
          .eq("user_id", user.id)
      : Promise.resolve({ data: null }),
  ]);

  return (
    <div>
      {linkedPlayers && linkedPlayers.length > 0 && (
        <Card className="mb-6 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            Você está registrado como jogador em
          </p>
          <ul className="flex flex-col gap-1">
            {linkedPlayers.map((p) => {
              const team = Array.isArray(p.teams) ? p.teams[0] : p.teams;
              if (!team) return null;
              return (
                <li key={p.id} className="flex items-center gap-2 text-sm">
                  <Badge>{p.name}</Badge>
                  <span className="text-muted">
                    joga em{" "}
                    <Link
                      href={`/campeonato/${team.championship_id}/time/${p.team_id}`}
                      className="text-accent hover:underline"
                    >
                      {team.name}
                    </Link>
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
      <PageHeader eyebrow="Todos os campeonatos" title="Campeonatos" />
      <ChampionshipsGrid championships={championships ?? []} />
    </div>
  );
}
