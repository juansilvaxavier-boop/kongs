import { createClient } from "@/lib/supabase/server";
import { Button, Card, Input, Label, PageHeader, Select } from "@/components/ui";
import { createTeam } from "./actions";
import { TeamTable } from "./team-table";

export default async function TimesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: teams }, { data: coaches }] = await Promise.all([
    supabase
      .from("teams")
      .select("id, name, coach_id")
      .eq("championship_id", id)
      .order("name"),
    supabase
      .from("coaches")
      .select("id, name")
      .eq("championship_id", id)
      .order("name"),
  ]);

  const createTeamWithId = createTeam.bind(null, id);

  return (
    <div>
      <PageHeader eyebrow="Elenco de clubes" title="Times" />

      <Card className="mb-6 p-5">
        <form
          action={createTeamWithId}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <Label>Novo time</Label>
            <Input name="name" required placeholder="Nome do time" />
          </div>
          <div className="flex-1">
            <Label>Técnico</Label>
            <Select name="coach_id" defaultValue="">
              <option value="">Sem técnico</option>
              {(coaches ?? []).map((coach) => (
                <option key={coach.id} value={coach.id}>
                  {coach.name}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit">Adicionar</Button>
        </form>
      </Card>

      <TeamTable
        championshipId={id}
        teams={teams ?? []}
        coaches={coaches ?? []}
      />
    </div>
  );
}
