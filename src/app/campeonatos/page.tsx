import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button, Card, EmptyState, Input, Label, PageHeader, Select } from "@/components/ui";
import { createChampionship } from "./actions";
import { ChampionshipList } from "./championship-list";

export default async function CampeonatosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: championships } = await supabase
    .from("championships")
    .select("id, name, created_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader
        eyebrow="Meus campeonatos"
        title="Campeonatos"
      />

      <Card className="mb-8 p-5">
        <form
          action={createChampionship}
          className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
        >
          <div className="flex-1 basis-48">
            <Label>Novo campeonato</Label>
            <Input
              name="name"
              required
              placeholder="Ex.: Campeonato Municipal 2026"
            />
          </div>
          <div className="w-40">
            <Label>Formato</Label>
            <Select name="format" defaultValue="liga">
              <option value="liga">Liga (pontos corridos)</option>
              <option value="copa">Copa (fase de grupos)</option>
            </Select>
          </div>
          <div className="w-32">
            <Label>Nº de times</Label>
            <Input name="team_count" type="number" min={1} placeholder="Opcional" />
          </div>
          <div className="w-32">
            <Label>Nº de grupos</Label>
            <Input name="group_count" type="number" min={1} placeholder="Se for Copa" />
          </div>
          <label className="flex items-center gap-2 pb-2 text-sm text-muted">
            <input
              type="checkbox"
              name="has_knockout_stage"
              className="h-4 w-4 rounded border-border accent-accent"
            />
            Com mata-mata
          </label>
          <Button type="submit">Criar campeonato</Button>
        </form>
        <p className="mt-3 text-xs text-muted">
          Nº de times e nº de grupos são opcionais e podem ser alterados depois em Configurações.
        </p>
      </Card>

      {championships && championships.length > 0 ? (
        <ChampionshipList items={championships} />
      ) : (
        <EmptyState>
          Você ainda não tem nenhum campeonato. Crie o primeiro acima.
        </EmptyState>
      )}
    </div>
  );
}
