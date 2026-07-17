import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";

export default async function CampeonatosPublicosPage() {
  const supabase = await createClient();

  const { data: championships } = await supabase
    .from("championships")
    .select("id, name, format, has_knockout_stage, created_at")
    .order("created_at", { ascending: false });

  return (
    <main className="pitch-lines flex min-h-dvh flex-1 flex-col">
      <header className="border-b border-border bg-surface/70 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-2 px-4 py-4 sm:px-6">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent font-display text-lg font-bold text-[#06110a]">
            K
          </span>
          <span className="font-display text-lg font-bold uppercase tracking-wide">
            Kongs Campeonatos
          </span>
        </div>
      </header>

      <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
        <PageHeader eyebrow="Todos os campeonatos" title="Campeonatos" />

        {!championships || championships.length === 0 ? (
          <EmptyState>Nenhum campeonato publicado ainda.</EmptyState>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {championships.map((championship) => (
              <Link key={championship.id} href={`/campeonato/${championship.id}`}>
                <Card className="flex items-center justify-between gap-3 p-4 transition hover:border-accent/50">
                  <span className="font-medium text-foreground">
                    {championship.name}
                  </span>
                  <Badge>{championship.format === "copa" ? "Copa" : "Liga"}</Badge>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
