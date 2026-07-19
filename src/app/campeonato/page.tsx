import { createClient } from "@/lib/supabase/server";
import { BrandMark, PageHeader } from "@/components/ui";
import { ChampionshipsGrid } from "@/components/championships-grid";
import { SocialLinks } from "@/components/social-links";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function CampeonatosPublicosPage() {
  const supabase = await createClient();

  const { data: championships } = await supabase
    .from("championships")
    .select("id, name, format, has_knockout_stage, created_at")
    .order("created_at", { ascending: false });

  return (
    <main className="pitch-lines flex min-h-dvh flex-1 flex-col">
      <header className="border-b border-border bg-surface/70 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <BrandMark />
            <span className="font-display text-lg font-bold uppercase tracking-wide">
              Kongs Campeonatos
            </span>
          </div>
          <div className="flex items-center gap-2">
            <SocialLinks />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
        <PageHeader eyebrow="Todos os campeonatos" title="Campeonatos" />
        <ChampionshipsGrid championships={championships ?? []} />
      </div>
    </main>
  );
}
