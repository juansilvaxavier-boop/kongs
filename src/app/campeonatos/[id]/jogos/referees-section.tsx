"use client";

import { useState } from "react";
import { Button, Card, Input, Label } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { createReferee, deleteReferee, updateReferee } from "./actions";

type Referee = { id: string; name: string; cpf: string | null };
type RatingSummary = { average: number; count: number };

export function RefereesSection({
  championshipId,
  referees,
  averageRatingByReferee,
}: {
  championshipId: string;
  referees: Referee[];
  averageRatingByReferee?: Record<string, RatingSummary>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <details className="mb-6 rounded-xl border border-border bg-surface/80 p-5 shadow-lg shadow-black/20 backdrop-blur">
      <summary className="cursor-pointer font-display text-base font-bold uppercase tracking-wide text-foreground">
        Árbitros {referees.length > 0 ? `(${referees.length})` : ""}
      </summary>

      <div className="mt-4">
        <ActionForm
          action={(formData) => createReferee(championshipId, formData)}
          className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end"
        >
          <div className="flex-1 basis-40">
            <Label>Nome do árbitro</Label>
            <Input name="name" required placeholder="Nome completo" />
          </div>
          <div className="flex-1 basis-40">
            <Label>CPF</Label>
            <Input name="cpf" placeholder="Opcional" />
          </div>
          <SubmitButton pendingText="Adicionando…">Adicionar árbitro</SubmitButton>
        </ActionForm>

        {referees.length === 0 ? (
          <p className="text-sm text-muted">Nenhum árbitro cadastrado ainda.</p>
        ) : (
          <ul className="space-y-2">
            {referees.map((referee) => (
              <li key={referee.id}>
                {editingId === referee.id ? (
                  <Card className="p-3">
                    <ActionForm
                      action={(formData) => updateReferee(referee.id, championshipId, formData)}
                      onSuccess={() => setEditingId(null)}
                      className="flex flex-wrap items-end gap-2"
                    >
                      <Input name="name" defaultValue={referee.name} required className="max-w-[12rem]" />
                      <Input
                        name="cpf"
                        defaultValue={referee.cpf ?? ""}
                        placeholder="CPF"
                        className="max-w-[10rem]"
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
                      <p className="font-medium text-foreground">{referee.name}</p>
                      {referee.cpf && <p className="text-xs text-muted">CPF: {referee.cpf}</p>}
                      {averageRatingByReferee?.[referee.id] && (
                        <p className="text-xs text-muted">
                          ⭐ {averageRatingByReferee[referee.id].average.toFixed(1)} (
                          {averageRatingByReferee[referee.id].count}{" "}
                          {averageRatingByReferee[referee.id].count === 1
                            ? "avaliação"
                            : "avaliações"}
                          )
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => setEditingId(referee.id)}>
                        Editar
                      </Button>
                      <form
                        action={async () => {
                          if (window.confirm(`Excluir o árbitro "${referee.name}"?`)) {
                            const result = await deleteReferee(referee.id, championshipId);
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
