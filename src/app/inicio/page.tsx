import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { ChampionshipsGrid } from "@/components/championships-grid";

export default async function InicioCampeonatosPage() {
  const supabase = await createClient();

  const { data: championships } = await supabase
    .from("championships")
    .select("id, name, format, has_knockout_stage, created_at")
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader eyebrow="Todos os campeonatos" title="Campeonatos" />
      <ChampionshipsGrid championships={championships ?? []} />
    </div>
  );
}
