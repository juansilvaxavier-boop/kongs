import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChampionshipSwitcher, ChampionshipTabs } from "./nav";

export default async function ChampionshipLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: championship }, { data: championships }] = await Promise.all([
    supabase.from("championships").select("id, name, logo_url").eq("id", id).maybeSingle(),
    supabase
      .from("championships")
      .select("id, name")
      .order("created_at", { ascending: false }),
  ]);

  if (!championship) notFound();

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {championship.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={championship.logo_url}
              alt=""
              className="h-10 w-10 rounded-full object-cover"
            />
          )}
          <div>
            <Link
              href="/campeonatos"
              className="text-xs font-medium text-muted hover:text-accent"
            >
              ← Todos os campeonatos
            </Link>
            <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-foreground">
              {championship.name}
            </h1>
          </div>
        </div>
        <ChampionshipSwitcher id={id} items={championships ?? []} />
      </div>
      <ChampionshipTabs id={id} />
      {children}
    </div>
  );
}
