import { createClient } from "@/lib/supabase/server";
import { Button, Card, Input, Label, PageHeader } from "@/components/ui";
import { createCoach } from "./actions";
import { CoachTable } from "./coach-table";

export default async function TecnicosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: coaches } = await supabase
    .from("coaches")
    .select("id, name")
    .eq("championship_id", id)
    .order("name");

  const createCoachWithId = createCoach.bind(null, id);

  return (
    <div>
      <PageHeader eyebrow="Comissão técnica" title="Técnicos" />

      <Card className="mb-6 p-5">
        <form
          action={createCoachWithId}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <Label>Novo técnico</Label>
            <Input name="name" required placeholder="Nome do técnico" />
          </div>
          <Button type="submit">Adicionar</Button>
        </form>
      </Card>

      <CoachTable championshipId={id} coaches={coaches ?? []} />
    </div>
  );
}
