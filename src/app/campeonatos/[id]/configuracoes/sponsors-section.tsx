"use client";

import { useState } from "react";
import { Button, Card, FileInput, Input, Label } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { createSponsor, deleteSponsor, updateSponsor } from "./sponsors-actions";

type Sponsor = { id: string; name: string; logo_url: string | null; link_url: string | null };

export function SponsorsSection({
  championshipId,
  sponsors,
}: {
  championshipId: string;
  sponsors: Sponsor[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <Card className="max-w-xl p-5">
      <h2 className="mb-4 font-display text-lg font-bold uppercase tracking-wide text-foreground">
        Patrocinadores
      </h2>
      <p className="mb-4 text-xs text-muted">
        Os logos aparecem no rodapé da página pública do campeonato.
      </p>

      <ActionForm
        action={(formData) => createSponsor(championshipId, formData)}
        className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end"
      >
        <div className="flex-1 basis-40">
          <Label>Nome</Label>
          <Input name="name" required placeholder="Nome do patrocinador" />
        </div>
        <div className="flex-1 basis-40">
          <Label>Link (opcional)</Label>
          <Input name="link_url" type="url" placeholder="https://..." />
        </div>
        <div className="flex-1 basis-40">
          <Label>Logo</Label>
          <FileInput name="logo" accept="image/*" />
        </div>
        <SubmitButton pendingText="Adicionando…">Adicionar</SubmitButton>
      </ActionForm>

      {sponsors.length === 0 ? (
        <p className="text-sm text-muted">Nenhum patrocinador cadastrado ainda.</p>
      ) : (
        <ul className="space-y-2">
          {sponsors.map((sponsor) => (
            <li key={sponsor.id}>
              {editingId === sponsor.id ? (
                <Card className="p-3">
                  <ActionForm
                    action={(formData) => updateSponsor(sponsor.id, championshipId, formData)}
                    onSuccess={() => setEditingId(null)}
                    className="flex flex-wrap items-end gap-2"
                  >
                    <Input name="name" defaultValue={sponsor.name} required className="max-w-[10rem]" />
                    <Input
                      name="link_url"
                      type="url"
                      defaultValue={sponsor.link_url ?? ""}
                      placeholder="Link"
                      className="max-w-[12rem]"
                    />
                    <FileInput name="logo" accept="image/*" className="max-w-[10rem]" />
                    <SubmitButton pendingText="Salvando…">Salvar</SubmitButton>
                    <Button type="button" variant="secondary" onClick={() => setEditingId(null)}>
                      Cancelar
                    </Button>
                  </ActionForm>
                </Card>
              ) : (
                <Card className="flex items-center justify-between gap-3 p-3">
                  <div className="flex items-center gap-3">
                    {sponsor.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={sponsor.logo_url}
                        alt=""
                        className="h-10 w-10 rounded object-contain"
                      />
                    ) : (
                      <span className="flex h-10 w-10 items-center justify-center rounded bg-surface-2 text-xs font-bold text-muted">
                        {sponsor.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <div>
                      <p className="font-medium text-foreground">{sponsor.name}</p>
                      {sponsor.link_url && (
                        <p className="text-xs text-muted">{sponsor.link_url}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setEditingId(sponsor.id)}>
                      Editar
                    </Button>
                    <form
                      action={async () => {
                        if (window.confirm(`Excluir o patrocinador "${sponsor.name}"?`)) {
                          const result = await deleteSponsor(sponsor.id, championshipId);
                          if (!result.ok) alert(result.error);
                        }
                      }}
                    >
                      <Button type="submit" variant="danger">
                        Excluir
                      </Button>
                    </form>
                  </div>
                </Card>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
