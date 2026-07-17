import { createClient } from "@/lib/supabase/server";
import { Button, Card, FileInput, Input, Label, PageHeader, Select } from "@/components/ui";
import { generateGroupLabels } from "@/lib/groups";
import { createTeam } from "./actions";
import { TeamTable } from "./team-table";

export default async function TimesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: championship }, { data: teams }, { data: coaches }, { data: invites }] =
    await Promise.all([
      supabase
        .from("championships")
        .select("format, team_count, group_count")
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("teams")
        .select("id, name, coach_id, crest_url, owner_user_id, group_name")
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
  const showGroups = championship?.format === "copa";
  const groupLabels =
    showGroups && championship?.group_count
      ? generateGroupLabels(championship.group_count)
      : null;
  const teamCount = championship?.team_count ?? null;

  return (
    <div>
      <PageHeader
        eyebrow="Elenco de clubes"
        title="Times"
        action={
          teamCount ? (
            <span className="text-sm text-muted">
              {(teams ?? []).length} de {teamCount} times cadastrados
            </span>
          ) : undefined
        }
      />

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
            <Label>Escudo</Label>
            <FileInput name="crest" accept="image/*" />
          </div>
          {showGroups && (
            <div className="w-36">
              <Label>Grupo</Label>
              {groupLabels ? (
                <Select name="group_name" defaultValue="">
                  <option value="">Sem grupo</option>
                  {groupLabels.map((label) => (
                    <option key={label} value={label}>
                      {label}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input name="group_name" placeholder="Grupo A" />
              )}
            </div>
          )}
          <Button type="submit">Adicionar</Button>
        </form>
      </Card>

      <TeamTable
        championshipId={id}
        teams={teams ?? []}
        coaches={coaches ?? []}
        invites={invites ?? []}
        groupLabels={groupLabels}
        showGroups={showGroups}
      />
    </div>
  );
}
