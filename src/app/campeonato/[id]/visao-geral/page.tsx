import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { CommentsSection } from "../comments-section";

export default async function VisaoGeralPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: championship }, { data: teams }, { data: comments }] = await Promise.all([
    supabase
      .from("championships")
      .select("rules_text")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("teams")
      .select("id, name, crest_url")
      .eq("championship_id", id)
      .order("name"),
    supabase
      .from("championship_comments")
      .select("id, user_id, body, created_at")
      .eq("championship_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const commenterIds = [...new Set((comments ?? []).map((c) => c.user_id))];
  const { data: commentProfiles } =
    commenterIds.length > 0
      ? await supabase
          .from("profiles")
          .select("user_id, first_name, last_name, avatar_url, persona")
          .in("user_id", commenterIds)
      : { data: [] };

  return (
    <div className="space-y-10">
      <div>
        <PageHeader eyebrow="Clubes" title="Times" />
        {teams && teams.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <Link key={team.id} href={`/campeonato/${id}/time/${team.id}`}>
                <Card className="flex items-center gap-3 p-4 transition hover:border-accent/50">
                  {team.crest_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={team.crest_url}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover"
                    />
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
        ) : (
          <EmptyState>Nenhum time cadastrado ainda.</EmptyState>
        )}
      </div>

      {championship?.rules_text && (
        <details className="group rounded-xl border border-border bg-surface/80 p-4 shadow-lg shadow-black/20 backdrop-blur">
          <summary className="cursor-pointer font-display text-lg font-bold uppercase tracking-wide text-foreground">
            Regulamento
          </summary>
          <p className="mt-3 whitespace-pre-wrap text-sm text-muted">
            {championship.rules_text}
          </p>
        </details>
      )}

      <CommentsSection
        championshipId={id}
        comments={comments ?? []}
        profiles={commentProfiles ?? []}
        currentUserId={user?.id ?? null}
      />
    </div>
  );
}
