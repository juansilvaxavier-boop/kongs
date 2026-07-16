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

  const [{ data: teams }, { data: coaches }, { data: invites }] = await Promise.all([
    supabase
      .from("teams")
      .select("id, name, coach_id, crest_url, owner_user_id")
      .eq("championship_id", id)
      .order("name"),
    supabase
      .from("coaches")
      .select("id, name")
      .eq("championship_id", id)
      .order("name"),
    supabase
      .from("team_invites")
      .select("id, team_id, email")
      .eq("championship_id", id)
      .is("accepted_at", null),
  ]);

  const createTeamWithId = createTeam.bind(null, id);

  return (
    <div>
      <PageHeader eyebrow="Elenco de clubes" title="Times" />

      <Card className="mb-6 p-5">
        <form
          action={createTeamWithId}
          className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
        >
          <div className="flex-1 basis-40">
            <Label>Novo time</Label>
            <Input name="name" required placeholder="Nome do time" />
          </div>
          <div className="flex-1 basis-40">
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
          <div className="flex-1 basis-40">
            <Label>Escudo (URL)</Label>
            <Input name="crest_url" type="url" placeholder="https://..." />
          </div>
          <Button type="submit">Adicionar</Button>
        </form>
      </Card>

      <TeamTable
        championshipId={id}
        teams={teams ?? []}
        coaches={coaches ?? []}
        invites={invites ?? []}
      />
    </div>
  );
}
