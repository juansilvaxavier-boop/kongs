import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { groupTeamsByFormat } from "@/lib/groups";

export default async function TimesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: championship }, { data: teams }] = await Promise.all([
    supabase.from("championships").select("format").eq("id", id).maybeSingle(),
    supabase
      .from("teams")
      .select("id, name, crest_url, group_name")
      .eq("championship_id", id)
      .order("name"),
  ]);

  const groups = groupTeamsByFormat(championship?.format ?? "liga", teams ?? []);

  return (
    <div>
      <PageHeader eyebrow="Clubes" title="Times" />
      {!teams || teams.length === 0 ? (
        <EmptyState>Nenhum time cadastrado ainda.</EmptyState>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <div key={group.groupName ?? "geral"}>
              {group.groupName && (
                <h2 className="mb-3 font-display text-base font-bold uppercase tracking-wide text-foreground">
                  {group.groupName}
                </h2>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.teams.map((team) => (
                  <Link key={team.id} href={`/campeonato/${id}/time/${team.id}`}>
                    <Card className="flex items-center gap-3 p-4 transition hover:border-accent/50">
                      {team.crest_url ? (
                        <span className="relative h-10 w-10 shrink-0">
                          <Image
                            src={team.crest_url}
                            alt=""
                            fill
                            loading="eager"
                            sizes="40px"
                            className="rounded-full object-cover"
                          />
                        </span>
                      ) : (
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-sm font-bold text-muted">
                          {team.name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                      <span className="font-medium text-foreground">{team.name}</span>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
