import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button, Card, EmptyState, Input, Label, PageHeader } from "@/components/ui";
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
        <form action={createChampionship} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label>Novo campeonato</Label>
            <Input
              name="name"
              required
              placeholder="Ex.: Campeonato Municipal 2026"
            />
          </div>
          <Button type="submit">Criar campeonato</Button>
        </form>
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
