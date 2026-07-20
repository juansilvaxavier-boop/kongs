import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, EmptyState, FileInput, Input, Label, PageHeader, Select } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { getUserPermissions, isAdmin } from "@/lib/auth/roles";
import { createChampionship } from "./actions";
import { ChampionshipList } from "./championship-list";

export default async function CampeonatosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = await isAdmin(supabase);
  const permissions = admin ? [] : await getUserPermissions(supabase);
  const canCreate = admin || permissions.includes("manage_championships");

  const { data: championships } = await supabase
    .from("championships")
    .select("id, name, created_at, logo_url")
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader
        eyebrow="Todos os campeonatos"
        title="Campeonatos"
      />

      {canCreate && (
        <Card className="mb-8 p-5">
          <ActionForm
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
            <div className="flex-1 basis-40">
              <Label>Foto/logo (opcional)</Label>
              <FileInput name="logo" accept="image/*" />
            </div>
            <label className="flex items-center gap-2 pb-2 text-sm text-muted">
              <input
                type="checkbox"
                name="has_knockout_stage"
                className="h-4 w-4 rounded border-border accent-accent"
              />
              Com mata-mata
            </label>
            <SubmitButton pendingText="Criando…">Criar campeonato</SubmitButton>
          </ActionForm>
          <p className="mt-3 text-xs text-muted">
            Nº de times e nº de grupos são opcionais e podem ser alterados depois em Configurações.
          </p>
        </Card>
      )}

      {championships && championships.length > 0 ? (
        <ChampionshipList items={championships} />
      ) : (
        <EmptyState>Nenhum campeonato cadastrado ainda.</EmptyState>
      )}
    </div>
  );
}
