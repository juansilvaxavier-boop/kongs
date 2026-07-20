import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, FileInput, Input, Label, PageHeader, Select, Textarea } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { updateChampionshipSettings } from "./actions";
import { SponsorsSection } from "./sponsors-section";

export default async function ConfiguracoesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: championship }, { data: sponsors }, { data: sponsorMetrics }] =
    await Promise.all([
      supabase
        .from("championships")
        .select(
          "format, has_knockout_stage, yellow_cards_for_suspension, team_count, group_count, rules_text, logo_url"
        )
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("sponsors")
        .select("id, name, logo_url, link_url")
        .eq("championship_id", id)
        .order("created_at"),
      supabase.rpc("sponsor_metrics", { p_championship_id: id }),
    ]);

  const metricsBySponsor = Object.fromEntries(
    (sponsorMetrics ?? []).map((row) => [row.sponsor_id, { views: row.views, clicks: row.clicks }])
  );

  if (!championship) notFound();

  const updateSettingsWithId = updateChampionshipSettings.bind(null, id);

  return (
    <div>
      <PageHeader eyebrow="Regras e formato" title="Configurações" />

      <Card className="max-w-xl p-5">
        <ActionForm action={updateSettingsWithId} className="flex flex-col gap-5">
          <div>
            <Label>Foto/logo do campeonato</Label>
            <div className="flex items-center gap-3">
              {championship.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={championship.logo_url}
                  alt=""
                  className="h-14 w-14 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 text-xs text-muted">
                  Sem foto
                </span>
              )}
              <FileInput name="logo" accept="image/*" className="max-w-xs" />
            </div>
          </div>

          <div>
            <Label>Formato do campeonato</Label>
            <Select name="format" defaultValue={championship.format}>
              <option value="liga">Liga (pontos corridos)</option>
              <option value="copa">Copa (fase de grupos)</option>
            </Select>
            <p className="mt-1 text-xs text-muted">
              Copa calcula uma classificação separada para cada grupo (defina o
              grupo de cada time na aba Times). Liga sempre usa uma tabela única.
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              name="has_knockout_stage"
              defaultChecked={championship.has_knockout_stage}
              className="h-4 w-4 rounded border-border accent-accent"
            />
            Este campeonato tem fase de mata-mata (habilita o link de
            chaveamento)
          </label>

          <div className="flex flex-wrap gap-5">
            <div className="w-36">
              <Label>Quantidade de times</Label>
              <Input
                name="team_count"
                type="number"
                min={1}
                placeholder="Opcional"
                defaultValue={championship.team_count ?? ""}
              />
            </div>
            <div className="w-36">
              <Label>Quantidade de grupos</Label>
              <Input
                name="group_count"
                type="number"
                min={1}
                placeholder="Se for Copa"
                defaultValue={championship.group_count ?? ""}
              />
            </div>
          </div>
          <p className="-mt-3 text-xs text-muted">
            Definir a quantidade de grupos habilita a escolha do grupo de cada
            time por uma lista (Grupo A, B, C...) na aba Times.
          </p>

          <div className="max-w-[10rem]">
            <Label>Cartões amarelos para suspensão</Label>
            <Input
              name="yellow_cards_for_suspension"
              type="number"
              min={1}
              required
              defaultValue={championship.yellow_cards_for_suspension}
            />
            <p className="mt-1 text-xs text-muted">
              Cartão vermelho sempre suspende para o próximo jogo.
            </p>
          </div>

          <div>
            <Label>Regulamento do campeonato</Label>
            <Textarea
              name="rules_text"
              rows={8}
              placeholder="Regras, critérios de desempate, punições, etc. Visível na página pública."
              defaultValue={championship.rules_text ?? ""}
            />
            <p className="mt-1 text-xs text-muted">
              Aparece na Visão Geral da página pública do campeonato. Deixe em
              branco para não exibir nada.
            </p>
          </div>

          <SubmitButton pendingText="Salvando…" className="self-start">
            Salvar
          </SubmitButton>
        </ActionForm>
      </Card>

      <div className="mt-6">
        <SponsorsSection
          championshipId={id}
          sponsors={sponsors ?? []}
          metricsBySponsor={metricsBySponsor}
        />
      </div>
    </div>
  );
}
