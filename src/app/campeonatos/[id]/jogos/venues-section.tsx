"use client";

import { useState } from "react";
import { Button, Card, Input, Label } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { createVenue, deleteVenue, updateVenue } from "./actions";

type Venue = { id: string; name: string; address: string | null };

export function VenuesSection({
  championshipId,
  venues,
}: {
  championshipId: string;
  venues: Venue[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <details className="mb-6 rounded-xl border border-border bg-surface/80 p-5 shadow-lg shadow-black/20 backdrop-blur">
      <summary className="cursor-pointer font-display text-base font-bold uppercase tracking-wide text-foreground">
        Locais / campos {venues.length > 0 ? `(${venues.length})` : ""}
      </summary>

      <div className="mt-4">
        <ActionForm
          action={(formData) => createVenue(championshipId, formData)}
          className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end"
        >
          <div className="flex-1 basis-40">
            <Label>Nome do local</Label>
            <Input name="name" required placeholder="Estádio Municipal" />
          </div>
          <div className="flex-1 basis-40">
            <Label>Endereço</Label>
            <Input name="address" placeholder="Opcional" />
          </div>
          <SubmitButton pendingText="Adicionando…">Adicionar local</SubmitButton>
        </ActionForm>

        {venues.length === 0 ? (
          <p className="text-sm text-muted">Nenhum local cadastrado ainda.</p>
        ) : (
          <ul className="space-y-2">
            {venues.map((venue) => (
              <li key={venue.id}>
                {editingId === venue.id ? (
                  <Card className="p-3">
                    <ActionForm
                      action={(formData) => updateVenue(venue.id, championshipId, formData)}
                      onSuccess={() => setEditingId(null)}
                      className="flex flex-wrap items-end gap-2"
                    >
                      <Input name="name" defaultValue={venue.name} required className="max-w-[12rem]" />
                      <Input
                        name="address"
                        defaultValue={venue.address ?? ""}
                        placeholder="Endereço"
                        className="max-w-[14rem]"
                      />
                      <SubmitButton pendingText="Salvando…">Salvar</SubmitButton>
                      <Button type="button" variant="secondary" onClick={() => setEditingId(null)}>
                        Cancelar
                      </Button>
                    </ActionForm>
                  </Card>
                ) : (
                  <Card className="flex items-center justify-between gap-3 p-3">
                    <div>
                      <p className="font-medium text-foreground">{venue.name}</p>
                      {venue.address && <p className="text-xs text-muted">{venue.address}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => setEditingId(venue.id)}>
                        Editar
                      </Button>
                      <form
                        action={async () => {
                          if (window.confirm(`Excluir o local "${venue.name}"?`)) {
                            const result = await deleteVenue(venue.id, championshipId);
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
      </div>
    </details>
  );
}
